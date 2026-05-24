import { GKC_CURRENCY, XRPL_NETWORK_URL } from '../../shared/constants.js';

// 狀態管理
let currentPaymentUUID = null;
let statusCheckInterval = null;

// DOM 元素
const issuerInfoEl = document.getElementById('issuerInfo');
const createTrustBtn = document.getElementById('createTrustBtn');
const trustQrCodeEl = document.getElementById('trustQrCode');
const payGKCBtn = document.getElementById('payGKCBtn');
const payXRPBtn = document.getElementById('payXRPBtn');
const paymentSection = document.getElementById('paymentSection');
const paymentQrCodeEl = document.getElementById('paymentQrCode');
const paymentStatusEl = document.getElementById('paymentStatus');
const paymentDetailsEl = document.getElementById('paymentDetails');
const checkStatusBtn = document.getElementById('checkStatusBtn');
const trustStatusEl = document.getElementById('trustStatus'); // 需要添加這個元素到 HTML
let trustCheckInterval = null;
let currentTrustUUID = null;


// 初始化：獲取發行資訊
async function init() {
  try {
    const response = await fetch('/api/issuer');
    const data = await response.json();
    issuerInfoEl.innerHTML = `
      <p><strong>發行地址:</strong> ${data.address}</p>
      <p><strong>幣種:</strong> ${data.currency}</p>
      <p>請先用 Xaman 錢包建立信任線，才能接收 GKC。</p>
    `;
  } catch (error) {
    issuerInfoEl.innerHTML = `<p class="error">無法獲取發行資訊: ${error.message}</p>`;
  }
}

