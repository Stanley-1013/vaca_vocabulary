#!/usr/bin/env node

/**
 * 🔐 VACA App 安全性檢查腳本
 * 
 * 檢查敏感資訊是否被正確保護
 */

const fs = require('fs');
const path = require('path');

console.log('🔐 VACA App 安全性檢查\n');

// 檢查 .gitignore 保護
function checkGitignore() {
  const gitignorePath = path.join(__dirname, '../.gitignore');

  if (!fs.existsSync(gitignorePath)) {
    console.error('❌ .gitignore 檔案不存在！');
    return false;
  }

  const content = fs.readFileSync(gitignorePath, 'utf-8');
  const requiredPatterns = ['.env', '.env.production', '.env.local'];

  const isProtected = requiredPatterns.every(pattern =>
    content.includes(pattern)
  );

  if (isProtected) {
    console.log('✅ .gitignore 保護設定正確');
    return true;
  } else {
    console.error('❌ .gitignore 保護不完整');
    return false;
  }
}

// 檢查敏感檔案
function checkSensitiveFiles() {
  const sensitiveFiles = ['.env', '.env.production'];
  let allSafe = true;
  
  sensitiveFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`🔒 ${file} 已建立 (包含敏感資訊)`);
      
      // 檢查是否包含真實 API Key
      const content = fs.readFileSync(filePath, 'utf-8');
      if (content.includes('YOUR_') || content.includes('XXXX')) {
        console.log(`⚠️  ${file} 包含範例值，需要更新為真實值`);
      } else {
        console.log(`✅ ${file} 已配置真實值`);
      }
    } else {
      console.log(`⚠️  ${file} 不存在`);
    }
  });
  
  return allSafe;
}

// 檢查建置輸出
function checkBuildOutput() {
  const distPath = path.join(__dirname, '../dist');
  
  if (fs.existsSync(distPath)) {
    console.log('📦 檢查建置輸出...');
    
    // 檢查 dist 目錄中是否包含 .env 檔案
    const envInDist = fs.readdirSync(distPath, { recursive: true })
      .some(file => file.includes('.env'));
      
    if (envInDist) {
      console.error('❌ 建置輸出包含 .env 檔案！');
      return false;
    } else {
      console.log('✅ 建置輸出不包含敏感檔案');
      return true;
    }
  } else {
    console.log('📦 尚未建置，跳過建置檢查');
    return true;
  }
}

// 執行所有檢查
function runSecurityCheck() {
  const checks = [
    checkGitignore(),
    checkSensitiveFiles(), 
    checkBuildOutput()
  ];
  
  const allPassed = checks.every(check => check !== false);
  
  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('✅ 安全性檢查通過！');
    console.log('🚀 可以安全地推送到 Git 和部署');
    process.exit(0);
  } else {
    console.log('❌ 安全性檢查失敗！');
    console.log('⚠️  請修復問題後再推送');
    process.exit(1);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  runSecurityCheck();
}

module.exports = { runSecurityCheck };