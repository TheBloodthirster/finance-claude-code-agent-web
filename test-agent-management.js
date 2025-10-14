#!/usr/bin/env node

const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 使用配置文件
const { config } = require('./config');
const AGENT_PATH = config.AGENT_PATH;

// 测试Agent管理API
async function testAgentManagement() {
  console.log('🧪 测试Agent管理功能...\n');

  try {
    // 1. 测试获取Agent列表
    console.log('1️⃣ 测试获取Agent列表...');
    const agentsPath = path.join(AGENT_PATH, '.iflow/agents/stock-analysis');
    
    if (!(await fs.pathExists(agentsPath))) {
      console.log('❌ Agent目录不存在:', agentsPath);
      return;
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
          agent.enabled = true;
          
          agents.push(agent);
          console.log(`   ✅ 发现Agent: ${agent.displayName} (${agentName})`);
        } catch (error) {
          console.log(`   ❌ 解析Agent失败: ${file} - ${error.message}`);
        }
      }
    }

    console.log(`   📊 总共发现 ${agents.length} 个Agent\n`);

    // 2. 测试Agent配置解析
    console.log('2️⃣ 测试Agent配置解析...');
    agents.forEach(agent => {
      console.log(`   Agent: ${agent.displayName}`);
      console.log(`   - 类型: ${agent.type}`);
      console.log(`   - 颜色: ${agent.color}`);
      console.log(`   - Python文件: ${agent.hasPythonFile ? '✅' : '❌'}`);
      console.log(`   - 工具数量: ${agent.allowedTools?.length || 0}`);
      console.log('');
    });

    // 3. 测试Python文件语法检查
    console.log('3️⃣ 测试Python文件语法检查...');
    for (const agent of agents) {
      if (agent.hasPythonFile) {
        const pyPath = path.join(agentsPath, `${agent.name}.py`);
        console.log(`   检查 ${agent.name}.py...`);
        
        try {
          const { spawn } = require('child_process');
          const pythonProcess = spawn('python', ['-m', 'py_compile', pyPath], {
            cwd: AGENT_PATH,
            stdio: ['pipe', 'pipe', 'pipe']
          });

          let success = true;
          let errorMessage = '';

          pythonProcess.stderr.on('data', (data) => {
            success = false;
            errorMessage += data.toString();
          });

          await new Promise((resolve) => {
            pythonProcess.on('close', (code) => {
              if (code === 0 && success) {
                console.log(`   ✅ ${agent.name}.py 语法检查通过`);
              } else {
                console.log(`   ❌ ${agent.name}.py 语法检查失败: ${errorMessage}`);
              }
              resolve();
            });
          });
        } catch (error) {
          console.log(`   ❌ ${agent.name}.py 检查失败: ${error.message}`);
        }
      } else {
        console.log(`   ⚠️  ${agent.name}.py 文件不存在`);
      }
    }

    console.log('\n🎉 Agent管理功能测试完成！');
    console.log('\n📋 测试结果总结:');
    console.log(`   - 发现Agent数量: ${agents.length}`);
    console.log(`   - 有Python文件: ${agents.filter(a => a.hasPythonFile).length}`);
    console.log(`   - 缺少Python文件: ${agents.filter(a => !a.hasPythonFile).length}`);

  } catch (error) {
    console.error('❌ 测试失败:', error);
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

// 运行测试
testAgentManagement();