# 股票分析Agent前端界面

一个精美的现代化前端界面，用于运行和查看股票分析Agent的结果，集成了News Matcher智能新闻分析系统。

## 🚀 快速开始

### 推荐启动方式

```bash
cd finance-claude-code-agent-web
node quick-start.js
```

### 其他启动方式

```bash
# 方法二：使用Shell脚本
./start.sh

# 方法三：手动启动
npm install
npm run server  # 在一个终端窗口
npm start       # 在另一个终端窗口
```

### 启动完整系统（包含News Matcher）

```bash
# 一键启动脚本（推荐）
./start-with-news-matcher.sh

# 手动启动各个服务
cd ../news_matcher
python main.py api --host 0.0.0.0 --port 5000

cd ../finance-claude-code-agent-web
npm run server
npm start
```

## 🎯 功能特性

### 核心功能
- **实时分析执行**: 启动股票分析Agent并实时查看执行进度
- **智能报告展示**: 使用Markdown渲染器展示分析报告，支持目录导航
- **历史报告管理**: 浏览和管理所有历史分析报告
- **现代化UI**: 基于Ant Design的精美界面设计
- **响应式布局**: 支持桌面端和移动端访问
- **实时通信**: 使用WebSocket实现实时进度更新

### News Matcher 智能新闻分析系统
- **新闻匹配中心**: 单条和批量新闻匹配，支持股票和行业识别
- **新闻数据浏览**: 浏览系统获取的新闻数据，支持多维度筛选
- **匹配结果管理**: 查看和分析新闻匹配结果，统计热门股票和行业
- **LLM智能矫正**: 使用大语言模型提升匹配准确性和可信度
- **系统监控**: 实时监控系统状态、性能指标和处理情况

## 🛠️ 技术栈

### 前端
- **React 18**: 现代化的前端框架
- **Ant Design 5**: 企业级UI组件库
- **React Router**: 单页应用路由管理
- **React Markdown**: Markdown内容渲染
- **Recharts**: 数据可视化图表
- **Socket.IO Client**: 实时通信客户端

### 后端
- **Node.js**: 服务器运行环境
- **Express**: Web应用框架
- **Socket.IO**: 实时双向通信
- **Child Process**: Python进程管理
- **fs-extra**: 文件系统操作
- **Chokidar**: 文件监控

## 📱 界面功能详解

### 1. 仪表盘 (Dashboard)

**访问路径**: `http://localhost:3000/`

**主要功能**:
- 📊 实时统计数据展示（总分析次数、今日完成数量、成功率统计、平均耗时）
- 📈 本周分析趋势图表
- 🤖 Agent状态监控
- ⚡ 快速操作入口

### 2. 分析执行 (Analysis)

**访问路径**: `http://localhost:3000/analysis`

**操作步骤**:
1. **输入公司名称**: 例如"紫金黄金国际"、"泡泡玛特"等
2. **选择分析类型**: 可多选以下类型
   - 管理层分析
   - 商业模式研究
   - 竞争格局与战略研究
   - 估值与市场炒作因素研究
   - 股权分布研究
3. **点击开始分析**: 系统会自动调用Python脚本执行分析
4. **实时监控进度**: 查看执行步骤和日志输出
5. **查看分析结果**: 分析完成后显示结果摘要

### 3. 分析报告 (Reports)

**访问路径**: `http://localhost:3000/reports`

**主要功能**:
- 📋 报告列表展示
- 🔍 搜索和过滤功能（公司名称搜索、状态筛选、日期范围）
- 👁️ 查看报告详情
- 📥 下载报告文件
- 🔗 分享报告链接

### 4. 报告详情 (Report Detail)

**访问路径**: `http://localhost:3000/reports/:company/:date`

**核心特性**:
- 📖 完整Markdown渲染
- 📑 自动生成目录导航
- 🎨 代码语法高亮
- 📱 响应式设计
- 🖨️ 打印友好样式

### 5. News Matcher 功能模块

#### 新闻匹配中心 (`/news-matcher/center`)
- 单条新闻匹配：输入新闻内容，实时获取匹配结果
- 批量处理：批量处理历史新闻数据
- LLM智能矫正：使用AI提升匹配准确性

#### 新闻数据浏览 (`/news-matcher/news-browser`)
- 浏览系统获取的所有新闻数据
- 多维度筛选：关键词、时间范围、来源、匹配状态
- 查看新闻详情和匹配结果

#### 匹配结果管理 (`/news-matcher/results`)
- 查看所有新闻匹配结果
- 统计分析：热门股票、行业排行
- 匹配效果分析

#### LLM智能矫正 (`/news-matcher/llm-correction`)
- 单条矫正：对单条新闻进行AI矫正
- 批量矫正：批量处理和矫正匹配结果
- 单项验证：验证公司与新闻的相关性

#### 系统监控 (`/news-matcher/monitor`)
- 实时监控系统运行状态
- 性能指标：CPU、内存、磁盘使用率
- 数据库连接状态
- 错误日志查看

