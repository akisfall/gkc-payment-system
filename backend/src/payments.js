import { createPaymentRequest, checkPaymentStatus } from './xaman.js';
import { makePathPayment } from './xrpl.js';

// 建立 GKC 支付請求
export async function createGKCPayment(destination, amountGKC) {
  // 方式1: 直接 GKC 支付 (如果用戶已有 GKC)
  const paymentRequest = await createPaymentRequest(
    destination,
    amountGKC,
    "GKC"
  );
  
  return paymentRequest;
}

// 建立 XRP 購買 GKC 的支付請求 (透過路徑)
export async function createXRPToGKCPayment(destination, xrpAmount, gkcAmount) {
  // 注意：這裡我們建立一個簡單的 XRP 支付，實際路徑轉換可能需要更複雜的處理
  // 在實際系統中，您可能需要結合 XRPL 路徑查找和 Xaman 的自定義交易
  const paymentRequest = await createPaymentRequest(
    destination,
    xrpAmount,
    "XRP"
  );
  
  return paymentRequest;
}

// 驗證支付 (檢查 Xaman 請求狀態)
export async function verifyPayment(uuid) {
  const status = await checkPaymentStatus(uuid);
  return status;
}