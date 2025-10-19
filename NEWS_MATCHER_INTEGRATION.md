# News Matcher 系统集成文档

## 📋 概述

本文档描述了如何将 News Matcher 智能新闻分析系统集成到股票分析Agent前端界面中。News Matcher 是一个基于向量语义搜索和LLM智能矫正的新闻匹配系统，能够自动识别新闻中的股票公司和相关行业。

## 🎯 集成功能

### 1. 新闻匹配中心 (`/news-matcher/center`)
- **单条匹配**: 输入新闻内容，实时获取股票和行业匹配结果
- **批量处理**: 批量处理历史新闻数据，支持时间范围和内容过滤
- **LLM智能矫正**: 使用大语言模型提升匹配准确性
- **实时进度监控**: WebSocket实时显示处理进度和日志

### 2. 新闻数据浏览 (`/news-matcher/news-browser`)
- **新闻列表**: 浏览系统获取的所有新闻数据
- **多维筛选**: 支持关键词、时间范围、来源、匹配状态等筛选
- **详情查看**: 查看新闻完整内容和匹配结果
- **数据导出**: 支持导出筛选后的新闻数据

### 3. 匹配结果管理 (`/news-matcher/results`)
- **结果列表**: 查看所有新闻匹配结果
- **统计分析**: 显示匹配统计数据和热门股票/行业
- **结果详情**: 查看匹配详细信息和LLM矫正记录
- **性能分析**: 匹配准确率和处理效率分析

### 4. LLM智能矫正 (`/news-matcher/llm-correction`)
- **单条矫正**: 对单条新闻进行LLM智能矫正
- **批量矫正**: 批量处理和矫正匹配结果
- **单项验证**: 验证特定公司与新闻的相关性
- **矫正统计**: LLM矫正效果和性能统计

### 5. 系统监控 (`/news-matcher/monitor`)
- **系统状态**: 实时监控系统运行状态和性能指标
- **数据库状态**: MySQL和Milvus数据库连接状态
- **处理性能**: CPU、内存、磁盘使用率监控
- **错误日志**: 系统错误和警告日志查看

## 🛠️ 技术实现

### 前端组件
```
src/pages/
├── NewsMatcherCenter.js     # 新闻匹配中心
├── NewsBrowser.js          # 新闻数据浏览
├── MatchResults.js         # 匹配结果管理
├── LLMCorrection.js        # LLM智能矫正
└── NewsMatcherMonitor.js   # 系统监控
```

### 后端API路由
```
/api/news-matcher/
├── single                  # 单条新闻匹配
├── batch                   # 批量处理
├── news                    # 获取新闻数据
├── results                 # 获取匹配结果
├── llm-correct            # LLM矫正
├── llm-batch-correct      # 批量LLM矫正
├── llm-validate           # LLM验证
├── system-status          # 系统状态
├── performance            # 性能指标
└── database-status        # 数据库状态
```

### WebSocket事件
```javascript
// 客户端发送
socket.emit('start-news-match', matchData);
socket.emit('stop-news-match', { taskId });

// 服务端响应
socket.on('news-match-progress', progressData);
socket.on('news-match-complete', resultData);
socket.on('news-match-error', errorData);
```

## 📦 依赖包

### 新增依赖
```json
{
  "moment": "^2.29.4"  // 时间处理库
}
```

### 现有依赖
- React 18
- Ant Design 5
- Socket.IO Client
- React Router

## 🚀 部署配置

### 环境变量
```bash
# News Matcher 配置
NEWS_MATCHER_DIR=/path/to/news_matcher
NEWS_MATCHER_API_PORT=5000
NEWS_MATCHER_API_URL=http://localhost:5000
```

### 配置文件更新
在 `config.js` 中添加了 News Matcher 相关配置：
```javascript
this.NEWS_MATCHER_PATH = process.env.NEWS_MATCHER_DIR || 
  path.resolve(this.PROJECT_ROOT, '..', 'news_matcher');
this.NEWS_MATCHER_API_PORT = process.env.NEWS_MATCHER_API_PORT || 5000;
this.NEWS_MATCHER_API_URL = process.env.NEWS_MATCHER_API_URL || 
  `http://localhost:${this.NEWS_MATCHER_API_PORT}`;
