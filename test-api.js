#!/usr/bin/env node

/**
 * 测试API是否能正确读取报告数据
 */

const fs = require('fs-extra');
const path = require('path');

const REPORTS_PATH = '/Users/huangjunpeng/quantagent/finance-claude-code-agent-reports';

async function testReportsAPI() {
  console.log('🧪 测试报告API...\n');
  
  try {
    console.log('📁 检查报告目录:', REPORTS_PATH);
    
    if (!(await fs.pathExists(REPORTS_PATH))) {
      console.log('❌ 报告目录不存在');
      return;
    }
    
    const companies = await fs.readdir(REPORTS_PATH);
    console.log('📋 发现公司:', companies.filter(c => !c.startsWith('.')));
    
    const reports = [];
    
    for (const company of companies) {
      if (company.startsWith('.')) continue;
      
      const companyPath = path.join(REPORTS_PATH, company);
      const stat = await fs.stat(companyPath);
      
      if (stat.isDirectory()) {
        const dates = await fs.readdir(companyPath);
        console.log(`  📅 ${company} 的报告日期:`, dates);
        
        for (const date of dates) {
          const datePath = path.join(companyPath, date);
          const dateStat = await fs.stat(datePath);
          
          if (dateStat.isDirectory()) {
            const readmePath = path.join(datePath, 'README.md');
            
            if (await fs.pathExists(readmePath)) {
              const readmeContent = await fs.readFile(readmePath, 'utf-8');
              const fileSize = Math.round(readmeContent.length / 1024 * 10) / 10;
              
              console.log(`    📄 ${company}/${date}/README.md - ${fileSize}KB`);
              
              // 提取分析类型
              const types = [];
              if (readmeContent.includes('## 管理层分析')) types.push('管理层分析');
              if (readmeContent.includes('## 商业模式研究')) types.push('商业模式研究');
              if (readmeContent.includes('## 竞争格局与战略研究')) types.push('竞争格局分析');
              if (readmeContent.includes('## 估值与市场炒作因素研究')) types.push('估值分析');
              if (readmeContent.includes('## 股权分布研究')) types.push('股权分布研究');
              
              console.log(`      🔍 分析类型: ${types.join(', ')}`);
              
              reports.push({
                company,
                date: `${date.substring(0, 4)}-${date.substring(4, 6)}-${date.substring(6, 8)}`,
                fileSize: `${fileSize}KB`,
                analysisTypes: types,
                path: datePath
              });
            }
          }
        }
      }
    }
    
    console.log('\n📊 报告汇总:');
    console.log(`总共找到 ${reports.length} 个报告`);
    
    reports.forEach((report, index) => {
      console.log(`${index + 1}. ${report.company} (${report.date}) - ${report.fileSize}`);
      console.log(`   分析类型: ${report.analysisTypes.join(', ')}`);
    });
    
    console.log('\n✅ API测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

testReportsAPI();