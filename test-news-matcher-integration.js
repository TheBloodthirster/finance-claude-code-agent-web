#!/usr/bin/env node

/**
 * News Matcher 集成测试脚本
 * 测试前端与 News Matcher API 的集成是否正常工作
 */

const axios = require('axios');
const colors = require('colors');

// 配置
const CONFIG = {
  FRONTEND_URL: 'http://localhost:3000',
  BACKEND_URL: 'http://localhost:3001',
  NEWS_MATCHER_URL: 'http://localhost:5000',
  TIMEOUT: 5000
};

// 测试用例
const TEST_CASES = {
  // 后端API测试
  backend: [
    {
      name: '获取新闻数据',
      url: '/api/news-matcher/news',
      method: 'GET'
    },
    {
      name: '获取匹配结果',
      url: '/api/news-matcher/results',
      method: 'GET'
    },
    {
      name: '获取系统状态',
      url: '/api/news-matcher/system-status',
      method: 'GET'
    },
    {
      name: '单条新闻匹配',
      url: '/api/news-matcher/single',
      method: 'POST',
      data: {
        text: '腾讯控股发布季度财报，营收增长显著',
        title: '腾讯财报',
        enableLLMCorrection: true
      }
    }
  ],
  
  // News Matcher API测试（如果可用）
  newsMatcher: [
    {
      name: '健康检查',
      url: '/health',
      method: 'GET'
    },
    {
      name: '股票匹配',
      url: '/match',
      method: 'POST',
      data: {
        text: '苹果公司发布新产品，股价上涨5%'
      }
    }
  ]
};

// 日志函数
const log = {
  info: (msg) => console.log('ℹ️ '.blue + msg),
  success: (msg) => console.log('✅ '.green + msg.green),
  warning: (msg) => console.log('⚠️ '.yellow + msg.yellow),
  error: (msg) => console.log('❌ '.red + msg.red),
  title: (msg) => console.log('\n' + '='.repeat(50).cyan + '\n' + msg.cyan.bold + '\n' + '='.repeat(50).cyan)
};

// HTTP请求函数
async function makeRequest(baseUrl, testCase) {
  try {
    const config = {
      method: testCase.method,
      url: baseUrl + testCase.url,
      timeout: CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    if (testCase.data) {
      config.data = testCase.data;
    }
    
    const response = await axios(config);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      status: error.response?.status || 0,
      error: error.message,
      code: error.code
    };
  }
}

// 检查服务是否运行
async function checkService(name, url) {
  log.info(`检查 ${name} 服务...`);
  
  try {
    const response = await axios.get(url, { timeout: CONFIG.TIMEOUT });
    log.success(`${name} 服务运行正常 (状态码: ${response.status})`);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log.error(`${name} 服务未启动 (${url})`);
    } else {
      log.error(`${name} 服务检查失败: ${error.message}`);
    }
    return false;
  }
}

// 运行测试用例
async function runTests(serviceName, baseUrl, testCases) {
  log.title(`测试 ${serviceName} API`);
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    log.info(`测试: ${testCase.name}`);
    
    const result = await makeRequest(baseUrl, testCase);
    
    if (result.success) {
      log.success(`${testCase.name} - 通过 (状态码: ${result.status})`);
      passed++;
      
      // 显示响应数据摘要
      if (result.data && typeof result.data === 'object') {
        if (result.data.success !== undefined) {
          console.log(`   响应: success=${result.data.success}`.gray);
        }
        if (result.data.data && Array.isArray(result.data.data)) {
          console.log(`   数据: ${result.data.data.length} 条记录`.gray);
        }
      }
    } else {
      log.error(`${testCase.name} - 失败 (状态码: ${result.status}, 错误: ${result.error})`);
      failed++;
    }
  }
  
  console.log('\n' + '结果摘要:'.bold);
  console.log(`  通过: ${passed.toString().green}`);
  console.log(`  失败: ${failed.toString().red}`);
  console.log(`  总计: ${(passed + failed).toString().blue}`);
  
  return { passed, failed };
}

