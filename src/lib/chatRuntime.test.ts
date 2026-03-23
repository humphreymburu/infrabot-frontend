import { describe, expect, it } from "vitest";
import { buildPromptKey, shouldDedupeSend } from "./chatRuntime";

describe("chatRuntime", () => {
  it("buildPromptKey normalizes spacing and case", () => {
    expect(buildPromptKey("  Hello   WORLD  ")).toBe("hello world");
  });

  it("shouldDedupeSend returns true for rapid duplicate", () => {
    expect(shouldDedupeSend({ text: "hello", ts: 1000 }, "hello", 1500, 1200)).toBe(true);
  });

  it("shouldDedupeSend returns false for different text", () => {
    expect(shouldDedupeSend({ text: "hello", ts: 1000 }, "hello again", 1500, 1200)).toBe(false);
  });
});
