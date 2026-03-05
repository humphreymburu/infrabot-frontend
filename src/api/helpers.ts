import type { ApiError } from "../types";

/** Estimate token count from character length (rough: 1 token ≈ 4 chars). */
export function estimateTokens(str: string): number {
  return Math.ceil(str.length / 4);
}

// Simple rolling 60s token budget to avoid burst TPM spikes that cause 429s.
const TOKEN_BUDGET_PER_MINUTE =
  Number(import.meta.env.VITE_TOKEN_BUDGET_PER_MINUTE || "") || 30000;

interface TokenWindowEntry {
  ts: number;
  tokens: number;
}

const tokenWindow: TokenWindowEntry[] = [];

export async function ensureTokenBudget(neededTokens: number): Promise<void> {
  if (!Number.isFinite(neededTokens) || neededTokens <= 0) return;

  const now = Date.now();
  const cutoff = now - 60_000;

  // Drop entries older than 60 seconds
  for (let i = tokenWindow.length - 1; i >= 0; i -= 1) {
    if (tokenWindow[i].ts < cutoff) tokenWindow.splice(i, 1);
  }

  const used = tokenWindow.reduce((sum, e) => sum + e.tokens, 0);
  if (used + neededTokens <= TOKEN_BUDGET_PER_MINUTE) {
    tokenWindow.push({ ts: now, tokens: neededTokens });
    return;
  }

  const excess = used + neededTokens - TOKEN_BUDGET_PER_MINUTE;
  let running = 0;
  let waitUntil = now;
  for (const entry of tokenWindow) {
    running += entry.tokens;
    if (running >= excess) {
      waitUntil = entry.ts + 60_000;
      break;
    }
  }
  const waitMs = Math.max(0, waitUntil - now);
  if (waitMs > 0) {
    console.warn(
      `[Atlas AI] Token budget near limit (~${used} used). Waiting ${waitMs}ms before next call.`,
    );
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  // After waiting, recurse once to re-check and record usage.
  return ensureTokenBudget(neededTokens);
}

export function parseRetryAfter(raw: string | null): number | null {
  if (!raw) return null;
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds);
  const asDate = Date.parse(raw);
  if (Number.isFinite(asDate)) return Math.max(0, Math.ceil((asDate - Date.now()) / 1000));
  return null;
}

/** Parse Anthropic RFC 3339 rate-limit reset header to epoch ms, or null if missing/invalid. */
function parseResetAt(raw: string | null): number | null {
  if (!raw || typeof raw !== "string") return null;
  const t = Date.parse(raw.trim());
  return Number.isFinite(t) ? t : null;
}

/**
 * From a Response, collect all anthropic-ratelimit-*-reset headers and return
 * the latest reset time (epoch ms). Used so we wait until every limit is replenished.
 */
export function getLatestRateLimitResetMs(res: Response): number | null {
  const headers = [
    res.headers.get("anthropic-ratelimit-input-tokens-reset"),
    res.headers.get("anthropic-ratelimit-requests-reset"),
    res.headers.get("anthropic-ratelimit-output-tokens-reset"),
    res.headers.get("anthropic-ratelimit-tokens-reset"),
  ];
  let latest: number | null = null;
  for (const raw of headers) {
    const t = parseResetAt(raw);
    if (t != null && (latest == null || t > latest)) latest = t;
  }
  return latest;
}

/**
 * Recursively trim agent output before sending to evaluator/synthesis:
 * - Strings truncated to maxStr chars
 * - Arrays capped at maxArr items
 * This keeps the combined input well under the 30K TPM limit.
 */
export function slimPayload(
  obj: unknown,
  { maxStr = 350, maxArr = 4 }: { maxStr?: number; maxArr?: number } = {}
): unknown {
  if (typeof obj === "string") return obj.length > maxStr ? obj.slice(0, maxStr) + "…" : obj;
  if (Array.isArray(obj)) return obj.slice(0, maxArr).map((x) => slimPayload(x, { maxStr, maxArr }));
  if (obj && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([k, v]) => [k, slimPayload(v, { maxStr, maxArr })])
    );
  }
  return obj;
}

