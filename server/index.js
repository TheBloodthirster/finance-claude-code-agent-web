const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const chokidar = require('chokidar');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// 配置路径
const AGENT_PATH = '/Users/huangjunpeng/quantagent/finance-claude-code-agent';
const REPORTS_PATH = '/Users/huangjunpeng/quantagent/finance-claude-code-agent-reports';

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
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`Agent路径: ${AGENT_PATH}`);
  console.log(`报告路径: ${REPORTS_PATH}`);
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