// 主测试函数
async function main() {
  console.log('News Matcher 集成测试'.rainbow.bold);
  console.log('测试前端与 News Matcher 系统的集成状态\n');
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  // 1. 检查服务状态
  log.title('服务状态检查');
  
  const services = [
    { name: '前端应用', url: CONFIG.FRONTEND_URL },
    { name: '后端API', url: CONFIG.BACKEND_URL + '/api/status' },
    { name: 'News Matcher API', url: CONFIG.NEWS_MATCHER_URL + '/health' }
  ];
  
  const serviceStatus = {};
  for (const service of services) {
    serviceStatus[service.name] = await checkService(service.name, service.url);
  }
  
  // 2. 测试后端API
  if (serviceStatus['后端API']) {
    const backendResults = await runTests('后端', CONFIG.BACKEND_URL, TEST_CASES.backend);
    totalPassed += backendResults.passed;
    totalFailed += backendResults.failed;
  } else {
    log.warning('跳过后端API测试 - 服务未运行');
  }
  
  // 3. 测试 News Matcher API（如果可用）
  if (serviceStatus['News Matcher API']) {
    const newsMatcherResults = await runTests('News Matcher', CONFIG.NEWS_MATCHER_URL, TEST_CASES.newsMatcher);
    totalPassed += newsMatcherResults.passed;
    totalFailed += newsMatcherResults.failed;
  } else {
    log.warning('跳过 News Matcher API测试 - 服务未运行');
  }
  
  // 4. 显示最终结果
  log.title('最终测试结果');
  
  console.log('服务状态:');
  for (const [name, status] of Object.entries(serviceStatus)) {
    const statusText = status ? '✅ 运行中'.green : '❌ 未运行'.red;
    console.log(`  ${name}: ${statusText}`);
  }
  
  console.log('\nAPI测试结果:');
  console.log(`  总通过: ${totalPassed.toString().green}`);
  console.log(`  总失败: ${totalFailed.toString().red}`);
  console.log(`  成功率: ${totalPassed + totalFailed > 0 ? ((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1) : 0}%`);
  
  // 5. 提供建议
  console.log('\n建议:'.bold);
  
  if (!serviceStatus['前端应用']) {
    console.log('  - 启动前端应用: npm start'.yellow);
  }
  
  if (!serviceStatus['后端API']) {
    console.log('  - 启动后端服务: npm run server'.yellow);
  }
  
  if (!serviceStatus['News Matcher API']) {
    console.log('  - 启动 News Matcher API: python main.py api --port 5000'.yellow);
    console.log('  - 或使用一键启动脚本: ./start-with-news-matcher.sh'.yellow);
  }
  
  if (totalFailed === 0 && totalPassed > 0) {
    console.log('\n🎉 所有测试通过！系统集成正常工作。'.green.bold);
  } else if (totalFailed > 0) {
    console.log('\n⚠️  部分测试失败，请检查服务状态和配置。'.yellow.bold);
  } else {
    console.log('\n❌ 无法运行测试，请确保服务正常启动。'.red.bold);
  }
  
  // 6. 显示访问链接
  if (serviceStatus['前端应用']) {
    console.log('\n访问链接:'.bold);
    console.log(`  前端应用: ${CONFIG.FRONTEND_URL}`.blue);
    console.log(`  新闻匹配中心: ${CONFIG.FRONTEND_URL}/news-matcher/center`.blue);
    console.log(`  新闻数据浏览: ${CONFIG.FRONTEND_URL}/news-matcher/news-browser`.blue);
    console.log(`  匹配结果管理: ${CONFIG.FRONTEND_URL}/news-matcher/results`.blue);
    console.log(`  LLM智能矫正: ${CONFIG.FRONTEND_URL}/news-matcher/llm-correction`.blue);
    console.log(`  系统监控: ${CONFIG.FRONTEND_URL}/news-matcher/monitor`.blue);
  }
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  log.error(`未处理的Promise拒绝: ${reason}`);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log.error(`未捕获的异常: ${error.message}`);
  process.exit(1);
});

// 运行测试
if (require.main === module) {
  main().catch(error => {
    log.error(`测试执行失败: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { main, checkService, runTests };