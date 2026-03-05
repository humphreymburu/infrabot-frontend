# Agent SDK vs Tech-Advisor: Analysis & Adaptation Options

## 1. What the Claude Agent SDK Is

The **[Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/typescript)** (`@anthropic-ai/claude-agent-sdk`) is a **Node/Bun/Deno** library that runs **Claude Code** — the full agentic coding environment — as a subprocess or in-process agent.

| Aspect | Agent SDK |
|--------|-----------|
| **Primary API** | `query({ prompt, options })` → returns `Query` (async generator of `SDKMessage`) |
| **Runtime** | Node.js, Bun, or Deno (not browser) |
| **Execution model** | Spawns/manages Claude Code process; streams messages (assistant, user, result, system init, tool progress, etc.) |
| **Tools** | Full Claude Code toolset: Read, Write, Edit, Bash, Glob, Grep, MCP, WebSearch, WebFetch, **Task** (subagents), TodoWrite, etc. |
| **Options** | `cwd`, `model`, `agents` (subagent definitions), `mcpServers`, `allowedTools`, `permissionMode`, `hooks`, `sandbox`, `settingSources`, `resume` (session), etc. |
| **Use case** | Autonomous, multi-turn, tool-rich agent sessions (e.g. coding assistant, research agent with file/system access) |

So the SDK is for **server-side agentic workflows** where Claude can use tools, MCP, and subagents — not a thin REST wrapper for the Messages API.

---

## 2. What Our Project (Tech-Advisor / Atlas AI) Does

| Aspect | Tech-Advisor |
|--------|--------------|
| **Stack** | Vite + React SPA; **no backend** in repo. API key in frontend (`VITE_ANTHROPIC_API_KEY`). |
| **API** | Direct **Anthropic Messages API** via `fetch` to `/api/messages` (Vite proxy in dev → `api.anthropic.com/v1/messages`). |
| **Flow** | 1) Four specialist agents (cost, arch, ops, strategy) in parallel → 2) Optional Devil’s Advocate evaluator → 3) Optional revision of flagged agents → 4) Synthesis into a single **Brief** (JSON). |
| **Tools** | Only `web_search_20250305` for the four specialists; tool-use handled manually (extra request rounds when `stop_reason === "tool_use"`). |
| **Output** | Structured **Brief** (cost_analysis, architecture_review, operations_review, strategy_review, devils_advocate, meta, etc.). |

So we use the **Messages API** for a fixed, multi-phase pipeline that produces a defined JSON brief. No file system, no Bash, no MCP, no subprocess — and it all runs from the **browser** (with proxy for the API key in dev).

---

## 3. Can We Adapt the Agent SDK?

**Short answer:** Not by dropping it into the current frontend. We **can** use it by introducing a **backend** that runs the SDK and then either:

- Exposes a single “run advisor” endpoint that returns (or streams) a brief, or  
- Uses the SDK for new, more agentic flows (e.g. “deep research” or “code review”) while keeping the existing Messages API pipeline for the current UX.

### Why not in the browser?

- The SDK is built for **Node/Bun/Deno**: it expects `process`, `cwd`, subprocess spawning, and (optionally) file system and MCP. Browsers don’t support that.
- Our app is a **client-only** SPA; the SDK is a **server-side** agent runtime.

### Why a backend fits

- The SDK runs where Node (or Bun/Deno) runs: a **backend service** (Express, Fastify, or serverless with Node runtime).
- The **API key** should live on the server, not in the frontend.
- The backend can call `query({ prompt, options })`, consume the async iterator, and:
  - Either **aggregate** the final result and return a brief-shaped JSON, or  
  - **Stream** progress (e.g. SSE or WebSocket) so the UI can show phases/agent steps.

### High-level adaptation options

| Option | Description | Effort |
|--------|-------------|--------|
| **A. Backend that uses Agent SDK for the full brief** | New Node (or Bun) service; single “run advisor” prompt; SDK runs with tools (e.g. WebSearch, optional MCP). Backend maps SDK result (or last assistant message) into our `Brief` shape and returns/streams to the React app. | High: new service, prompt design, output parsing, streaming UX. |
| **B. Hybrid: keep Messages API pipeline + SDK for one flow** | Current pipeline stays as-is (four specialists → evaluator → synthesis) from the frontend. Add a backend endpoint that uses the Agent SDK for one specific flow (e.g. “deep research” or “code review”) and returns structured or streamed result. | Medium: one new endpoint and one new flow. |
| **C. Don’t use Agent SDK for current product** | Keep using only the Messages API for the multi-agent brief. Use the SDK only if we later add a clearly agentic, tool-heavy feature (e.g. “explore my repo and advise”). | None. |

