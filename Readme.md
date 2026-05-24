# 專案使用

---

## .env參數

```txt
XRPL_NETWORK=wss://s.altnet.rippletest.net:51233
VITE_XRPL_NETWORK=wss://s.altnet.rippletest.net:51233
XAMAN_API_KEY=your_api_key
XAMAN_API_SECRET=your_api_secret
GKC_ISSUER_ADDRESS=
GKC_ISSUER_SEED=
PORT=3005
```

註解：如果上面的env參數有點不確定怎麽使用的話，可以問問AI
GKC_ISSUER_...：可以透過進入/backend/src 然後跑 `node autogen_issuer.js` 複製其中給你的seed與Address上去，就可以先啟動。

## 啟動方法

`npm install -g pnpm`

`pnpm install`

`pnpm dev`

請注意在 X:/gkc-payment-system/下跑 `pnpm dev`

## 額外事項

目前這版本應該會缺很多東西，歡迎直接修改。
