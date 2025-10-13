#!/bin/bash

# 股票分析Agent前端启动脚本

echo "🚀 启动股票分析Agent前端系统..."

# 检查Node.js是否安装
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js"
    exit 1
fi

# 检查npm是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装，请先安装 npm"
    exit 1
fi

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装项目依赖..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
fi

# 检查Python环境
echo "🐍 检查Python环境..."
if ! command -v python &> /dev/null; then
    echo "❌ Python 未安装，请先安装 Python"
    exit 1
fi

# 检查Agent项目路径
AGENT_PATH="/Users/huangjunpeng/quantagent/finance-claude-code-agent"
if [ ! -d "$AGENT_PATH" ]; then
    echo "❌ Agent项目路径不存在: $AGENT_PATH"
    echo "请确保股票分析Agent项目已正确安装"
    exit 1
fi

# 检查报告输出路径
REPORTS_PATH="/Users/huangjunpeng/quantagent/finance-claude-code-agent-reports"
if [ ! -d "$REPORTS_PATH" ]; then
    echo "📁 创建报告输出目录: $REPORTS_PATH"
    mkdir -p "$REPORTS_PATH"
fi

echo "✅ 环境检查完成"

# 启动后端服务
echo "🔧 启动后端服务..."
npm run server &
SERVER_PID=$!

# 等待后端服务启动
sleep 3

# 检查后端服务是否启动成功
if ! curl -s http://localhost:3001/api/status > /dev/null; then
    echo "❌ 后端服务启动失败"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "✅ 后端服务启动成功 (PID: $SERVER_PID)"

# 启动前端应用
echo "🎨 启动前端应用..."
npm start &
CLIENT_PID=$!

echo "✅ 前端应用启动成功 (PID: $CLIENT_PID)"

# 等待用户输入以停止服务
echo ""
echo "🎉 股票分析Agent前端系统已启动！"
echo ""
echo "📱 前端地址: http://localhost:3000"
echo "🔧 后端地址: http://localhost:3001"
echo ""
echo "按 Ctrl+C 停止服务..."

# 捕获中断信号
trap 'echo ""; echo "🛑 正在停止服务..."; kill $SERVER_PID $CLIENT_PID 2>/dev/null; echo "✅ 服务已停止"; exit 0' INT

# 等待进程结束
wait