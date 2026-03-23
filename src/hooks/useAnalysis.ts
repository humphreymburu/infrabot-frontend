import { useState, useCallback, useRef } from 'react'

// ── Types ──────────────────────────────────────────────────────────

export type Phase = 'idle' | 'compressing' | 'researching' | 'evaluating' | 'revising' | 'synthesizing' | 'planning' | 'done' | 'error'

export type AgentStatus = 'pending' | 'working' | 'done' | 'error'

export interface AgentState {
  key: string
  label: string
  status: AgentStatus
  sources?: number
  pricing_pages?: number
  web_results?: number
}

export interface AnalysisBrief {
  executive_summary?: string
  decision_statement?: string
  context?: {
    current_state?: string
    trigger?: string
    constraints?: string[]
  }
  options?: Array<{
    name: string
    summary?: string
    pros?: string[]
    cons?: string[]
    estimated_cost?: string
    timeline?: string
  }>
  analysis_highlights?: {
    financial?: string
    technical?: string
    operational?: string
    strategic?: string
  }
  pricing_tiers?: Array<{
    provider: string
    tier: string
    monthly_cost: string
    includes?: string
    fits_workload?: boolean
    notes?: string
  }>
  risk_register?: Array<{
    risk: string
    likelihood?: string
    impact?: string
    mitigation?: string
    owner?: string
  }>
  recommendation?: {
    decision?: string
    rationale?: string
    conditions?: string[]
    next_steps?: Array<{ step: string; owner?: string; by_when?: string }>
  }
  what_flips_this?: string[]
  confidence?: number
  open_questions?: string[]
  devils_advocate?: {
    assessment?: string
    biggest_risk?: string
    challenges?: Array<{ issue: string; severity?: string; area?: string }>
    blind_spots?: string[]
    revised_confidence?: number
  }
  implementation_plan?: {
    plan_type?: string
    recommended_option?: string
    summary?: string
    prerequisites?: string[]
    phases?: Array<{
      name: string
      objective?: string
      duration?: string
      tasks?: Array<{
        task: string
        owner?: string
        duration?: string
        dependencies?: string[]
        technical_details?: string
      }>
      exit_criteria?: string[]
      rollback?: string
      go_no_go?: string
    }>
    validation_checklist?: Array<{
      check: string
      method?: string
      pass_criteria?: string
    }>
    risk_mitigations?: Array<{
      risk: string
      mitigation_step?: string
    }>
    estimated_total_duration?: string
    estimated_total_cost?: string
    team_requirements?: Array<{
      role: string
      allocation?: string
      duration?: string
    }>
  } | null
  _run_id?: string
  _timestamp?: string
  research_sources?: Array<{
    type: string
    title: string
    url: string
    provider?: string
    agent?: string
  }>
  [key: string]: unknown
}

export interface AnalysisState {
  phase: Phase
  agents: AgentState[]
  brief: AnalysisBrief | null
  streamText: string
  error: string | null
  runId: string | null
  searchEnabled: boolean
}

const AGENT_LABELS: Record<string, string> = {
  cost: 'Financial',
  arch: 'Architecture',
  ops: 'Operations',
  strategy: 'Strategy',
  evaluator: 'Devil\'s advocate',
  synthesis: 'Synthesis',
  planner: 'Implementation',
}

const INITIAL_AGENTS: AgentState[] = [
  { key: 'cost', label: 'Financial', status: 'pending' },
  { key: 'arch', label: 'Architecture', status: 'pending' },
  { key: 'ops', label: 'Operations', status: 'pending' },
  { key: 'strategy', label: 'Strategy', status: 'pending' },
  { key: 'evaluator', label: 'Devil\'s advocate', status: 'pending' },
  { key: 'synthesis', label: 'Synthesis', status: 'pending' },
  { key: 'planner', label: 'Implementation', status: 'pending' },
]

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').trim()
const ANALYZE_STREAM_URL = API_BASE_URL
  ? `${API_BASE_URL.replace(/\/+$/, '')}/api/analyze/stream`
  : '/api/analyze/stream'

