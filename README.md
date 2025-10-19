# 股票分析Agent前端界面

一个精美的现代化前端界面，用于运行和查看股票分析Agent的结果。

## 🚀 功能特性

### 核心功能
- **实时分析执行**: 启动股票分析Agent并实时查看执行进度
- **智能报告展示**: 使用Markdown渲染器展示分析报告，支持目录导航
- **历史报告管理**: 浏览和管理所有历史分析报告
- **现代化UI**: 基于Ant Design的精美界面设计
- **响应式布局**: 支持桌面端和移动端访问
- **实时通信**: 使用WebSocket实现实时进度更新

### 🆕 News Matcher 智能新闻分析系统
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

## 📦 安装和运行

### 1. 安装依赖

```bash
cd finance-claude-code-agent-web
npm install
```

### 2. 启动后端服务

```bash
npm run server
```

后端服务将在 `http://localhost:3001` 启动

### 3. 启动前端应用

```bash
npm start
```

前端应用将在 `http://localhost:3000` 启动

### 4. 同时启动前后端（推荐）

```bash
# 在一个终端窗口启动后端
npm run server

# 在另一个终端窗口启动前端
npm start
```

### 🆕 5. 启动完整系统（包含News Matcher）

```bash
# 使用一键启动脚本
./start-with-news-matcher.sh

# 或者手动启动各个服务
# 1. 启动 News Matcher API
cd ../news_matcher
python main.py api --host 0.0.0.0 --port 5000

# 2. 启动后端服务
cd ../finance-claude-code-agent-web
npm run server

# 3. 启动前端应用
npm start
```

## 🎯 使用指南

### 仪表盘
- 查看系统运行状态和统计信息
- 监控Agent执行情况
- 快速访问常用功能

### 分析执行
1. 输入要分析的公司名称
2. 选择要执行的分析类型
3. 点击"开始分析"按钮
4. 实时查看分析进度和日志
5. 分析完成后查看结果摘要

### 分析报告
- 浏览所有历史分析报告
- 使用搜索和过滤功能快速找到目标报告
- 点击报告查看详细内容
- 支持下载和分享报告

### 报告详情
- 完整的Markdown格式报告展示
- 自动生成的目录导航
- 支持打印和下载
- 响应式设计，适配各种屏幕尺寸

### 系统设置
- 配置Agent路径和报告输出路径
- 设置执行参数和超时时间
- 配置自动化选项（自动保存、Git提交等）
- 管理通知和Webhook设置

### 🆕 News Matcher 功能
- **新闻匹配中心**: 单条和批量新闻匹配，实时查看匹配结果
- **新闻数据浏览**: 浏览系统获取的新闻，支持筛选和搜索
- **匹配结果管理**: 查看匹配历史，分析热门股票和行业
- **LLM智能矫正**: 使用AI提升匹配准确性，支持批量矫正
- **系统监控**: 实时监控系统状态和性能指标

## 📁 项目结构

```
finance-claude-code-agent-web/
├── public/                 # 静态资源
│   ├── index.html         # HTML模板
│   └── ...
├── src/                   # 源代码
│   ├── components/        # 组件
│   │   └── Layout/       # 布局组件
│   │       ├── Header.js # 顶部导航
│   │       └── Sidebar.js# 侧边栏
│   ├── pages/            # 页面组件
│   │   ├── Dashboard.js  # 仪表盘
│   │   ├── Analysis.js   # 分析执行
│   │   ├── Reports.js    # 报告列表
│   │   ├── ReportDetail.js# 报告详情
│   │   ├── Settings.js   # 系统设置
│   │   ├── NewsMatcherCenter.js    # 🆕 新闻匹配中心
│   │   ├── NewsBrowser.js          # 🆕 新闻数据浏览
│   │   ├── MatchResults.js         # 🆕 匹配结果管理
│   │   ├── LLMCorrection.js        # 🆕 LLM智能矫正
│   │   └── NewsMatcherMonitor.js   # 🆕 系统监控
│   ├── App.js            # 主应用组件
│   ├── App.css           # 应用样式
│   ├── index.js          # 应用入口
│   └── index.css         # 全局样式
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
- 🆕 News Matcher API端口: 5000

可以通过环境变量修改：
```bash
PORT=3001 npm run server  # 后端端口
PORT=3000 npm start       # 前端端口

# News Matcher 配置
NEWS_MATCHER_API_PORT=5000
NEWS_MATCHER_DIR=/path/to/news_matcher
```

## 🎨 界面预览

### 仪表盘
- 实时统计数据展示
- 性能趋势图表
- Agent状态监控
- 快速操作入口

### 分析执行页面
- 直观的分析配置界面
- 实时进度显示
- 详细的执行日志
- 分析结果预览

### 报告管理
- 卡片式报告列表
- 强大的搜索和过滤功能
- 报告状态和元信息显示
- 批量操作支持

### 报告详情
- 完整的Markdown渲染
- 自动目录生成
- 代码高亮显示
- 打印友好的样式

## 🚀 部署说明

### 开发环境
按照上述安装和运行步骤即可

### 生产环境
1. 构建前端应用：
```bash
npm run build
```

2. 配置生产环境变量
3. 使用PM2或其他进程管理器启动后端服务
4. 配置Nginx反向代理（可选）

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

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

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🆘 问题反馈

如果您遇到任何问题或有改进建议，请：

1. 查看 [Issues](https://github.com/your-repo/issues) 页面
2. 创建新的 Issue 描述问题
3. 提供详细的错误信息和复现步骤

## 📞 联系方式

- 项目维护者: [您的姓名]
- 邮箱: [您的邮箱]
- 项目地址: [GitHub仓库地址]