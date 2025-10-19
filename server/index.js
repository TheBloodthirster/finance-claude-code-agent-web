const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');
const { config } = require('../config');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: config.CORS_ORIGIN,
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// 使用配置文件中的路径
const AGENT_PATH = config.AGENT_PATH;
const REPORTS_PATH = config.REPORTS_PATH;

// 存储活跃的分析任务
const activeTasks = new Map();

// Socket连接处理
io.on('connection', (socket) => {
  console.log('客户端已连接:', socket.id);

  // 处理开始分析请求
  socket.on('start-analysis', async (data) => {
    const { company, analysisTypes, saveReport } = data;
    const taskId = `task_${Date.now()}`;
    
    console.log(`开始分析任务 ${taskId}:`, { company, analysisTypes });

    try {
      // 构建Python命令
      const pythonScript = path.join(AGENT_PATH, 'stock_analysis_main.py');
      const args = [pythonScript, company];
      
      if (analysisTypes && analysisTypes.length > 0) {
        args.push('--types', ...analysisTypes);
      }
      
      if (saveReport) {
        args.push('--save-report');
      }

      // 启动Python进程
      const pythonProcess = spawn('python', args, {
        cwd: AGENT_PATH,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // 存储任务信息
      activeTasks.set(taskId, {
        process: pythonProcess,
        company,
        analysisTypes,
        startTime: Date.now(),
        socket
      });

      // 发送初始进度
      socket.emit('analysis-progress', {
        taskId,
        step: 0,
        progress: 0,
        message: `开始分析 ${company}...`,
        type: 'info'
      });

      let currentStep = 0;
      let progress = 0;
      const totalSteps = analysisTypes ? analysisTypes.length : 5;

      // 处理标准输出
      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Python输出:', output);

        // 解析输出并更新进度
        if (output.includes('🚀 开始执行')) {
          currentStep++;
          progress = Math.min((currentStep / totalSteps) * 80, 80);
          
          socket.emit('analysis-progress', {
            taskId,
            step: 1,
            progress,
            message: output.trim(),
            type: 'info'
          });
        } else if (output.includes('✓') && output.includes('分析完成')) {
          progress = Math.min(progress + 15, 95);
          
          socket.emit('analysis-progress', {
            taskId,
            step: 1,
            progress,
            message: output.trim(),
            type: 'success'
          });
        } else if (output.includes('生成综合分析报告')) {
          socket.emit('analysis-progress', {
            taskId,
            step: 2,
            progress: 95,
            message: '正在生成综合报告...',
            type: 'info'
          });
        } else if (output.includes('报告已保存')) {
          socket.emit('analysis-progress', {
            taskId,
            step: 2,
            progress: 100,
            message: '报告生成完成',
            type: 'success'
          });
        }
      });

      // 处理标准错误
      pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error('Python错误:', error);
        
        // 过滤掉INFO级别的日志，只显示真正的错误
        if (!error.includes('INFO:') && !error.includes('DEBUG:')) {
          socket.emit('analysis-progress', {
            taskId,
            step: currentStep,
            progress,
            message: error.trim(),
            type: 'error'
          });
        }
      });

      // 处理进程结束
      pythonProcess.on('close', (code) => {
        console.log(`分析任务 ${taskId} 结束，退出码: ${code}`);
        
        if (code === 0) {
          // 分析成功完成
          const endTime = Date.now();
          const duration = Math.round((endTime - activeTasks.get(taskId).startTime) / 1000 / 60 * 10) / 10;
          
          socket.emit('analysis-complete', {
            taskId,
            company,
            duration,
            summary: {
              total_analyses: analysisTypes ? analysisTypes.length : 5,
              successful_analyses: analysisTypes ? analysisTypes.length : 5,
              failed_analyses: 0
            },
            overall_assessment: '分析已成功完成，请查看详细报告获取更多信息。',
            investment_recommendations: [
              '建议关注公司基本面变化',
              '密切关注行业发展趋势',
              '合理控制投资风险'
            ]
          });
        } else {
          // 分析失败
          socket.emit('analysis-error', {
            taskId,
            error: `分析进程异常退出，退出码: ${code}`
          });
        }

        // 清理任务
        activeTasks.delete(taskId);
      });

      // 处理进程错误
      pythonProcess.on('error', (error) => {
        console.error(`分析任务 ${taskId} 进程错误:`, error);
        
        socket.emit('analysis-error', {
          taskId,
          error: error.message
        });

        activeTasks.delete(taskId);
      });

    } catch (error) {
      console.error('启动分析任务失败:', error);
      
      socket.emit('analysis-error', {
        taskId,
        error: error.message
      });
    }
  });

  // 处理取消分析请求
  socket.on('cancel-analysis', (data) => {
    const { taskId } = data;
    
    if (activeTasks.has(taskId)) {
      const task = activeTasks.get(taskId);
      task.process.kill('SIGTERM');
      activeTasks.delete(taskId);
      
      socket.emit('analysis-cancelled', { taskId });
      console.log(`分析任务 ${taskId} 已取消`);
    }
  });

  // 处理断开连接
  socket.on('disconnect', () => {
    console.log('客户端已断开连接:', socket.id);
    
    // 清理该客户端的任务
    for (const [taskId, task] of activeTasks.entries()) {
      if (task.socket.id === socket.id) {
        task.process.kill('SIGTERM');
        activeTasks.delete(taskId);
        console.log(`清理断开连接客户端的任务: ${taskId}`);
      }
    }
  });
});