```

## 🔧 使用指南

### 1. 启动 News Matcher API 服务
```bash
cd /path/to/news_matcher
python main.py api --host 0.0.0.0 --port 5000
```

### 2. 启动前端服务
```bash
cd finance-claude-code-agent-web
npm run server  # 启动后端服务 (端口3001)
npm start       # 启动前端应用 (端口3000)
```

### 3. 访问新功能
- 新闻匹配中心: http://localhost:3000/news-matcher/center
- 新闻数据浏览: http://localhost:3000/news-matcher/news-browser
- 匹配结果管理: http://localhost:3000/news-matcher/results
- LLM智能矫正: http://localhost:3000/news-matcher/llm-correction
- 系统监控: http://localhost:3000/news-matcher/monitor

## 📊 功能特性

### 智能匹配算法
- **正则表达式匹配**: 识别股票代码和公司名称
- **语义向量匹配**: 使用 sentence-transformers 进行语义相似度计算
- **行业匹配**: 基于关键词和语义的混合行业匹配
- **LLM智能矫正**: 使用大语言模型提升匹配准确性

### 实时处理能力
- **WebSocket通信**: 实时显示处理进度和状态
- **批量处理**: 支持大规模新闻数据批量处理
- **异步处理**: 非阻塞的后台处理机制
- **进度监控**: 详细的处理日志和进度跟踪

### 数据可视化
- **统计图表**: 匹配结果统计和趋势分析
- **性能监控**: 系统性能指标实时展示
- **热门排行**: 热门股票和行业排行榜
- **准确率分析**: 匹配准确率和LLM矫正效果分析

## 🔍 API接口说明

### 单条新闻匹配
```javascript
POST /api/news-matcher/single
{
  "text": "新闻内容",
  "title": "新闻标题",
  "enableLLMCorrection": true,
  "minScore": 15.0,
  "industryMinScore": 0.6
}
```

### 批量处理
```javascript
POST /api/news-matcher/batch
{
  "daysBack": 7,
  "batchSize": 100,
  "minScore": 15.0,
  "enableLLMCorrection": true,
  "contentFilter": "关键词"
}
```

### LLM矫正
```javascript
POST /api/news-matcher/llm-correct
{
  "content": "新闻内容",
  "title": "新闻标题",
  "confidenceThreshold": 0.7,
  "originalMatches": [...]
}
```

## 🎨 界面设计

### 设计原则
- **一致性**: 与现有界面风格保持一致
- **易用性**: 直观的操作流程和清晰的信息展示
- **响应式**: 支持不同屏幕尺寸的设备
- **实时性**: 实时更新数据和状态信息

### 色彩方案
- **主色调**: #1890ff (蓝色) - 匹配股票相关功能
- **辅助色**: #722ed1 (紫色) - 行业匹配相关功能
- **强调色**: #fa8c16 (橙色) - LLM矫正相关功能
- **成功色**: #52c41a (绿色) - 成功状态
- **警告色**: #faad14 (黄色) - 警告状态
- **错误色**: #ff4d4f (红色) - 错误状态

## 🚨 注意事项

### 性能考虑
1. **批量处理**: 建议批次大小不超过200条，避免内存溢出
2. **实时更新**: WebSocket连接数量限制，避免过多并发连接
3. **数据缓存**: 合理使用缓存减少API调用频率
4. **错误处理**: 完善的错误处理和重试机制

### 安全考虑
1. **输入验证**: 对用户输入进行严格验证和过滤
2. **API限流**: 实施API调用频率限制
3. **数据脱敏**: 敏感数据的适当脱敏处理
4. **权限控制**: 根据需要实施用户权限控制

## 🔮 未来扩展

### 计划功能
1. **自定义规则**: 支持用户自定义匹配规则
2. **模型训练**: 在线模型训练和优化功能
3. **多语言支持**: 支持多种语言的新闻匹配
4. **API集成**: 与更多外部数据源集成
5. **移动端适配**: 开发移动端专用界面

### 技术优化
1. **性能优化**: 进一步优化匹配算法性能
2. **缓存策略**: 实施更智能的缓存策略
3. **监控告警**: 完善的系统监控和告警机制
4. **自动化测试**: 增加自动化测试覆盖率

## 📞 技术支持

如有问题或建议，请联系开发团队：
- 项目地址: [GitHub仓库]
- 文档地址: [在线文档]
- 问题反馈: [Issues页面]

---

**版本**: v1.0.0  
**更新日期**: 2024年10月  
**兼容性**: React 18+, Node.js 16+, News Matcher v2.1+