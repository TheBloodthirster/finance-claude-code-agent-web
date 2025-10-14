/**
 * Web项目配置文件
 * 支持环境变量和默认值配置
 */

const path = require('path');
const fs = require('fs');

class WebConfig {
  constructor() {
    // 获取项目根目录
    this.PROJECT_ROOT = path.resolve(__dirname);
    
    // 从环境变量或默认值获取配置
    this.AGENT_PATH = process.env.FINANCE_AGENT_DIR || 
      path.resolve(this.PROJECT_ROOT, '..', 'finance-claude-code-agent');
    
    this.REPORTS_PATH = process.env.FINANCE_REPORTS_DIR || 
      path.resolve(this.PROJECT_ROOT, '..', 'finance-claude-code-agent-reports');
    
    // 服务器配置
    this.SERVER_PORT = process.env.SERVER_PORT || 3001;
    this.CLIENT_PORT = process.env.CLIENT_PORT || 3000;
    
    // CORS配置
    this.CORS_ORIGIN = process.env.CORS_ORIGIN || `http://localhost:${this.CLIENT_PORT}`;
    
    // SubAgent配置目录
    this.SUBAGENT_CONFIG_DIR = path.join(this.AGENT_PATH, '.iflow', 'agents', 'stock-analysis');
    
    // 验证路径是否存在
    this.validatePaths();
  }
  
  validatePaths() {
    const requiredPaths = [
      { name: 'AGENT_PATH', path: this.AGENT_PATH },
      { name: 'REPORTS_PATH', path: this.REPORTS_PATH }
    ];
    
    for (const { name, path: dirPath } of requiredPaths) {
      if (!fs.existsSync(dirPath)) {
        console.warn(`⚠️  警告: ${name} 路径不存在: ${dirPath}`);
        // 尝试创建目录
        try {
          fs.mkdirSync(dirPath, { recursive: true });
          console.log(`✅ 已创建目录: ${dirPath}`);
        } catch (error) {
          console.error(`❌ 无法创建目录 ${dirPath}:`, error.message);
        }
      }
    }
  }
  
  getSubAgentConfigPath(agentName) {
    return path.join(this.SUBAGENT_CONFIG_DIR, `${agentName}.md`);
  }
  
  getSubAgentPythonPath(agentName) {
    return path.join(this.SUBAGENT_CONFIG_DIR, `${agentName}.py`);
  }
  
  getReportPath(company, date) {
    return path.join(this.REPORTS_PATH, company, date);
  }
  
  toObject() {
    return {
      PROJECT_ROOT: this.PROJECT_ROOT,
      AGENT_PATH: this.AGENT_PATH,
      REPORTS_PATH: this.REPORTS_PATH,
      SERVER_PORT: this.SERVER_PORT,
      CLIENT_PORT: this.CLIENT_PORT,
      CORS_ORIGIN: this.CORS_ORIGIN,
      SUBAGENT_CONFIG_DIR: this.SUBAGENT_CONFIG_DIR
    };
  }
}

// 全局配置实例
const config = new WebConfig();

module.exports = {
  config,
  WebConfig
};

// 如果直接运行此文件，显示配置信息
if (require.main === module) {
  console.log('=== Web项目配置信息 ===');
  console.table(config.toObject());
}