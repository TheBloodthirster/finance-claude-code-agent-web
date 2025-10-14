#!/usr/bin/env node

/**
 * 快速启动脚本 - 用于开发和测试
 * 这个脚本会同时启动前端和后端服务
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { config } = require('./config');

console.log('🚀 股票分析Agent前端系统快速启动...\n');
console.log('📁 使用配置:');
console.log(`   Agent路径: ${config.AGENT_PATH}`);
console.log(`   报告路径: ${config.REPORTS_PATH}`);
console.log(`   服务器端口: ${config.SERVER_PORT}`);
console.log(`   前端端口: ${config.CLIENT_PORT}\n`);

// 检查依赖是否已安装
if (!fs.existsSync(path.join(__dirname, 'node_modules'))) {
  console.log('📦 正在安装依赖...');
  const install = spawn('npm', ['install'], { stdio: 'inherit' });
  
  install.on('close', (code) => {
    if (code === 0) {
      console.log('✅ 依赖安装完成\n');
      startServices();
    } else {
      console.error('❌ 依赖安装失败');
      process.exit(1);
    }
  });
} else {
  startServices();
}

function startServices() {
  console.log('🔧 启动后端服务...');
  
  // 启动后端服务
  const server = spawn('node', ['server/index.js'], {
    stdio: ['inherit', 'pipe', 'pipe']
  });

  server.stdout.on('data', (data) => {
    console.log(`[后端] ${data.toString().trim()}`);
  });

  server.stderr.on('data', (data) => {
    console.error(`[后端错误] ${data.toString().trim()}`);
  });

  // 等待后端启动
  setTimeout(() => {
    console.log('🎨 启动前端应用...');
    
    // 启动前端应用
    const client = spawn('npm', ['start'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, BROWSER: 'none' } // 防止自动打开浏览器
    });

    client.stdout.on('data', (data) => {
      const output = data.toString();
      if (!output.includes('webpack compiled') && !output.includes('Compiled successfully')) {
        console.log(`[前端] ${output.trim()}`);
      }
    });

    client.stderr.on('data', (data) => {
      const error = data.toString();
      if (!error.includes('Warning:') && !error.includes('Note:')) {
        console.error(`[前端错误] ${error.trim()}`);
      }
    });

    // 等待前端启动完成
    setTimeout(() => {
      console.log('\n🎉 系统启动完成！');
      console.log('📱 前端地址: http://localhost:3000');
      console.log('🔧 后端地址: http://localhost:3001');
      console.log('\n💡 提示: 按 Ctrl+C 停止服务\n');
    }, 5000);

    // 处理进程退出
    process.on('SIGINT', () => {
      console.log('\n🛑 正在停止服务...');
      server.kill('SIGTERM');
      client.kill('SIGTERM');
      setTimeout(() => {
        console.log('✅ 服务已停止');
        process.exit(0);
      }, 1000);
    });

  }, 2000);
}