export const GKC_CURRENCY = {
  currency: "GKC",
  issuer: GKC_ISSUER_ADDRESS
};
export const XRPL_NETWORK_URL = XRPL_NETWORK;
export const SERVER_PORT = isNode ? (process.env.PORT || 3000) : (import.meta.env.VITE_PORT || 3000);