// 建立信任線 (引導用戶)
createTrustBtn.addEventListener('click', async () => {
  try {
    // 禁用按鈕，防止重複點擊
    createTrustBtn.disabled = true;
    createTrustBtn.textContent = '生成中...';
    
    // 調用後端 API 創建信任線請求
    const response = await fetch('/api/trustline/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    currentTrustUUID = data.uuid;
    
    // 顯示 QR Code
    trustQrCodeEl.innerHTML = `
      <p>請使用 Xaman 錢包掃描下方二維碼建立信任線:</p>
      <img src="${data.qrCode}" alt="信任線設置二維碼" style="max-width: 300px; border: 1px solid #ddd; border-radius: 8px;">
      <p>或 <a href="${data.webUrl}" target="_blank">點擊這裡</a> 在手機上打開</p>
      <p class="expires">二維碼將於 ${new Date(data.expiresAt).toLocaleTimeString()} 過期</p>
    `;
    
    // 開始檢查狀態
    startTrustStatusCheck();
    
  } catch (error) {
    console.error('創建信任線請求失敗:', error);
    trustQrCodeEl.innerHTML = `<p class="error">創建失敗: ${error.message}</p>`;
  } finally {
    createTrustBtn.disabled = false;
    createTrustBtn.textContent = '建立信任線 (透過 Xaman)';
  }
});

// 開始檢查信任線狀態
function startTrustStatusCheck() {
  if (trustCheckInterval) clearInterval(trustCheckInterval);
  
  trustCheckInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/payments/status/${currentTrustUUID}`);
      const status = await response.json();
      
      updateTrustStatus(status);
      
      // 如果已簽署或已提交，停止輪詢
      if (status.signed && status.submitted) {
        clearInterval(trustCheckInterval);
      }
    } catch (error) {
      console.error('檢查信任線狀態失敗:', error);
    }
  }, 3000); // 每3秒檢查一次
}

// 更新信任線狀態顯示
function updateTrustStatus(status) {
  // 如果還沒有狀態顯示元素，創建一個
  let statusEl = document.getElementById('trustStatus');
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.id = 'trustStatus';
    statusEl.className = 'status';
    trustQrCodeEl.appendChild(statusEl);
  }
  
  let statusText = '等待簽署...';
  if (status.signed) {
    statusText = '✅ 已簽名';
  }
  if (status.submitted) {
    statusText = '✅ 已提交到 XRPL';
  }
  if (status.delivered) {
    statusText = '✅ 信任線建立成功！';
    // 可以更新發行資訊或做其他處理
  }
  
  statusEl.textContent = statusText;
}

// 記得在頁面卸載時清除間隔
window.addEventListener('beforeunload', () => {
  if (trustCheckInterval) clearInterval(trustCheckInterval);
  if (statusCheckInterval) clearInterval(statusCheckInterval);
});

// 直接 GKC 支付
payGKCBtn.addEventListener('click', async () => {
  const destination = document.getElementById('destinationGKC').value;
  const amount = document.getElementById('amountGKC').value;

  if (!destination || !amount) {
    alert('請填寫商家地址和金額');
    return;
  }

  try {
    const response = await fetch('/api/payments/gkc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, amount })
    });

    const data = await response.json();
    showPaymentQR(data);
  } catch (error) {
    alert(`支付請求失敗: ${error.message}`);
  }
});

// XRP 購買 GKC 支付
payXRPBtn.addEventListener('click', async () => {
  const destination = document.getElementById('destinationXRP').value;
  const xrpAmount = document.getElementById('xrpAmount').value;
  const gkcAmount = document.getElementById('gkcAmount').value;

  if (!destination || !xrpAmount || !gkcAmount) {
    alert('請填寫所有欄位');
    return;
  }

  try {
    const response = await fetch('/api/payments/xrp-to-gkc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destination, xrpAmount, gkcAmount })
    });

    const data = await response.json();
    showPaymentQR(data);
  } catch (error) {
    alert(`支付請求失敗: ${error.message}`);
  }
});

// 顯示支付二維碼
function showPaymentQR(paymentData) {
  currentPaymentUUID = paymentData.uuid;
  
  paymentSection.style.display = 'block';
  paymentQrCodeEl.innerHTML = `
    <p>請使用 Xaman 錢包掃描下方二維碼支付:</p>
    <img src="${paymentData.qrCode}" alt="支付二維碼" style="max-width: 300px;">
    <p>或 <a href="${paymentData.webUrl}" target="_blank">點擊這裡</a> 在手機上打開</p>
  `;
  paymentStatusEl.textContent = '等待支付...';
  paymentDetailsEl.innerHTML = '';

  // 開始輪詢狀態
  startStatusCheck();
}

// 開始檢查支付狀態
function startStatusCheck() {
  if (statusCheckInterval) clearInterval(statusCheckInterval);
  
  statusCheckInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/payments/status/${currentPaymentUUID}`);
      const status = await response.json();
      
      updatePaymentStatus(status);
      
      if (status.signed && status.submitted) {
        clearInterval(statusCheckInterval);
      }
    } catch (error) {
      console.error('檢查狀態失敗:', error);
    }
  }, 3000); // 每3秒檢查一次
}

// 更新支付狀態顯示
function updatePaymentStatus(status) {
  let statusText = '等待支付...';
  let detailsHTML = '';

  if (status.signed) {
    statusText = '✅ 已簽名';
  }
  if (status.submitted) {
    statusText = '✅ 已提交到 XRPL';
  }
  if (status.delivered) {
    statusText = '✅ 支付成功！';
    detailsHTML = `<p>交易完成時間: ${new Date(status.resolvedAt).toLocaleString()}</p>`;
  }

  paymentStatusEl.textContent = statusText;
  paymentDetailsEl.innerHTML = detailsHTML;
}

// 手動檢查狀態按鈕
checkStatusBtn.addEventListener('click', async () => {
  if (!currentPaymentUUID) return;
  
  try {
    const response = await fetch(`/api/payments/status/${currentPaymentUUID}`);
    const status = await response.json();
    updatePaymentStatus(status);
  } catch (error) {
    alert(`檢查失敗: ${error.message}`);
  }
});

// 頁面載入時初始化
document.addEventListener('DOMContentLoaded', init);