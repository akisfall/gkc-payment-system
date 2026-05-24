// backend/src/check-env.js
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// 獲取當前檔案的目錄路徑
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 載入根目錄的 .env 檔案（從 backend/src 往上兩層是根目錄）
dotenv.config({ path: resolve(__dirname, '../../.env') });

console.log('========== 環境變數檢查 ==========');
console.log('XRPL_NETWORK:', process.env.XRPL_NETWORK);
console.log('XAMAN_API_KEY:', process.env.XAMAN_API_KEY ? process.env.XAMAN_API_KEY : '未設定');
console.log('XAMAN_API_SECRET:', process.env.XAMAN_API_SECRET ? process.env.XAMAN_API_SECRET : '未設定');
console.log('GKC_ISSUER_ADDRESS:', process.env.GKC_ISSUER_ADDRESS || '未設定');
console.log('GKC_ISSUER_SEED:', process.env.GKC_ISSUER_SEED ? '已設定（隱藏內容）' : '未設定');
console.log('PORT:', process.env.PORT || '3000 (預設值)');
console.log('==================================');

// 額外檢查：如果 XAMAN_API_KEY 是預設值，提醒用戶
if (process.env.XAMAN_API_KEY === 'your_xaman_api_key_here') {
  console.log('\n⚠️  警告：XAMAN_API_KEY 還是預設值，請到 https://apps.xumm.dev/ 申請並修改 .env 檔案');
}

if (process.env.XAMAN_API_SECRET === 'your_xaman_api_secret_here') {
  console.log('⚠️  警告：XAMAN_API_SECRET 還是預設值，請到 https://apps.xumm.dev/ 申請並修改 .env 檔案');
}