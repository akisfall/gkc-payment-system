import { XummSdk } from 'xumm-sdk';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });
const xumm = new XummSdk(
  process.env.XAMAN_API_KEY,
  process.env.XAMAN_API_SECRET
);

// 建立付款請求
export async function createPaymentRequest(destination, amount, currency = "XRP") {
  try {
    const txjson = {
      TransactionType: 'Payment',
      Destination: destination
    };

    if (currency === "XRP") {
      txjson.Amount = (parseFloat(amount) * 1000000).toString();
    } else {
      txjson.Amount = {
        currency: currency,
        value: amount.toString(),
        issuer: process.env.GKC_ISSUER_ADDRESS
      };
    }

    const request = await xumm.payload.create({
      txjson,
      options: {
        submit: true,
        expire: 5
      }
    });

    return {
      uuid: request.uuid,
      qrCode: request.refs.qr_png,
      webUrl: request.next.always,
      expiresAt: request.expires_at
    };
  } catch (error) {
    console.error("Error creating payment request:", error);
    throw error;
  }
}

// 檢查付款狀態
export async function checkPaymentStatus(uuid) {
  try {
    const payload = await xumm.payload.get(uuid);
    
    return {
      signed: payload.meta.signed,
      submitted: payload.meta.submit,
      delivered: payload.meta.delivered,
      resolvedAt: payload.meta.resolved_at
    };
  } catch (error) {
    console.error("Error checking payment status:", error);
    throw error;
  }
}

// 建立信任線請求
export async function createTrustLineRequest() {
  try {
    const request = await xumm.payload.create({
      txjson: {
        TransactionType: 'TrustSet',
        // 注意：不要指定 Account，Xaman 會自動使用用戶的錢包地址
        LimitAmount: {
          currency: "GKC",
          issuer: process.env.GKC_ISSUER_ADDRESS,
          value: "1000000000" // 信任上限，可以調整
        }
      },
      options: {
        submit: true, // 用戶簽名後自動提交到 XRPL
        expire: 5 // 5分鐘過期
      }
    });

    return {
      uuid: request.uuid,
      qrCode: request.refs.qr_png, // QR Code 圖片 URL
      webUrl: request.next.always, // 網頁版簽署連結
      expiresAt: request.expires_at
    };
  } catch (error) {
    console.error("Error creating trust line request:", error);
    throw error;
  }
}
