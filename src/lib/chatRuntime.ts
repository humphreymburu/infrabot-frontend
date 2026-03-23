export function buildPromptKey(text: string): string {
  return String(text || "").toLowerCase().replace(/\s+/g, " ").trim().slice(0, 160);
}

export function shouldDedupeSend(
  last: { text: string; ts: number },
  nextText: string,
  nowTs: number,
  windowMs = 1200,
): boolean {
  const t = String(nextText || "").trim();
  if (!t) return true;
  return last.text === t && nowTs - last.ts < windowMs;
}
