#!/bin/bash

# 启动完整的股票分析系统（包含News Matcher）
# 使用方法: ./start-with-news-matcher.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js"
        exit 1
    fi
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装，请先安装 npm"
        exit 1
    fi
    
    # 检查Python
    if ! command -v python &> /dev/null && ! command -v python3 &> /dev/null; then
        log_error "Python 未安装，请先安装 Python"
        exit 1
    fi
    
    log_success "系统依赖检查完成"
}

# 检查项目路径
check_paths() {
    log_info "检查项目路径..."
    
    # 当前目录应该是 finance-claude-code-agent-web
    if [ ! -f "package.json" ]; then
        log_error "请在 finance-claude-code-agent-web 目录下运行此脚本"
        exit 1
    fi
    
    # 检查 news_matcher 路径
    NEWS_MATCHER_PATH="../news_matcher"
    if [ ! -d "$NEWS_MATCHER_PATH" ]; then
        log_warning "News Matcher 目录不存在: $NEWS_MATCHER_PATH"
        log_info "请确保 news_matcher 项目位于正确的路径"
    fi
    
    # 检查 finance-claude-code-agent 路径
    AGENT_PATH="../finance-claude-code-agent"
    if [ ! -d "$AGENT_PATH" ]; then
        log_warning "Agent 目录不存在: $AGENT_PATH"
    fi
    
    log_success "项目路径检查完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装前端依赖..."
    
    if [ ! -d "node_modules" ]; then
        npm install
    else
        log_info "依赖已存在，跳过安装"
    fi
    
    log_success "前端依赖安装完成"
}

# 启动 News Matcher API
start_news_matcher() {
    log_info "启动 News Matcher API 服务..."
    
    NEWS_MATCHER_PATH="../news_matcher"
    
    if [ -d "$NEWS_MATCHER_PATH" ]; then
        # 检查是否已经在运行
        if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
            log_warning "端口 5000 已被占用，News Matcher API 可能已在运行"
        else
            log_info "在后台启动 News Matcher API..."
            cd "$NEWS_MATCHER_PATH"
            
            # 检查Python命令
            PYTHON_CMD="python"
            if command -v python3 &> /dev/null; then
                PYTHON_CMD="python3"
            fi
            
            # 启动API服务
            nohup $PYTHON_CMD main.py api --host 0.0.0.0 --port 5000 > news_matcher_api.log 2>&1 &
            NEWS_MATCHER_PID=$!
            
            cd - > /dev/null
            
            # 等待服务启动
            sleep 3
            
            if kill -0 $NEWS_MATCHER_PID 2>/dev/null; then
                log_success "News Matcher API 已启动 (PID: $NEWS_MATCHER_PID)"
                echo $NEWS_MATCHER_PID > .news_matcher_pid
            else
                log_error "News Matcher API 启动失败"
                return 1
            fi
        fi
    else
        log_warning "News Matcher 目录不存在，跳过 API 启动"
        log_info "您可以手动启动 News Matcher API: python main.py api --port 5000"
    fi
}

# 启动后端服务
start_backend() {
    log_info "启动后端服务..."
    
    # 检查端口是否被占用
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
        log_warning "端口 3001 已被占用，后端服务可能已在运行"
    else
        log_info "在后台启动后端服务..."
        nohup npm run server > backend.log 2>&1 &
        BACKEND_PID=$!
        
        # 等待服务启动
        sleep 3
        
        if kill -0 $BACKEND_PID 2>/dev/null; then
            log_success "后端服务已启动 (PID: $BACKEND_PID)"
            echo $BACKEND_PID > .backend_pid
        else
            log_error "后端服务启动失败"
            return 1
        fi
    fi
}

# 启动前端应用
start_frontend() {
    log_info "启动前端应用..."
    
    # 检查端口是否被占用
    if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
        log_warning "端口 3000 已被占用，前端应用可能已在运行"
    else
        log_info "启动前端应用 (这将在前台运行)..."
        npm start
    fi
}

