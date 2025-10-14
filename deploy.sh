#!/bin/bash

# 部署脚本 - 用于服务器部署
# 使用方法: ./deploy.sh [环境] [基础路径]
# 例如: ./deploy.sh production /opt/finance-agent

set -e

ENVIRONMENT=${1:-development}
BASE_PATH=${2:-$(pwd)/..}

echo "🚀 开始部署 Finance Agent Web 系统..."
echo "📦 环境: $ENVIRONMENT"
echo "📁 基础路径: $BASE_PATH"

# 设置路径变量
AGENT_DIR="$BASE_PATH/finance-claude-code-agent"
REPORTS_DIR="$BASE_PATH/finance-claude-code-agent-reports"
WEB_DIR="$BASE_PATH/finance-claude-code-agent-web"

echo ""
echo "=== 检查目录结构 ==="
if [ ! -d "$AGENT_DIR" ]; then
    echo "❌ Agent目录不存在: $AGENT_DIR"
    exit 1
fi

if [ ! -d "$REPORTS_DIR" ]; then
    echo "📁 创建报告目录: $REPORTS_DIR"
    mkdir -p "$REPORTS_DIR"
fi

if [ ! -d "$WEB_DIR" ]; then
    echo "❌ Web目录不存在: $WEB_DIR"
    exit 1
fi

echo "✅ 目录结构检查完成"

echo ""
echo "=== 创建环境配置文件 ==="

# 创建主项目环境配置
cat > "$AGENT_DIR/.env" << EOF
# 自动生成的环境配置文件
FINANCE_REPORTS_DIR=$REPORTS_DIR
FINANCE_WEB_DIR=$WEB_DIR
FINANCE_AGENT_DIR=$AGENT_DIR
EOF

# 创建Web项目环境配置
cat > "$WEB_DIR/.env" << EOF
# 自动生成的环境配置文件
FINANCE_AGENT_DIR=$AGENT_DIR
FINANCE_REPORTS_DIR=$REPORTS_DIR
SERVER_PORT=3001
CLIENT_PORT=3000
CORS_ORIGIN=http://localhost:3000
NODE_ENV=$ENVIRONMENT
EOF

# 创建前端环境配置
cat > "$WEB_DIR/.env.local" << EOF
# 前端环境配置
REACT_APP_API_URL=http://localhost:3001
REACT_APP_AGENT_PATH=$AGENT_DIR
REACT_APP_REPORTS_PATH=$REPORTS_DIR
EOF

echo "✅ 环境配置文件创建完成"

echo ""
echo "=== 安装依赖 ==="
cd "$WEB_DIR"

if [ ! -d "node_modules" ]; then
    echo "📦 安装Node.js依赖..."
    npm install
else
    echo "📦 更新Node.js依赖..."
    npm update
fi

echo "✅ 依赖安装完成"

echo ""
echo "=== 测试配置 ==="
echo "🧪 测试配置文件..."
node -e "
const { config } = require('./config');
console.log('配置测试结果:');
console.table(config.toObject());
"

echo ""
echo "🎉 部署完成！"
echo ""
echo "=== 启动命令 ==="
echo "开发环境: npm run dev"
echo "生产环境: npm start"
echo "快速启动: node quick-start.js"
echo ""
echo "=== 访问地址 ==="
echo "前端: http://localhost:3000"
echo "后端: http://localhost:3001"
echo ""
echo "=== 配置文件位置 ==="
echo "主项目: $AGENT_DIR/.env"
echo "Web项目: $WEB_DIR/.env"
echo "前端项目: $WEB_DIR/.env.local"