---

## 4. If We Use the Agent SDK (e.g. Option A or B)

Concrete steps:

1. **Add a Node (or Bun) backend**  
   - e.g. `tech-advisor/server` or a separate repo that the frontend calls.

2. **Install and run the SDK on the server**  
   - `npm install @anthropic-ai/claude-agent-sdk`  
   - Use `query()` with a single prompt (and optional `agents` / `tools` / `mcpServers`) that embodies “produce a tech decision brief for: …”.

3. **Keep the API key server-side**  
   - Read from `process.env.ANTHROPIC_API_KEY` (or similar); never send it to the browser.

4. **Define how SDK output becomes a Brief**  
   - The SDK yields `SDKMessage` (e.g. `assistant`, `result`). We’d either:
     - Ask the model to output JSON in a known shape and parse the last assistant message or the `result` field, or  
     - Use `outputFormat: { type: 'json_schema', schema: ... }` (if supported) to get structured output and map it to our `Brief` type.

5. **Expose an HTTP API to the frontend**  
   - POST “run analysis” with body `{ input, context, scenarioOverrides }`.  
   - Response: either full JSON brief or a stream (SSE/WebSocket) of progress + final brief.

6. **Update the React app**  
   - Replace direct `fetch('/api/messages')` (and the multi-phase agent logic in `useAppLogic`) with `fetch('/api/analyze')` (or similar) to the new backend; optionally support streaming for phase/agent updates.

### Minimal “Option B” example (Node)

```ts
// server/index.ts (conceptual)
import { query } from "@anthropic-ai/claude-agent-sdk";

export async function runAdvisorAgent(userPrompt: string): Promise<Brief> {
  const messages: SDKMessage[] = [];
  for await (const msg of query({
    prompt: userPrompt,
    options: {
      model: "claude-sonnet-4-6",
      allowedTools: ["WebSearch"],
      maxTurns: 10,
      // systemPrompt: our SYSTEM_PROMPT that asks for Brief-shaped JSON
    },
  })) {
    messages.push(msg);
    if (msg.type === "result" && msg.subtype === "success") {
      return parseBriefFromResult(msg);
    }
  }
  throw new Error("No result");
}
```

The frontend would then call `POST /api/analyze` with `{ prompt: buildUserMessage() }` and display the returned `Brief` as it does today.

---

## 5. Recommendation

- **For the current “multi-agent brief” product:**  
  **Keep the existing Messages API pipeline.** It already gives you structured output, control over each phase (cost, arch, ops, strategy, evaluator, synthesis), and runs without a backend. The Agent SDK doesn’t replace this; it targets a different (agentic, tool-heavy, session-based) use case.

- **Adopt the Agent SDK when:**  
  - You add a **backend** and want a **single agent** that can use more tools (WebSearch, MCP, files, etc.) and optionally produce a brief, or  
  - You add a **new feature** that is inherently agentic (e.g. “analyze this repo,” “interactive deep-dive”) and run it on the server with the SDK.

- **Practical path:**  
  Implement **Option B**: keep the current flow as-is, and introduce a small Node (or Bun) backend that uses the Agent SDK for one new, high-value flow (e.g. “deep research” or “code review”). That gives you experience with the SDK and a clear separation: Messages API for the existing brief pipeline, Agent SDK for the new agentic feature.

---

## References

- [Agent SDK reference – TypeScript](https://platform.claude.com/docs/en/agent-sdk/typescript#query)  
- [Agent SDK – Options](https://platform.claude.com/docs/en/agent-sdk/typescript#options)  
- [Agent SDK – Query object](https://platform.claude.com/docs/en/agent-sdk/typescript#query-object)  
- Project: `src/api/agents.ts`, `src/hooks/useAppLogic.ts`, `src/api/config.ts`