### 6. 系统设置 (Settings)

**访问路径**: `http://localhost:3000/settings`

**配置项目**:
- **路径配置**: 报告输出路径、Agent项目路径、GitHub仓库地址
- **执行配置**: 最大并发分析数、分析超时时间、日志级别
- **自动化配置**: 自动保存报告、自动Git提交
- **通知配置**: 启用通知、邮件通知、Webhook URL

## 📁 项目结构

```
finance-claude-code-agent-web/
├── public/                 # 静态资源
├── src/                   # 源代码
│   ├── components/        # 组件
│   │   └── Layout/       # 布局组件
│   ├── pages/            # 页面组件
│   │   ├── Dashboard.js  # 仪表盘
│   │   ├── Analysis.js   # 分析执行
│   │   ├── Reports.js    # 报告列表
│   │   ├── ReportDetail.js# 报告详情
│   │   ├── Settings.js   # 系统设置
│   │   ├── NewsMatcherCenter.js    # 新闻匹配中心
│   │   ├── NewsBrowser.js          # 新闻数据浏览
│   │   ├── MatchResults.js         # 匹配结果管理
│   │   ├── LLMCorrection.js        # LLM智能矫正
│   │   └── NewsMatcherMonitor.js   # 系统监控
│   ├── App.js            # 主应用组件
│   └── index.js          # 应用入口
├── server/               # 后端服务
│   └── index.js          # 服务器主文件
├── package.json          # 项目配置
└── README.md            # 项目说明
```

## 🔧 配置说明

### 路径配置
在 `server/index.js` 中配置以下路径：

```javascript
const AGENT_PATH = '/Users/huangjunpeng/quantagent/finance-claude-code-agent';
const REPORTS_PATH = '/Users/huangjunpeng/quantagent/finance-claude-code-agent-reports';
```

### 端口配置
- 前端默认端口: 3000
- 后端默认端口: 3001
- News Matcher API端口: 5000

### 环境变量
```bash
# News Matcher 配置
NEWS_MATCHER_DIR=/path/to/news_matcher
NEWS_MATCHER_API_PORT=5000
NEWS_MATCHER_API_URL=http://localhost:5000

# 服务端口
SERVER_PORT=3001
CLIENT_PORT=3000
```

## 🐛 常见问题

### Q1: 分析执行失败怎么办？

**可能原因**:
- Python环境未正确配置
- Agent项目路径错误
- 依赖包未安装

**解决方案**:
1. 检查Python是否已安装：`python --version`
2. 确认Agent项目路径是否正确
3. 检查系统设置中的路径配置
4. 查看执行日志中的错误信息

### Q2: News Matcher API 无法连接

```bash
# 检查 News Matcher 是否启动
curl http://localhost:5000/health

# 手动启动 News Matcher API
cd news_matcher
python main.py api --host 0.0.0.0 --port 5000
```

### Q3: 端口被占用

```bash
# 检查端口占用
lsof -i :3000  # 前端
lsof -i :3001  # 后端
lsof -i :5000  # News Matcher

# 停止占用进程
kill -9 <PID>
```

### Q4: 实时进度不更新？

**解决方案**:
1. 刷新页面重新建立WebSocket连接
2. 检查网络连接状态
3. 尝试使用其他浏览器

## 🧪 测试验证

### 运行集成测试
```bash
cd finance-claude-code-agent-web
node test-news-matcher-integration.js
```

### 手动测试步骤
1. **单条匹配测试**: 输入"腾讯控股发布财报，营收增长8%"
2. **行业匹配测试**: 输入"新能源汽车销量创新高"
3. **LLM矫正测试**: 输入包含模糊公司信息的新闻

## 📊 性能优化

### 批量处理优化
- 批次大小建议：50-200条
- 启用LLM矫正时建议减小批次大小
- 避免同时运行多个批量任务

### 系统资源监控
- CPU使用率保持在80%以下
- 内存使用率保持在80%以下
- 定期清理日志文件

## 🔄 更新和维护

### 更新代码
```bash
git pull origin main
npm install  # 如果有新依赖
npm start
```

### 清理缓存
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

## 📝 更新日志

### v1.1.0 (2025-10-19)
- 🆕 集成 News Matcher 智能新闻分析系统
- 🆕 新增新闻匹配中心，支持单条和批量匹配
- 🆕 新增新闻数据浏览功能，支持多维度筛选
- 🆕 新增匹配结果管理，统计分析功能
- 🆕 新增LLM智能矫正功能，提升匹配准确性
- 🆕 新增系统监控功能，实时监控性能指标
- 🆕 添加一键启动脚本，简化部署流程

### v1.0.0 (2025-10-13)
- 初始版本发布
- 实现基础的分析执行和报告查看功能
- 支持实时进度监控
- 完整的Markdown报告渲染

## 🆘 获取帮助

如果遇到问题：
1. 查看本文档的常见问题部分
2. 运行集成测试脚本检查系统状态
3. 查看相关日志文件
4. 在项目 Issues 页面提交问题

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情