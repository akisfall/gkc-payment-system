import xrpl from 'xrpl';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 根目錄的 .env 文件路徑
const envPath = resolve(__dirname, '../../.env');

console.log('🔍 檢查 .env 文件中的發行帳戶設定...');
console.log('📁 .env 文件路徑:', envPath);

// 讀取現有的 .env 文件內容
let envContent = '';
if (existsSync(envPath)) {
  envContent = readFileSync(envPath, 'utf-8');
  console.log('✅ 找到現有的 .env 文件');
} else {
  console.log('⚠️  .env 文件不存在，將創建新文件');
  envContent = '';
}

// 解析現有的環境變數
const envLines = envContent.split('\n');
const envVars = {};

envLines.forEach(line => {
  const trimmedLine = line.trim();
  if (trimmedLine && !trimmedLine.startsWith('#')) {
    const [key, ...valueParts] = trimmedLine.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// 檢查是否需要生成新的發行帳戶
const needsGeneration = !envVars['GKC_ISSUER_ADDRESS'] || 
                        !envVars['GKC_ISSUER_SEED'] || 
                        !envVars['VITE_GKC_ISSUER_ADDRESS'] ||
                        envVars['GKC_ISSUER_ADDRESS'] === '' ||
                        envVars['GKC_ISSUER_SEED'] === '' ||
                        envVars['VITE_GKC_ISSUER_ADDRESS'] === '';

if (needsGeneration) {
  console.log('🔄 需要生成新的發行帳戶...');
  
  // 生成新的 XRP 錢包
  const newWallet = xrpl.Wallet.generate();
  
  console.log('✨ 生成新的錢包:');
  console.log('   地址:', newWallet.address);
  console.log('   種子:', newWallet.seed);
  
  // 更新環境變數
  envVars['GKC_ISSUER_ADDRESS'] = newWallet.address;
  envVars['GKC_ISSUER_SEED'] = newWallet.seed;
  envVars['VITE_GKC_ISSUER_ADDRESS'] = newWallet.address;
  
  // 構建新的 .env 文件內容
  let newEnvContent = '';
  
  // 保留原有的註釋和其他變數
  const lines = envContent.split('\n');
  const updatedKeys = new Set();
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('#') || !trimmedLine.includes('=')) {
      // 保留註釋和空行
      newEnvContent += line + '\n';
    } else {
      const [key, ...valueParts] = trimmedLine.split('=');
      const trimmedKey = key.trim();
      
      if (trimmedKey === 'GKC_ISSUER_ADDRESS' || 
          trimmedKey === 'GKC_ISSUER_SEED' || 
          trimmedKey === 'VITE_GKC_ISSUER_ADDRESS') {
        // 跳過這些鍵，我們稍後會添加
        updatedKeys.add(trimmedKey);
      } else {
        newEnvContent += line + '\n';
      }
    }
  });
  
  // 添加新的/更新的變數
  if (!updatedKeys.has('GKC_ISSUER_ADDRESS')) {
    newEnvContent += `GKC_ISSUER_ADDRESS=${newWallet.address}\n`;
  }
  if (!updatedKeys.has('GKC_ISSUER_SEED')) {
    newEnvContent += `GKC_ISSUER_SEED=${newWallet.seed}\n`;
  }
  if (!updatedKeys.has('VITE_GKC_ISSUER_ADDRESS')) {
    newEnvContent += `VITE_GKC_ISSUER_ADDRESS=${newWallet.address}\n`;
  }
  
  // 寫入 .env 文件
  writeFileSync(envPath, newEnvContent);
  
  console.log('💾 已將新的發行帳戶資訊寫入 .env 文件');
  console.log('⚠️  請妥善保管您的發行帳戶種子 (GKC_ISSUER_SEED)，這是控制發行帳戶的唯一憑證！');
  console.log('📋 發行帳戶地址:', newWallet.address);
  
  // 提示：如果是測試網，獲取測試 XRP
  if (envVars['XRPL_NETWORK'] && envVars['XRPL_NETWORK'].includes('testnet')) {
    console.log('💧 檢測到測試網，正在請求測試 XRP...');
    fetch(`https://faucet.altnet.rippletest.net/accounts/${newWallet.address}/fund`, {
      method: 'POST'
    })
      .then(response => {
        if (response.ok) {
          console.log('✅ 測試 XRP 請求成功！');
        } else {
          console.log('⚠️  測試 XRP 請求失敗，請手動到 https://faucet.altnet.rippletest.net/ 獲取');
        }
      })
      .catch(error => {
        console.log('⚠️  無法連接到測試網水龍頭:', error.message);
      });
  }
  
} else {
  console.log('✅ 發行帳戶已設定:');
  console.log('   地址:', envVars['GKC_ISSUER_ADDRESS']);
  console.log('   種子: 已設定（隱藏）');
  console.log('   VITE 地址: 已設定');
}