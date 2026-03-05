# Atlas AI — Multi-Agent AI System v3

An AI-powered application that combines 5 specialist agents (Cost FinOps, Architecture, SRE, DevOps, Strategy), a Critical Review evaluator, and a synthesis engine to produce executive-grade technology decision briefs grounded in real vendor pricing data.

## Quick Start

### Option 1: API Key in Browser (Simplest)

```bash
npm install
npm run dev
```

Open http://localhost:5173 and paste your Anthropic API key in the header field.

### Option 2: API Key via Environment (Secure)

```bash
cp .env.example .env
# Edit .env → add ANTHROPIC_API_KEY=sk-ant-...

npm install
npm run dev
```

Vite proxies `/api/messages` → Anthropic API with your key injected server-side.

### Production Build

```bash
npm run build
# Deploy dist/ behind a backend proxy that injects your API key
```

## Architecture

```
User Input → Intake Form (budget, team, compliance, timeline)
    ↓
5 Parallel Specialist Agents (Promise.all + web_search)
  [$] Cost FinOps  [◈] Architecture  [⚙] SRE  [▶] DevOps  [◆] Strategy
    ↓
[⚠] Critical Review (challenges weak claims)
    ↓
[◉] Synthesis Engine (merges all into executive brief)
    ↓
Decision Brief with tabs: Brief | Critical Review | Sources | Scenarios | History
```

## Estimated API Cost

~$1.50–$3.00 per analysis (7 Claude Sonnet 4.5 calls with web search)