// ── Hook ───────────────────────────────────────────────────────────

export function useAnalysis() {
  const [state, setState] = useState<AnalysisState>({
    phase: 'idle',
    agents: INITIAL_AGENTS,
    brief: null,
    streamText: '',
    error: null,
    runId: null,
    searchEnabled: false,
  })

  const abortRef = useRef<AbortController | null>(null)

  const updateAgent = (key: string, status: AgentStatus, extra?: { sources?: number; pricing_pages?: number; web_results?: number }) => {
    setState(prev => ({
      ...prev,
      agents: prev.agents.map(a =>
        a.key === key ? { ...a, status, ...(extra || {}) } : a
      ),
    }))
  }

  const analyze = useCallback(async (
    userMessage: string,
    options?: { budget?: string; timeline?: string; risk_appetite?: string; compliance?: string[] }
  ) => {
    // Abort any existing request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // Reset state
    setState({
      phase: 'compressing',
      agents: INITIAL_AGENTS.map(a => ({ ...a, status: 'pending' as AgentStatus })),
      brief: null,
      streamText: '',
      error: null,
      runId: null,
      searchEnabled: false,
    })

    try {
      const res = await fetch(ANALYZE_STREAM_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_message: userMessage,
          budget: options?.budget || '',
          timeline: options?.timeline || '',
          risk_appetite: options?.risk_appetite || '',
          compliance: options?.compliance || [],
        }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const text = await res.text()
        setState(prev => ({ ...prev, phase: 'error', error: text || `HTTP ${res.status}` }))
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setState(prev => ({ ...prev, phase: 'error', error: 'No response body' }))
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          try {
            const ev = JSON.parse(trimmed)
            const type = ev.type as string

            if (type === 'phase') {
              setState(prev => ({ ...prev, phase: ev.phase as Phase, runId: ev.run_id || prev.runId }))

              // When entering researching, mark specialists as working
              if (ev.phase === 'researching') {
                for (const key of ['cost', 'arch', 'ops', 'strategy']) {
                  updateAgent(key, 'working')
                }
              }
              if (ev.phase === 'evaluating') {
                updateAgent('evaluator', 'working')
              }
              if (ev.phase === 'synthesizing') {
                updateAgent('synthesis', 'working')
              }
              if (ev.phase === 'planning') {
                updateAgent('planner', 'working')
              }
            }

            if (type === 'search_status') {
              setState(prev => ({ ...prev, searchEnabled: !!ev.enabled }))
            }

            if (type === 'agent') {
              const agentKey = ev.agent as string
              const status = ev.status as AgentStatus
              updateAgent(agentKey, status, {
                sources: typeof ev.sources === 'number' ? ev.sources : undefined,
                pricing_pages: typeof ev.pricing_pages === 'number' ? ev.pricing_pages : undefined,
                web_results: typeof ev.web_results === 'number' ? ev.web_results : undefined,
              })
            }

            if (type === 'assistant_delta') {
              setState(prev => ({
                ...prev,
                streamText: prev.streamText + (ev.delta || ''),
              }))
            }

            if (type === 'final') {
              setState(prev => ({
                ...prev,
                brief: ev.brief as AnalysisBrief,
                phase: 'done',
              }))
            }

            if (type === 'error') {
              setState(prev => ({
                ...prev,
                phase: 'error',
                error: ev.detail || 'Analysis failed',
              }))
            }
          } catch {
            // skip malformed lines
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setState(prev => ({
        ...prev,
        phase: 'error',
        error: err instanceof Error ? err.message : 'Request failed',
      }))
    }
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState({
      phase: 'idle',
      agents: INITIAL_AGENTS,
      brief: null,
      streamText: '',
      error: null,
      runId: null,
      searchEnabled: false,
    })
  }, [])

  return {
    ...state,
    analyze,
    reset,
    isLoading: !['idle', 'done', 'error'].includes(state.phase),
  }
}