// News Matcher API路由

// 单条新闻匹配
app.post('/api/news-matcher/single', async (req, res) => {
  try {
    const { text, title, enableLLMCorrection, minScore, industryMinScore, llmConfidenceThreshold, enableIndustryMatching } = req.body;
    
    // 模拟调用news_matcher API
    const matchResult = {
      success: true,
      data: {
        stock_matches: [
          {
            stock_id: "000001.SZ",
            stock_name: "平安银行",
            score: 85.5,
            source: "semantic_match"
          }
        ],
        industry_matches: enableIndustryMatching ? [
          {
            industry: "银行",
            score: 0.92,
            match_type: "hybrid",
            keywords: ["银行", "金融"],
            confidence: 0.88
          }
        ] : [],
        processing_time: 0.234,
        llm_correction: enableLLMCorrection ? {
          applied: true,
          confidence: 0.89,
          reasoning: "新闻内容明确提及平安银行相关业务，匹配度很高",
          processing_time: 1.45
        } : null
      }
    };
    
    res.json(matchResult);
  } catch (error) {
    console.error('单条匹配失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 批量处理新闻匹配
app.post('/api/news-matcher/batch', async (req, res) => {
  try {
    const { daysBack, batchSize, minScore, enableLLMCorrection } = req.body;
    
    // 模拟批量处理结果
    const batchResult = {
      success: true,
      data: {
        processed: 150,
        stockMatches: 89,
        industryMatches: 67,
        duration: 8.5,
        results: []
      }
    };
    
    res.json(batchResult);
  } catch (error) {
    console.error('批量处理失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取新闻数据
app.get('/api/news-matcher/news', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    
    // 模拟新闻数据
    const mockNews = Array.from({ length: pageSize }, (_, index) => ({
      id: (page - 1) * pageSize + index + 1,
      title: `新闻标题 ${(page - 1) * pageSize + index + 1}`,
      content: `这是新闻内容的预览文本，包含了相关的股票和行业信息...`,
      source: ['新浪财经', '东方财富', '财联社', '证券时报'][index % 4],
      publish_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      category: ['财经', '股市', '公司', '行业'][index % 4],
      stock_matches: Math.random() > 0.3 ? [
        { stock_id: '000001.SZ', stock_name: '平安银行', score: 85.5 }
      ] : [],
      industry_matches: Math.random() > 0.4 ? [
        { industry: '银行', score: 0.92 }
      ] : []
    }));
    
    res.json({
      success: true,
      data: {
        news: mockNews,
        total: 1000
      }
    });
  } catch (error) {
    console.error('获取新闻数据失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取新闻统计数据
app.get('/api/news-matcher/stats', async (req, res) => {
  try {
    const stats = {
      success: true,
      data: {
        totalNews: 15420,
        todayNews: 234,
        matchedNews: 8765,
        sources: ['新浪财经', '东方财富', '财联社', '证券时报', '第一财经']
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取匹配结果
app.get('/api/news-matcher/results', async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    
    // 模拟匹配结果数据
    const mockResults = Array.from({ length: pageSize }, (_, index) => ({
      id: (page - 1) * pageSize + index + 1,
      news_title: `新闻标题 ${(page - 1) * pageSize + index + 1}`,
      news_content: `新闻内容预览...`,
      match_type: Math.random() > 0.5 ? 'stock' : 'industry',
      stock_id: '000001.SZ',
      stock_name: '平安银行',
      stock_score: 85.5 + Math.random() * 10,
      industry: '银行',
      industry_score: 0.8 + Math.random() * 0.2,
      match_source: ['regex_match', 'semantic_match', 'trie_match'][index % 3],
      process_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      llm_correction: Math.random() > 0.6 ? {
        applied: true,
        confidence: 0.8 + Math.random() * 0.2,
        reasoning: 'LLM矫正说明文本...',
        processing_time: 1.2 + Math.random() * 2
      } : null
    }));
    
    res.json({
      success: true,
      data: {
        matches: mockResults,
        total: 5000
      }
    });
  } catch (error) {
    console.error('获取匹配结果失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取匹配统计数据
app.get('/api/news-matcher/match-stats', async (req, res) => {
  try {
    const stats = {
      success: true,
      data: {
        totalMatches: 8765,
        stockMatches: 5432,
        industryMatches: 3333,
        avgScore: 78.5,
        llmCorrectionRate: 45.2,
        todayMatches: 156,
        topStocks: [
          { stock_id: '000001.SZ', stock_name: '平安银行', match_count: 89 },
          { stock_id: '000002.SZ', stock_name: '万科A', match_count: 76 },
          { stock_id: '600036.SH', stock_name: '招商银行', match_count: 65 }
        ],
        topIndustries: [
          { industry: '银行', match_count: 234, avg_score: 82.5 },
          { industry: '房地产', match_count: 198, avg_score: 75.3 },
          { industry: '电子信息', match_count: 167, avg_score: 79.8 }
        ]
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('获取匹配统计失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// LLM矫正相关API
app.post('/api/news-matcher/llm-correct', async (req, res) => {
  try {
    const { content, title, confidenceThreshold, originalMatches } = req.body;
    
    // 模拟LLM矫正结果
    const correctionResult = {
      success: true,
      data: {
        applied: true,
        confidence: 89.5,
        reasoning: '经过LLM分析，新闻内容与匹配的公司相关性很高，建议保留匹配结果并提升置信度。',
        processing_time: 2.34,
        corrected_matches: [
          {
            stock_id: '000001.SZ',
            stock_name: '平安银行',
            corrected_score: 92.5,
            original_score: 85.5,
            correction_type: 'enhanced'
          }
        ]
      }
    };
    
    res.json(correctionResult);
  } catch (error) {
    console.error('LLM矫正失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/news-matcher/llm-batch-correct', async (req, res) => {
  try {
    const { daysBack, batchSize, confidenceThreshold, limit } = req.body;
    
    // 模拟批量矫正结果
    const batchResults = Array.from({ length: Math.min(batchSize, 10) }, (_, index) => ({
      id: index + 1,
      news_title: `新闻标题 ${index + 1}`,
      applied: Math.random() > 0.3,
      confidence: 70 + Math.random() * 30,
      processing_time: 1 + Math.random() * 3,
      reasoning: `LLM矫正说明 ${index + 1}`,
      corrected_matches: [
        {
          stock_id: '000001.SZ',
          stock_name: '平安银行',
          corrected_score: 80 + Math.random() * 20
        }
      ]
    }));
    
    res.json({
      success: true,
      data: {
        processed: batchSize,
        results: batchResults
      }
    });
  } catch (error) {
    console.error('批量LLM矫正失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/news-matcher/llm-validate', async (req, res) => {
  try {
    const { content, companyName, title } = req.body;
    
    // 模拟验证结果
    const validationResult = {
      success: true,
      data: {
        relevance: Math.random() > 0.3,
        confidence: 70 + Math.random() * 30,
        processing_time: 1.5 + Math.random() * 2,
        reasoning: `经过分析，新闻内容与${companyName}的相关性评估完成。`
      }
    };
    
    res.json(validationResult);
  } catch (error) {
    console.error('LLM验证失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取LLM统计数据
app.get('/api/news-matcher/llm-stats', async (req, res) => {
  try {
    const stats = {
      success: true,
      data: {
        totalCorrections: 2345,
        successRate: 87.5,
        avgConfidence: 82.3,
        avgProcessingTime: 2.1,
        todayCorrections: 45
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('获取LLM统计失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 获取最近矫正记录
app.get('/api/news-matcher/recent-corrections', async (req, res) => {
  try {
    const recentCorrections = Array.from({ length: 10 }, (_, index) => ({
      id: index + 1,
      news_title: `最近矫正的新闻 ${index + 1}`,
      applied: Math.random() > 0.3,
      confidence: 70 + Math.random() * 30,
      processing_time: 1 + Math.random() * 3,
      reasoning: `矫正说明 ${index + 1}`,
      timestamp: new Date(Date.now() - index * 60 * 60 * 1000).toISOString()
    }));
    
    res.json({
      success: true,
      data: recentCorrections
    });
  } catch (error) {
    console.error('获取最近矫正记录失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 系统监控相关API
app.get('/api/news-matcher/system-status', async (req, res) => {
  try {
    const status = {
      success: true,
      data: {
        status: 'running',
        uptime: process.uptime(),
        lastUpdate: new Date().toISOString(),
        activeTasks: Math.floor(Math.random() * 5),
        queueSize: Math.floor(Math.random() * 20)
      }
    };
    
    res.json(status);
  } catch (error) {
    console.error('获取系统状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/news-matcher/performance', async (req, res) => {
  try {
    const performance = {
      success: true,
      data: {
        processingSpeed: 15 + Math.random() * 10,
        avgProcessingTime: 2 + Math.random() * 3,
        memoryUsage: 45 + Math.random() * 30,
        cpuUsage: 25 + Math.random() * 40,
        diskUsage: 60 + Math.random() * 20,
        networkLatency: 10 + Math.random() * 50
      }
    };
    
    res.json(performance);
  } catch (error) {
    console.error('获取性能指标失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/news-matcher/database-status', async (req, res) => {
  try {
    const dbStatus = {
      success: true,
      data: {
        mysql: {
          status: 'connected',
          responseTime: 5 + Math.random() * 20
        },
        milvus: {
          status: 'connected',
          responseTime: 10 + Math.random() * 30
        },
        totalRecords: 15420,
        todayRecords: 234
      }
    };
    
    res.json(dbStatus);
  } catch (error) {
    console.error('获取数据库状态失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/news-matcher/recent-activities', async (req, res) => {
  try {
    const activities = [
      {
        action: '批量处理完成',
        details: '处理了150条新闻，匹配89个股票',
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        type: 'success'
      },
      {
        action: 'LLM矫正执行',
        details: '矫正了25条匹配结果',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        type: 'info'
      },
      {
        action: '数据库连接恢复',
        details: 'Milvus连接已恢复正常',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        type: 'warning'
      }
    ];
    
    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('获取最近活动失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/news-matcher/error-logs', async (req, res) => {
  try {
    const errorLogs = [
      {
        id: 1,
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        level: 'WARNING',
        module: 'LLM_CORRECTOR',
        message: 'LLM API响应时间较长，建议检查网络连接'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
        level: 'ERROR',
        module: 'MILVUS_CLIENT',
        message: '向量数据库连接超时，正在重试'
      }
    ];
    
    res.json({
      success: true,
      data: errorLogs
    });
  } catch (error) {
    console.error('获取错误日志失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/news-matcher/matching-stats', async (req, res) => {
  try {
    const stats = {
      success: true,
      data: {
        totalMatches: 8765,
        stockMatches: 5432,
        industryMatches: 3333,
        llmCorrections: 1234,
        successRate: 87.5,
        avgScore: 78.5
      }
    };
    
    res.json(stats);
  } catch (error) {
    console.error('获取匹配统计失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Socket事件处理 - 新闻匹配
io.on('connection', (socket) => {
  console.log('客户端已连接:', socket.id);

  // 处理新闻匹配请求
  socket.on('start-news-match', async (data) => {
    const { mode, daysBack, batchSize, minScore } = data;
    const taskId = `news_match_${Date.now()}`;
    
    console.log(`开始新闻匹配任务 ${taskId}:`, data);

    // 模拟处理进度
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      
      if (progress < 100) {
        socket.emit('news-match-progress', {
          taskId,
          progress: Math.min(progress, 95),
          message: `正在处理新闻匹配... ${Math.floor(progress)}%`,
          type: 'info'
        });
      } else {
        clearInterval(interval);
        
        // 发送完成事件
        socket.emit('news-match-complete', {
          taskId,
          processedCount: batchSize || 100,
          stockMatches: Math.floor((batchSize || 100) * 0.6),
          industryMatches: Math.floor((batchSize || 100) * 0.4),
          duration: 5.5
        });
      }
    }, 1000);

    // 存储任务信息以便取消
    activeTasks.set(taskId, { interval, socket });
  });

  // 处理停止匹配请求
  socket.on('stop-news-match', (data) => {
    const { taskId } = data;
    
    if (activeTasks.has(taskId)) {
      const task = activeTasks.get(taskId);
      clearInterval(task.interval);
      activeTasks.delete(taskId);
      
      socket.emit('news-match-cancelled', { taskId });
      console.log(`新闻匹配任务 ${taskId} 已取消`);
    }
  });

  // 原有的分析相关事件处理
  // 处理开始分析请求
  socket.on('start-analysis', async (data) => {
    const { company, analysisTypes, saveReport } = data;
    const taskId = `task_${Date.now()}`;
    
    console.log(`开始分析任务 ${taskId}:`, { company, analysisTypes });

    try {
      // 构建Python命令
      const pythonScript = path.join(AGENT_PATH, 'stock_analysis_main.py');
      const args = [pythonScript, company];
      
      if (analysisTypes && analysisTypes.length > 0) {
        args.push('--types', ...analysisTypes);
      }
      
      if (saveReport) {
        args.push('--save-report');
      }

      // 启动Python进程
      const pythonProcess = spawn('python', args, {
        cwd: AGENT_PATH,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // 存储任务信息
      activeTasks.set(taskId, {
        process: pythonProcess,
        company,
        analysisTypes,
        startTime: Date.now(),
        socket
      });

      // 发送初始进度
      socket.emit('analysis-progress', {
        taskId,
        step: 0,
        progress: 0,
        message: `开始分析 ${company}...`,
        type: 'info'
      });

      let currentStep = 0;
      let progress = 0;
      const totalSteps = analysisTypes ? analysisTypes.length : 5;

      // 处理标准输出
      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Python输出:', output);

        // 解析输出并更新进度
        if (output.includes('🚀 开始执行')) {
          currentStep++;
          progress = Math.min((currentStep / totalSteps) * 80, 80);
          
          socket.emit('analysis-progress', {
            taskId,
            step: 1,
            progress,
            message: output.trim(),
            type: 'info'
          });
        } else if (output.includes('✓') && output.includes('分析完成')) {
          progress = Math.min(progress + 15, 95);
          
          socket.emit('analysis-progress', {
            taskId,
            step: 1,
            progress,
            message: output.trim(),
            type: 'success'
          });
        } else if (output.includes('生成综合分析报告')) {
          socket.emit('analysis-progress', {
            taskId,
            step: 2,
            progress: 95,
            message: '正在生成综合报告...',
            type: 'info'
          });
        } else if (output.includes('报告已保存')) {
          socket.emit('analysis-progress', {
            taskId,
            step: 2,
            progress: 100,
            message: '报告生成完成',
            type: 'success'
          });
        }
      });

      // 处理标准错误
      pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error('Python错误:', error);
        
        // 过滤掉INFO级别的日志，只显示真正的错误
        if (!error.includes('INFO:') && !error.includes('DEBUG:')) {
          socket.emit('analysis-progress', {
            taskId,
            step: currentStep,
            progress,
            message: error.trim(),
            type: 'error'
          });
        }
      });

      // 处理进程结束
      pythonProcess.on('close', (code) => {
        console.log(`分析任务 ${taskId} 结束，退出码: ${code}`);
        
        if (code === 0) {
          // 分析成功完成
          const endTime = Date.now();
          const duration = Math.round((endTime - activeTasks.get(taskId).startTime) / 1000 / 60 * 10) / 10;
          
          socket.emit('analysis-complete', {
            taskId,
            company,
            duration,
            summary: {
              total_analyses: analysisTypes ? analysisTypes.length : 5,
              successful_analyses: analysisTypes ? analysisTypes.length : 5,
              failed_analyses: 0
            },
            overall_assessment: '分析已成功完成，请查看详细报告获取更多信息。',
            investment_recommendations: [
              '建议关注公司基本面变化',
              '密切关注行业发展趋势',
              '合理控制投资风险'
            ]
          });
        } else {
          // 分析失败
          socket.emit('analysis-error', {
            taskId,
            error: `分析进程异常退出，退出码: ${code}`
          });
        }

        // 清理任务
        activeTasks.delete(taskId);
      });

      // 处理进程错误
      pythonProcess.on('error', (error) => {
        console.error(`分析任务 ${taskId} 进程错误:`, error);
        
        socket.emit('analysis-error', {
          taskId,
          error: error.message
        });

        activeTasks.delete(taskId);
      });

    } catch (error) {
      console.error('启动分析任务失败:', error);
      
      socket.emit('analysis-error', {
        taskId,
        error: error.message
      });
    }
  });

  // 处理取消分析请求
  socket.on('cancel-analysis', (data) => {
    const { taskId } = data;
    
    if (activeTasks.has(taskId)) {
      const task = activeTasks.get(taskId);
      task.process.kill('SIGTERM');
      activeTasks.delete(taskId);
      
      socket.emit('analysis-cancelled', { taskId });
      console.log(`分析任务 ${taskId} 已取消`);
    }
  });

  // 处理断开连接
  socket.on('disconnect', () => {
    console.log('客户端已断开连接:', socket.id);
    
    // 清理该客户端的任务
    for (const [taskId, task] of activeTasks.entries()) {
      if (task.socket.id === socket.id) {
        task.process.kill('SIGTERM');
        activeTasks.delete(taskId);
        console.log(`清理断开连接客户端的任务: ${taskId}`);
      }
    }
  });
});

// API路由

// 获取报告列表
app.get('/api/reports', async (req, res) => {
  try {
    const reports = [];
    
    if (await fs.pathExists(REPORTS_PATH)) {
      const companies = await fs.readdir(REPORTS_PATH);
      
      for (const company of companies) {
        // 跳过隐藏文件、.git目录和README.md文件
        if (company.startsWith('.') || company === 'README.md') continue;
        
        const companyPath = path.join(REPORTS_PATH, company);
        const stat = await fs.stat(companyPath);
        
        if (stat.isDirectory()) {
          const dates = await fs.readdir(companyPath);
          
          for (const date of dates) {
            const datePath = path.join(companyPath, date);
            const dateStat = await fs.stat(datePath);
            
            if (dateStat.isDirectory()) {
              const readmePath = path.join(datePath, 'README.md');
              
              if (await fs.pathExists(readmePath)) {
                const readmeContent = await fs.readFile(readmePath, 'utf-8');
                const fileSize = Math.round(readmeContent.length / 1024 * 10) / 10; // KB
                
                // 计算分析准确率（基于内容长度和完整性）
                const accuracy = calculateAccuracy(readmeContent);
                
                // 估算分析时长（基于文件数量）
                const duration = await estimateDuration(datePath);
                
                reports.push({
                  id: `${company}_${date}`,
                  company,
                  date: `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`,
                  status: 'completed',
                  analysisTypes: extractAnalysisTypes(readmeContent),
                  duration: duration,
                  accuracy: accuracy,
                  fileSize: `${fileSize}KB`,
                  path: datePath,
                  createdAt: dateStat.mtime
                });
              }
            }
          }
        }
      }
    }
    
    // 按创建时间倒序排列
    reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    res.json(reports);
  } catch (error) {
    console.error('获取报告列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取报告内容
app.get('/api/reports/:company/:date', async (req, res) => {
  try {
    const { company, date } = req.params;
    const readmePath = path.join(REPORTS_PATH, company, date, 'README.md');
    
    if (await fs.pathExists(readmePath)) {
      const content = await fs.readFile(readmePath, 'utf-8');
      res.json({ content });
    } else {
      res.status(404).json({ error: '报告文件不存在' });
    }
  } catch (error) {
    console.error('获取报告内容失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 下载报告
app.get('/api/reports/:company/:date/download', async (req, res) => {
  try {
    const { company, date } = req.params;
    const readmePath = path.join(REPORTS_PATH, company, date, 'README.md');
    
    if (await fs.pathExists(readmePath)) {
      const filename = `${company}_分析报告_${date}.md`;
      res.download(readmePath, filename);
    } else {
      res.status(404).json({ error: '报告文件不存在' });
    }
  } catch (error) {
    console.error('下载报告失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取系统状态
app.get('/api/status', (req, res) => {
  res.json({
    activeTasks: activeTasks.size,
    agentPath: AGENT_PATH,
    reportsPath: REPORTS_PATH,
    uptime: process.uptime()
  });
});

// Agent管理API

// 获取所有Agent列表
app.get('/api/agents', async (req, res) => {
  try {
    const agentsPath = path.join(AGENT_PATH, '.iflow/agents/stock-analysis');
    
    if (!(await fs.pathExists(agentsPath))) {
      return res.status(404).json({ error: 'Agent目录不存在' });
    }

    const files = await fs.readdir(agentsPath);
    const agents = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        const agentName = file.replace('.md', '');
        const agentPath = path.join(agentsPath, file);
        const pyPath = path.join(agentsPath, `${agentName}.py`);
        
        try {
          const content = await fs.readFile(agentPath, 'utf-8');
          const agent = parseAgentConfig(content, agentName);
          
          // 检查Python文件是否存在
          agent.hasPythonFile = await fs.pathExists(pyPath);
          
          // 默认启用状态（可以从配置文件或数据库读取）
          agent.enabled = true;
          
          agents.push(agent);
        } catch (error) {
          console.error(`解析Agent配置失败: ${file}`, error);
        }
      }
    }

    res.json(agents);
  } catch (error) {
    console.error('获取Agent列表失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取Agent详细内容
app.get('/api/agents/:name/content', async (req, res) => {
  try {
    const { name } = req.params;
    const agentPath = path.join(AGENT_PATH, '.iflow/agents/stock-analysis', `${name}.md`);
    
    if (!(await fs.pathExists(agentPath))) {
      return res.status(404).json({ error: 'Agent配置文件不存在' });
    }

    const content = await fs.readFile(agentPath, 'utf-8');
    res.json({ content });
  } catch (error) {
    console.error('获取Agent内容失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 切换Agent启用状态
app.post('/api/agents/:name/toggle', async (req, res) => {
  try {
    const { name } = req.params;
    const { enabled } = req.body;
    
    // 这里可以将状态保存到配置文件或数据库
    // 目前只是返回成功响应
    
    console.log(`Agent ${name} ${enabled ? '启用' : '禁用'}`);
    res.json({ success: true, enabled });
  } catch (error) {
    console.error('切换Agent状态失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 测试Agent
app.post('/api/agents/:name/test', async (req, res) => {
  try {
    const { name } = req.params;
    const { company, testMode } = req.body;
    
    const agentPath = path.join(AGENT_PATH, '.iflow/agents/stock-analysis', `${name}.py`);
    
    if (!(await fs.pathExists(agentPath))) {
      return res.status(404).json({ error: 'Agent Python文件不存在' });
    }

    // 执行简单的Python语法检查
    const pythonProcess = spawn('python', ['-m', 'py_compile', agentPath], {
      cwd: AGENT_PATH,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let success = true;
    let errorMessage = '';

    pythonProcess.stderr.on('data', (data) => {
      success = false;
      errorMessage += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0 && success) {
        res.json({ 
          success: true, 
          message: `Agent ${name} 语法检查通过`,
          testResult: {
            syntaxCheck: true,
            agentName: name,
            company: company || '测试公司',
            timestamp: new Date().toISOString()
          }
        });
      } else {
        res.json({ 
          success: false, 
          message: `Agent ${name} 语法检查失败: ${errorMessage}`,
          testResult: {
            syntaxCheck: false,
            error: errorMessage,
            agentName: name,
            timestamp: new Date().toISOString()
          }
        });
      }
    });

  } catch (error) {
    console.error('测试Agent失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 运行Agent
app.post('/api/agents/:name/run', async (req, res) => {
  try {
    const { name } = req.params;
    const { company, runMode } = req.body;
    
    if (!company) {
      return res.status(400).json({ error: '公司名称不能为空' });
    }

    const agentPath = path.join(AGENT_PATH, '.iflow/agents/stock-analysis', `${name}.py`);
    
    if (!(await fs.pathExists(agentPath))) {
      return res.status(404).json({ error: 'Agent Python文件不存在' });
    }

    console.log(`开始运行Agent: ${name}, 公司: ${company}`);

    // 运行Python Agent
    const pythonProcess = spawn('python', [agentPath, company], {
      cwd: AGENT_PATH,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PYTHONPATH: AGENT_PATH }
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code === 0) {
        res.json({
          success: true,
          message: `Agent ${name} 运行完成`,
          runResult: {
            agentName: name,
            company: company,
            exitCode: code,
            output: output,
            timestamp: new Date().toISOString(),
            duration: '模拟运行时间: 2.5分钟'
          }
        });
      } else {
        res.json({
          success: false,
          message: `Agent ${name} 运行失败`,
          runResult: {
            agentName: name,
            company: company,
            exitCode: code,
            output: output,
            error: errorOutput,
            timestamp: new Date().toISOString()
          }
        });
      }
    });

    pythonProcess.on('error', (error) => {
      console.error(`Agent ${name} 进程错误:`, error);
      res.status(500).json({
        success: false,
        error: error.message,
        runResult: {
          agentName: name,
          company: company,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      });
    });

  } catch (error) {
    console.error('运行Agent失败:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取Agent运行状态
app.get('/api/agents/status', (req, res) => {
  // 模拟Agent状态数据
  const agentStatus = {
    'management-analysis': { status: 'idle', lastRun: Date.now() - 300000 },
    'business-model': { status: 'idle', lastRun: Date.now() - 600000 },
    'competition-strategy': { status: 'running', lastRun: Date.now() },
    'valuation-hype': { status: 'idle', lastRun: Date.now() - 480000 },
    'equity-distribution': { status: 'idle', lastRun: Date.now() - 720000 }
  };
  
  res.json(agentStatus);
});

// 辅助函数：从README内容中提取分析类型
function extractAnalysisTypes(content) {
  const types = [];
  if (content.includes('## 管理层分析')) types.push('管理层分析');
  if (content.includes('## 商业模式研究')) types.push('商业模式研究');
  if (content.includes('## 竞争格局与战略研究')) types.push('竞争格局分析');
  if (content.includes('## 估值与市场炒作因素研究')) types.push('估值分析');
  if (content.includes('## 股权分布研究')) types.push('股权分布研究');
  return types;
}

// 辅助函数：计算分析准确率
function calculateAccuracy(content) {
  // 基于内容长度和完整性计算准确率
  const baseAccuracy = 85;
  const contentLength = content.length;
  
  // 内容越长，准确率越高（最高98%）
  let accuracy = baseAccuracy + Math.min(contentLength / 1000, 13);
  
  // 检查是否包含关键部分
  const keyParts = [
    '## 管理层分析',
    '## 商业模式研究', 
    '## 竞争格局',
    '## 估值',
    '## 股权分布',
    '## 综合评估',
    '## 投资建议',
    '## 风险提示'
  ];
  
  const foundParts = keyParts.filter(part => content.includes(part)).length;
  const completeness = foundParts / keyParts.length;
  
  // 根据完整性调整准确率
  accuracy = accuracy * (0.7 + 0.3 * completeness);
  
  return Math.round(Math.min(accuracy, 98));
}

// 辅助函数：估算分析时长
async function estimateDuration(datePath) {
  try {
    const files = await fs.readdir(datePath);
    const analysisFiles = files.filter(file => 
      file.endsWith('分析结果.md') || file.includes('分析结果')
    );
    
    // 基于分析文件数量估算时长
    const baseTime = 8; // 基础时间8分钟
    const timePerAnalysis = 2.5; // 每个分析2.5分钟
    const totalTime = baseTime + (analysisFiles.length * timePerAnalysis);
    
    return `${Math.round(totalTime)}分钟`;
  } catch (error) {
    return '15分钟'; // 默认值
  }
}

// 辅助函数：解析Agent配置文件
function parseAgentConfig(content, agentName) {
  const lines = content.split('\n');
  const config = {
    name: agentName,
    displayName: agentName,
    type: agentName,
    description: '',
    whenToUse: '',
    allowedTools: [],
    color: 'blue',
    enabled: true
  };

  let inFrontMatter = false;
  let frontMatterEnd = false;
  let descriptionStarted = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '---') {
      if (!inFrontMatter) {
        inFrontMatter = true;
        continue;
      } else {
        frontMatterEnd = true;
        inFrontMatter = false;
        continue;
      }
    }

    if (inFrontMatter) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      
      switch (key.trim()) {
        case 'agent-type':
          config.type = value;
          break;
        case 'name':
          config.name = value;
          config.displayName = getDisplayName(value);
          break;
        case 'description':
          config.description = value;
          break;
        case 'when-to-use':
          config.whenToUse = value;
          break;
        case 'allowed-tools':
          config.allowedTools = value.split(',').map(t => t.trim()).filter(t => t);
          break;
        case 'color':
          config.color = value;
          break;
      }
    } else if (frontMatterEnd && !descriptionStarted) {
      // 前置元数据结束后，开始读取描述内容
      if (line && !line.startsWith('#')) {
        if (!config.description) {
          config.description = line;
        }
        descriptionStarted = true;
      }
    }
  }

  return config;
}

// 辅助函数：获取Agent显示名称
function getDisplayName(agentName) {
  const nameMap = {
    'management-analysis': '管理层分析',
    'business-model': '商业模式研究',
    'competition-strategy': '竞争格局与战略研究',
    'valuation-hype': '估值与市场炒作因素研究',
    'equity-distribution': '股权分布研究'
  };
  return nameMap[agentName] || agentName;
}

// 启动服务器
const PORT = config.SERVER_PORT;
server.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📁 Agent路径: ${AGENT_PATH}`);
  console.log(`📊 报告路径: ${REPORTS_PATH}`);
  console.log(`🌐 CORS源: ${config.CORS_ORIGIN}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  
  // 终止所有活跃任务
  for (const [taskId, task] of activeTasks.entries()) {
    task.process.kill('SIGTERM');
    console.log(`终止任务: ${taskId}`);
  }
  
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  
  // 终止所有活跃任务
  for (const [taskId, task] of activeTasks.entries()) {
    task.process.kill('SIGTERM');
    console.log(`终止任务: ${taskId}`);
  }
  
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});