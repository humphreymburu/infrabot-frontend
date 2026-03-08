# Atlas AI — Multi-Agent AI System v3

An AI-powered application that combines 5 specialist agents (Cost FinOps, Architecture, SRE, DevOps, Strategy), a Critical Review evaluator, and a synthesis engine to produce executive-grade technology decision briefs grounded in real vendor pricing data.

## Quick Start

### Running with Backend (recommended)

Analysis runs on the server using the [Claude Agent SDK](https://platform.claude.com/docs/en/agent-sdk/python) (Python). No API key in the browser.

**1. Backend (from project root)**

```bash
cd tech-advisor
cp server/.env.example server/.env
# Edit server/.env → set ANTHROPIC_API_KEY=sk-ant-...

# With uv (recommended): https://docs.astral.sh/uv/getting-started/installation/
uv sync --project server
uv run --project server uvicorn server.main:app --reload --host 0.0.0.0 --port 8000

# Or with pip:
pip install -r server/requirements.txt
uvicorn server.main:app --reload --host 0.0.0.0 --port 8000
```

**2. Frontend**

```bash
npm install
npm run dev
```

Open http://localhost:5173. The app proxies `/api/analyze` and `/api/health` to the backend; analysis is done server-side.

### Option 1: API Key in Browser (legacy)

```bash
npm install
npm run dev
```

Open http://localhost:5173 and paste your Anthropic API key in the header field. (Requires the old frontend-only flow; with the backend running, analysis uses the backend instead.)

### Option 2: API Key via Environment (legacy proxy)

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
# Serve dist/ and run the FastAPI backend; proxy /api/* to the backend
```

## Architecture

```
User Input → Intake Form (budget, team, compliance, timeline)
    ↓
Backend: 4 specialists (Agent SDK) → Evaluator → Revision → Synthesis
    ↓
Decision Brief with tabs: Brief | Critical Review | Sources | Scenarios | History
```

## Estimated API Cost

~$1.50–$3.00 per analysis (Claude Sonnet 4 calls with web search on the server)
