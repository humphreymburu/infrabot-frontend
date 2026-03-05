/** Estimate token count from character length (rough: 1 token ≈ 4 chars). */
export function estimateTokens(str) {
  return Math.ceil(str.length / 4);
}

/**
 * Recursively trim agent output before sending to evaluator/synthesis:
 * - Strings truncated to maxStr chars
 * - Arrays capped at maxArr items
 * This keeps the combined input well under the 30K TPM limit.
 */
export function slimPayload(obj, { maxStr = 350, maxArr = 4 } = {}) {
  if (typeof obj === "string") return obj.length > maxStr ? obj.slice(0, maxStr) + "…" : obj;
  if (Array.isArray(obj)) return obj.slice(0, maxArr).map((x) => slimPayload(x, { maxStr, maxArr }));
  if (obj && typeof obj === "object") {
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, slimPayload(v, { maxStr, maxArr })]));
  }
  return obj;
}

/** Parse fetch response; throw with clear message on non-OK or invalid/empty JSON. */
export async function parseApiResponse(res) {
  const retryAfter = res.headers.get("retry-after");
  const text = await res.text();
  if (!res.ok) {
    let msg = `API error ${res.status}`;
    try {
      const j = JSON.parse(text);
      msg = j.error?.message ?? j.message ?? msg;
    } catch {
      if (text.trim()) msg += ": " + text.slice(0, 300);
    }
    const err = new Error(msg);
    err.status = res.status;
    err.retryAfter = retryAfter ? parseInt(retryAfter, 10) : null;
    throw err;
  }
  if (!text.trim()) throw new Error(`API returned empty response (${res.status})`);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error("API returned invalid JSON: " + text.slice(0, 100));
  }
}

/** Run async tasks with max concurrency; returns results in same order as tasks. */
export async function runWithConcurrency(tasks, limit = 2) {
  const results = new Array(tasks.length);
  let next = 0;
  async function runOne() {
    const i = next++;
    if (i >= tasks.length) return;
    results[i] = await tasks[i]();
    await runOne();
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, runOne));
  return results;
}

export function isRetriableError(e) {
  if (e?.status === 429 || e?.status === 500 || e?.status === 502 || e?.status === 503 || e?.status === 529) return true;
  const msg = (e?.message ?? String(e)).toLowerCase();
  return (
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("econnreset") ||
    msg.includes("json") ||
    msg.includes("500") ||
    msg.includes("rate limit") ||
    e?.name === "TypeError"
  );
}

export function retryDelayMs(e, attempt) {
  if (e?.status === 429) {
    const secs = e.retryAfter ?? 60;
    return secs * 1000;
  }
  return 1500 * attempt;
}

export async function callOpenAICompat(systemPrompt, userMessage, { endpoint, model, apiKey }) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });
  const retryAfter = res.headers.get("retry-after");
  const text = await res.text();
  if (!res.ok) {
    let msg = `API error ${res.status}`;
    try { const j = JSON.parse(text); msg = j.error?.message ?? j.message ?? msg; } catch {}
    const err = new Error(msg);
    err.status = res.status;
    err.retryAfter = retryAfter ? parseInt(retryAfter, 10) : null;
    throw err;
  }
  const data = JSON.parse(text);
  return data.choices?.[0]?.message?.content ?? "";
}
