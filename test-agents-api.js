#!/usr/bin/env node

/**
 * 测试Agent API是否能正确读取配置
 */

const fs = require('fs-extra');
const path = require('path');

const { config } = require('./config');
const AGENT_PATH = config.AGENT_PATH;

// 解析Agent配置文件
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
    }
  }

  return config;
}

// 获取Agent显示名称
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

async function testAgentsAPI() {
  console.log('🧪 测试Agent API...\n');
  
  try {
    const agentsPath = path.join(AGENT_PATH, '.iflow/agents/stock-analysis');
    console.log('📁 检查Agent目录:', agentsPath);
    
    if (!(await fs.pathExists(agentsPath))) {
      console.log('❌ Agent目录不存在');
      return;
    }

    const files = await fs.readdir(agentsPath);
    console.log('📋 发现文件:', files);
    
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
          
          console.log(`\n📄 ${file}:`);
          console.log(`  名称: ${agent.displayName}`);
          console.log(`  类型: ${agent.type}`);
          console.log(`  颜色: ${agent.color}`);
          console.log(`  描述: ${agent.description.substring(0, 100)}...`);
          console.log(`  Python文件: ${agent.hasPythonFile ? '✅' : '❌'}`);
          console.log(`  工具数量: ${agent.allowedTools.length}`);
          
          agents.push(agent);
        } catch (error) {
          console.error(`❌ 解析Agent配置失败: ${file}`, error.message);
        }
      }
    }
    
    console.log('\n📊 Agent汇总:');
    console.log(`总共找到 ${agents.length} 个Agent`);
    
    agents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.displayName} (${agent.type}) - ${agent.color}`);
    });
    
    console.log('\n✅ Agent API测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testAgentsAPI();