export const PROVIDERS = {
  kimi: {
    name: "Kimi K2",
    defaultModel: "kimi-k2",
    models: ["kimi-k2", "moonshot-v1-32k", "moonshot-v1-128k"],
    devEndpoint: "/api/kimi",
    prodEndpoint: "https://api.moonshot.cn/v1/chat/completions",
  },
  qwen: {
    name: "Qwen",
    defaultModel: "qwen-plus",
    models: ["qwen-turbo", "qwen-plus", "qwen-max", "qwen-long"],
    devEndpoint: "/api/qwen",
    prodEndpoint: "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
  },
  minimax: {
    name: "MiniMax",
    defaultModel: "MiniMax-Text-01",
    models: ["MiniMax-Text-01", "abab6.5s-chat"],
    devEndpoint: "/api/minimax",
    prodEndpoint: "https://api.minimax.chat/v1/chat/completions",
  },
};

export function getEnvKeyForProvider(p) {
  return {
    kimi: import.meta.env.VITE_KIMI_API_KEY,
    qwen: import.meta.env.VITE_QWEN_API_KEY,
    minimax: import.meta.env.VITE_MINIMAX_API_KEY,
  }[p] || "";
}

export function getAltEndpoint(providerKey) {
  const p = PROVIDERS[providerKey];
  if (!p) return null;
  return import.meta.env.DEV ? p.devEndpoint : p.prodEndpoint;
}

export function getApiHeaders(apiKey) {
  const headers = {
    "Content-Type": "application/json",
    // Enable prompt caching — cached tokens don't count against TPM limits.
    // Safe to send in dev too since the proxy doesn't inject this header.
    "anthropic-beta": "prompt-caching-2024-07-31",
  };
  // In dev the Vite proxy injects x-api-key/anthropic-version/dangerous-access-header.
  // Sending them from the client too causes http-proxy to merge duplicates into a
  // comma-joined string ("sk-ant-xxx, sk-ant-xxx") which Anthropic rejects as invalid.
  if (apiKey && !import.meta.env.DEV) {
    headers["x-api-key"] = apiKey;
    headers["anthropic-version"] = "2023-06-01";
    headers["anthropic-dangerous-direct-browser-access"] = "true";
  }
  return headers;
}

export function getApiUrl(apiKey) {
  void apiKey;
  return "/api/messages";
}