# 停止服务
stop_services() {
    log_info "停止所有服务..."
    
    # 停止 News Matcher API
    if [ -f ".news_matcher_pid" ]; then
        NEWS_MATCHER_PID=$(cat .news_matcher_pid)
        if kill -0 $NEWS_MATCHER_PID 2>/dev/null; then
            kill $NEWS_MATCHER_PID
            log_success "News Matcher API 已停止"
        fi
        rm -f .news_matcher_pid
    fi
    
    # 停止后端服务
    if [ -f ".backend_pid" ]; then
        BACKEND_PID=$(cat .backend_pid)
        if kill -0 $BACKEND_PID 2>/dev/null; then
            kill $BACKEND_PID
            log_success "后端服务已停止"
        fi
        rm -f .backend_pid
    fi
    
    # 停止占用端口的进程
    for port in 3000 3001 5000; do
        PID=$(lsof -ti:$port)
        if [ ! -z "$PID" ]; then
            kill $PID 2>/dev/null || true
            log_info "已停止端口 $port 上的进程"
        fi
    done
}

# 显示帮助信息
show_help() {
    echo "股票分析系统启动脚本"
    echo ""
    echo "使用方法:"
    echo "  $0 [选项]"
    echo ""
    echo "选项:"
    echo "  start     启动完整系统 (默认)"
    echo "  stop      停止所有服务"
    echo "  restart   重启所有服务"
    echo "  status    查看服务状态"
    echo "  help      显示此帮助信息"
    echo ""
    echo "服务端口:"
    echo "  前端应用:        http://localhost:3000"
    echo "  后端API:         http://localhost:3001"
    echo "  News Matcher:    http://localhost:5000"
    echo ""
    echo "新增功能页面:"
    echo "  新闻匹配中心:    http://localhost:3000/news-matcher/center"
    echo "  新闻数据浏览:    http://localhost:3000/news-matcher/news-browser"
    echo "  匹配结果管理:    http://localhost:3000/news-matcher/results"
    echo "  LLM智能矫正:     http://localhost:3000/news-matcher/llm-correction"
    echo "  系统监控:        http://localhost:3000/news-matcher/monitor"
}

# 查看服务状态
show_status() {
    log_info "检查服务状态..."
    
    echo ""
    echo "端口占用情况:"
    
    # 检查各个端口
    for port in 3000 3001 5000; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
            PID=$(lsof -ti:$port)
            PROCESS=$(ps -p $PID -o comm= 2>/dev/null || echo "未知")
            echo "  端口 $port: ✅ 运行中 (PID: $PID, 进程: $PROCESS)"
        else
            echo "  端口 $port: ❌ 未运行"
        fi
    done
    
    echo ""
    echo "服务访问地址:"
    echo "  前端应用:        http://localhost:3000"
    echo "  后端API:         http://localhost:3001"
    echo "  News Matcher:    http://localhost:5000"
}

# 主函数
main() {
    case "${1:-start}" in
        "start")
            log_info "启动股票分析系统（包含News Matcher）..."
            check_dependencies
            check_paths
            install_dependencies
            start_news_matcher
            start_backend
            
            log_success "系统启动完成！"
            echo ""
            echo "访问地址:"
            echo "  前端应用:        http://localhost:3000"
            echo "  后端API:         http://localhost:3001"
            echo "  News Matcher:    http://localhost:5000"
            echo ""
            echo "新增功能:"
            echo "  新闻匹配中心:    http://localhost:3000/news-matcher/center"
            echo "  新闻数据浏览:    http://localhost:3000/news-matcher/news-browser"
            echo "  匹配结果管理:    http://localhost:3000/news-matcher/results"
            echo "  LLM智能矫正:     http://localhost:3000/news-matcher/llm-correction"
            echo "  系统监控:        http://localhost:3000/news-matcher/monitor"
            echo ""
            log_info "正在启动前端应用..."
            start_frontend
            ;;
        "stop")
            stop_services
            ;;
        "restart")
            log_info "重启系统..."
            stop_services
            sleep 2
            main start
            ;;
        "status")
            show_status
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "未知选项: $1"
            show_help
            exit 1
            ;;
    esac
}

# 捕获退出信号，清理后台进程
trap 'stop_services; exit' INT TERM

# 运行主函数
main "$@"