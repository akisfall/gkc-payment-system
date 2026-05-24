import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createGKCPayment, createXRPToGKCPayment, verifyPayment } from './src/payments.js';
import { getXRPLClient, issueGKC } from './src/xrpl.js';
import xrpl from 'xrpl';
import { createTrustLineRequest } from './src/xaman.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 初始化 XRPL 發行帳戶 (測試用，實際應從安全地方讀取)
let issuerWallet = null;
if (process.env.GKC_ISSUER_SEED) {
  issuerWallet = xrpl.Wallet.fromSeed(process.env.GKC_ISSUER_SEED);
} else {
  // 生成臨時錢包 (僅測試)
  issuerWallet = xrpl.Wallet.generate();
  console.log("Generated issuer wallet:", issuerWallet.address);
  console.log("Seed:", issuerWallet.seed);
  // 在實際應用中，您應該將這些資訊保存到安全地方
}

// API 路由
// 1. 建立 GKC 支付請求
app.post('/api/payments/gkc', async (req, res) => {
  try {
    const { destination, amount } = req.body;
    
    if (!destination || !amount) {
      return res.status(400).json({ error: "Missing destination or amount" });
    }
    
    const paymentRequest = await createGKCPayment(destination, amount);
    res.json(paymentRequest);
  } catch (error) {
    console.error("Error creating GKC payment:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2. 建立 XRP 購買 GKC 的請求
app.post('/api/payments/xrp-to-gkc', async (req, res) => {
  try {
    const { destination, xrpAmount, gkcAmount } = req.body;
    
    const paymentRequest = await createXRPToGKCPayment(
      destination, 
      xrpAmount, 
      gkcAmount
    );
    res.json(paymentRequest);
  } catch (error) {
    console.error("Error creating XRP to GKC payment:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. 檢查支付狀態
app.get('/api/payments/status/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params;
    const status = await verifyPayment(uuid);
    res.json(status);
  } catch (error) {
    console.error("Error checking payment status:", error);
    res.status(500).json({ error: error.message });
  }
});

// 4. 獲取發行地址 (前端需要建立信任線)
app.get('/api/issuer', (req, res) => {
  res.json({
    address: process.env.GKC_ISSUER_ADDRESS,
    currency: "GKC"
  });
});

// 5. 建立信任線請求 (前端引導用戶建立信任)
app.post('/api/trustline', async (req, res) => {
  try {
    const { userAddress } = req.body;
    // 這裡需要實作類似 createTrustLineRequest 的函數
    // (為簡化，我們直接返回發行地址，前端用 Xaman 建立信任線)
    res.json({
      issuer: process.env.GKC_ISSUER_ADDRESS || issuerWallet.address,
      currency: "GKC"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 啟動服務器
app.listen(PORT, () => {
  console.log(`GKC Payment System backend running on port ${PORT}`);
});

// 優雅關閉
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  process.exit(0);
});
// 添加信任線創建端點
app.post('/api/trustline/create', async (req, res) => {
  try {
    const trustLineRequest = await createTrustLineRequest();
    res.json(trustLineRequest);
  } catch (error) {
    console.error("Error creating trust line:", error);
    res.status(500).json({ error: error.message });
  }
});

// 也可以添加一個 GET 版本，方便前端調用
app.get('/api/trustline/create', async (req, res) => {
  try {
    const trustLineRequest = await createTrustLineRequest();
    res.json(trustLineRequest);
  } catch (error) {
    console.error("Error creating trust line:", error);
    res.status(500).json({ error: error.message });
  }
});