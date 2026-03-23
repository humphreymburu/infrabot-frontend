import type { AgentState, Phase } from '../hooks/useAnalysis'
import { CheckCircle2, AlertCircle, Loader2, Circle, Globe } from 'lucide-react'

interface Props {
  phase: Phase
  agents: AgentState[]
  searchEnabled?: boolean
}

const PHASE_LABELS: Record<string, string> = {
  idle: 'Ready',
  compressing: 'Compressing input',
  researching: 'Running specialists',
  evaluating: 'Devil\'s advocate review',
  revising: 'Revising flagged sections',
  synthesizing: 'Synthesizing brief',
  planning: 'Building implementation plan',
  done: 'Complete',
  error: 'Failed',
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'done':
      return <CheckCircle2 size={14} className="text-emerald-400" />
    case 'error':
      return <AlertCircle size={14} className="text-red-400" />
    case 'working':
      return <Loader2 size={14} className="text-accent-bright animate-spin" />
    default:
      return <Circle size={14} className="text-zinc-600" />
  }
}

export function PipelineView({ phase, agents, searchEnabled }: Props) {
  if (phase === 'idle') return null

  // Group: specialists (first 4), then evaluator, then synthesis
  const specialists = agents.filter(a => ['cost', 'arch', 'ops', 'strategy'].includes(a.key))
  const evaluator = agents.find(a => a.key === 'evaluator')
  const synthesis = agents.find(a => a.key === 'synthesis')
  const planner = agents.find(a => a.key === 'planner')
  const totalPricingPages = agents.reduce((acc, a) => acc + (a.pricing_pages || 0), 0)
  const totalWebResults = agents.reduce((acc, a) => acc + (a.web_results || 0), 0)

  return (
    <div className="rounded-md border border-surface-4 bg-surface-2/40 p-4 mb-5 animate-fade-in">
      {/* Phase header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {phase !== 'done' && phase !== 'error' && (
            <div className="w-1.5 h-1.5 rounded-full bg-accent-bright animate-pulse" />
          )}
          {phase === 'done' && <CheckCircle2 size={14} className="text-emerald-400" />}
          {phase === 'error' && <AlertCircle size={14} className="text-red-400" />}
          <span className="text-xs font-medium text-zinc-300 uppercase tracking-wider">
            {PHASE_LABELS[phase] || phase}
          </span>
        </div>
        {searchEnabled && (
          <div className="flex items-center gap-1 text-xs text-accent-bright/65">
            <Globe size={11} />
            <span>Web research</span>
          </div>
        )}
      </div>

      {/* Specialist grid */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {specialists.map(agent => (
          <div
            key={agent.key}
            className={`
              flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
              transition-all duration-300
              ${agent.status === 'working' ? 'bg-accent/10 border border-accent/25' :
                agent.status === 'done' ? 'bg-emerald-500/8 border border-emerald-500/15' :
                agent.status === 'error' ? 'bg-red-500/8 border border-red-500/15' :
                'bg-surface-2 border border-surface-4'}
            `}
          >
            <StatusIcon status={agent.status} />
            <span className={`flex-1 ${
              agent.status === 'working' ? 'text-accent-bright' :
              agent.status === 'done' ? 'text-emerald-300' :
              agent.status === 'error' ? 'text-red-300' :
              'text-zinc-500'
            }`}>
              {agent.label}
            </span>
          </div>
        ))}
      </div>

      {/* Evaluator + Synthesis + Planner row */}
      <div className="flex gap-2">
        {evaluator && (
          <div className={`
            flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
            transition-all duration-300
            ${evaluator.status === 'working' ? 'bg-amber-500/10 border border-amber-500/20' :
              evaluator.status === 'done' ? 'bg-emerald-500/8 border border-emerald-500/15' :
              'bg-surface-2 border border-surface-4'}
          `}>
            <StatusIcon status={evaluator.status} />
            <span className={
              evaluator.status === 'working' ? 'text-amber-300' :
              evaluator.status === 'done' ? 'text-emerald-300' :
              'text-zinc-500'
            }>
              {evaluator.label}
            </span>
          </div>
        )}
        {synthesis && (
          <div className={`
            flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
            transition-all duration-300
            ${synthesis.status === 'working' ? 'bg-sky-500/10 border border-sky-500/25' :
              synthesis.status === 'done' ? 'bg-emerald-500/8 border border-emerald-500/15' :
              'bg-surface-2 border border-surface-4'}
          `}>
            <StatusIcon status={synthesis.status} />
            <span className={
              synthesis.status === 'working' ? 'text-sky-300' :
              synthesis.status === 'done' ? 'text-emerald-300' :
              'text-zinc-500'
            }>
              {synthesis.label}
            </span>
          </div>
        )}
        {planner && (
          <div className={`
            flex-1 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
            transition-all duration-300
            ${planner.status === 'working' ? 'bg-accent/10 border border-accent/22' :
              planner.status === 'done' ? 'bg-emerald-500/8 border border-emerald-500/15' :
              'bg-surface-2 border border-surface-4'}
          `}>
            <StatusIcon status={planner.status} />
            <span className={
              planner.status === 'working' ? 'text-accent-bright' :
              planner.status === 'done' ? 'text-emerald-300' :
              'text-zinc-500'
            }>
              {planner.label}
            </span>
          </div>
        )}
      </div>
      {phase === 'done' && searchEnabled && (totalPricingPages > 0 || totalWebResults > 0) && (
        <div className="mt-3 pt-3 border-t border-surface-3">
          <p className="text-xs text-zinc-400 font-ui">
            Generated using{' '}
            <span className="text-zinc-200 tabular-nums font-mono">{totalWebResults}</span>{' '}
            web sources and{' '}
            <span className="text-zinc-200 tabular-nums font-mono">{totalPricingPages}</span>{' '}
            vendor pricing pages.
          </p>
        </div>
      )}
    </div>
  )
}