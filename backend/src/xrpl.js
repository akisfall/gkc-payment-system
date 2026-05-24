import xrpl from 'xrpl';
import dotenv from 'dotenv';
dotenv.config();

const NETWORK = process.env.XRPL_NETWORK || "wss://s.altnet.rippletest.net:51233";

let client = null;

export async function getXRPLClient() {
  if (!client) {
    client = new xrpl.Client(NETWORK);
    await client.connect();
    console.log(`Connected to XRPL ${NETWORK}`);
  }
  return client;
}

// 獲取發行方地址的輔助函數
function getIssuerAddress() {
  // 首先檢查環境變數
  if (process.env.GKC_ISSUER_ADDRESS) {
    return process.env.GKC_ISSUER_ADDRESS;
  }
  // 然後嘗試從全局變量獲取（如果設置了）
  if (global.issuerWallet && global.issuerWallet.address) {
    return global.issuerWallet.address;
  }
  throw new Error("GKC_ISSUER_ADDRESS not configured. Please set it in .env");
}

export async function issueGKC(issuerWallet, amount, destination) {
  const client = await getXRPLClient();
  
  const tx = {
    TransactionType: "Payment",
    Account: issuerWallet.address,
    Destination: destination,
    Amount: {
      currency: "GKC",
      value: amount.toString(),
      issuer: issuerWallet.address
    }
  };

  const prepared = await client.autofill(tx);
  const signed = issuerWallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);
  
  return result;
}

export async function createTrustLine(userWallet, limit = "1000000000") {
  const client = await getXRPLClient();
  const issuerAddress = getIssuerAddress();
  
  const tx = {
    TransactionType: "TrustSet",
    Account: userWallet.address,
    LimitAmount: {
      currency: "GKC",
      issuer: issuerAddress,
      value: limit
    }
  };

  const prepared = await client.autofill(tx);
  const signed = userWallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);
  
  return result;
}

export async function makePathPayment(senderWallet, destination, gkcAmount, sendMaxXRP) {
  const client = await getXRPLClient();
  const issuerAddress = getIssuerAddress();
  
  // 首先查找路徑
  const pathRequest = {
    command: "ripple_path_find",
    source_account: senderWallet.address,
    destination_account: destination,
    destination_amount: {
      currency: "GKC",
      value: gkcAmount.toString(),
      issuer: issuerAddress
    },
    send_max: xrpl.xrpToDrops(sendMaxXRP)
  };

  const pathResult = await client.request(pathRequest);
  
  if (!pathResult.result.alternatives || pathResult.result.alternatives.length === 0) {
    throw new Error("No payment path found");
  }

  // 使用第一個路徑
  const path = pathResult.result.alternatives[0];
  
  const tx = {
    TransactionType: "Payment",
    Account: senderWallet.address,
    Destination: destination,
    Amount: {
      currency: "GKC",
      value: gkcAmount.toString(),
      issuer: issuerAddress
    },
    SendMax: xrpl.xrpToDrops(sendMaxXRP),
    Paths: path.paths_computed
  };

  const prepared = await client.autofill(tx);
  const signed = senderWallet.sign(prepared);
  const result = await client.submitAndWait(signed.tx_blob);
  
  return result;
}