/** Parse fetch response; throw with clear message on non-OK or invalid/empty JSON. */
export async function parseApiResponse(res: Response): Promise<unknown> {
  const retryAfter = parseRetryAfter(res.headers.get("retry-after"));
  const rateLimitResetAt = getLatestRateLimitResetMs(res);
  const text = await res.text();
  if (!res.ok) {
    let msg = `API error ${res.status}`;
    try {
      const j = JSON.parse(text) as { error?: { message?: string }; message?: string };
      msg = j.error?.message ?? j.message ?? msg;
    } catch {
      if (text.trim()) msg += ": " + text.slice(0, 300);
    }
    const err = new Error(msg) as ApiError;
    err.status = res.status;
    err.retryAfter = retryAfter;
    err.rateLimitResetAt = rateLimitResetAt ?? null;
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
export async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  limit = 2
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  async function runOne(): Promise<void> {
    const i = next++;
    if (i >= tasks.length) return;
    results[i] = await tasks[i]();
    await runOne();
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, runOne));
  return results;
}

export function isRetriableError(e: unknown): boolean {
  const err = e as ApiError;
  if (err?.status === 429 || err?.status === 500 || err?.status === 502 || err?.status === 503 || err?.status === 529) return true;
  const msg = (err?.message ?? String(e)).toLowerCase();
  return (
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("econnreset") ||
    msg.includes("json") ||
    msg.includes("500") ||
    msg.includes("rate limit") ||
    (e as Error)?.name === "TypeError"
  );
}

/**
 * Delay in ms before retrying. For 429: prefer retry-after; otherwise wait until
 * anthropic-ratelimit-*-reset time (latest of input/requests/output/tokens reset).
 * No fixed delays — fully header-driven per Anthropic rate limits.
 * @see https://platform.claude.com/docs/en/api/rate-limits
 */
export function retryDelayMs(e: unknown, attempt: number): number {
  const err = e as ApiError;
  if (err?.status === 429) {
    const retryAfterSeconds =
      Number.isFinite(err?.retryAfter) && (err?.retryAfter ?? -1) >= 0 ? (err.retryAfter as number) : null;
    const waitFromRetryAfter = retryAfterSeconds != null ? retryAfterSeconds * 1000 : 0;
    const resetAt = err?.rateLimitResetAt != null && Number.isFinite(err.rateLimitResetAt) ? err.rateLimitResetAt : null;
    const waitFromReset = resetAt != null ? Math.max(0, resetAt - Date.now()) : 0;
    const base =
      waitFromRetryAfter > 0 || waitFromReset > 0
        ? Math.max(waitFromRetryAfter, waitFromReset)
        : Math.min(60000, 5000 * attempt);
    return base + Math.floor(Math.random() * 1000);
  }
  const base = Math.min(20000, 1500 * (2 ** Math.max(0, attempt - 1)));
  return base + Math.floor(Math.random() * 500);
}

export async function callOpenAICompat(
  systemPrompt: string,
  userMessage: string,
  {
    endpoint,
    model,
    apiKey,
    maxTokens = 2000,
  }: { endpoint: string; model: string; apiKey: string; maxTokens?: number },
): Promise<string> {
  const approxTokens = estimateTokens(systemPrompt + userMessage);
  await ensureTokenBudget(approxTokens);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });
  const retryAfter = parseRetryAfter(res.headers.get("retry-after"));
  const text = await res.text();
  if (!res.ok) {
    let msg = `API error ${res.status}`;
    try {
      const j = JSON.parse(text) as { error?: { message?: string }; message?: string };
      msg = j.error?.message ?? j.message ?? msg;
    } catch {}
    const err = new Error(msg) as ApiError;
    err.status = res.status;
    err.retryAfter = retryAfter;
    throw err;
  }
  const data = JSON.parse(text) as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? "";
}
