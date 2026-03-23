import type { AnalysisBrief } from '../hooks/useAnalysis'
import { useState } from 'react'
import {
  ChevronDown, ChevronRight, AlertTriangle, CheckCircle2,
  ArrowRight, Shield, TrendingUp, Wrench, Lightbulb, Globe, Hammer, XCircle
} from 'lucide-react'

interface Props {
  brief: AnalysisBrief
}

// ── Helpers ────────────────────────────────────────────────────────

function Badge({ children, color = 'zinc' }: { children: React.ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/20',
    red: 'bg-red-500/15 text-red-300 border-red-500/20',
    blue: 'bg-accent/12 text-accent-bright border-accent/25',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
    zinc: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border ${colors[color] || colors.zinc}`}>
      {children}
    </span>
  )
}

function decisionColor(decision?: string): string {
  const d = (decision || '').toUpperCase()
  if (d.includes('GO') && !d.includes('CONDITION')) return 'green'
  if (d.includes('CONDITION') || d.includes('CAUTION')) return 'amber'
  if (d.includes('DELAY') || d.includes('MORE_INFO') || d.includes('NEEDS')) return 'blue'
  if (d.includes('AVOID') || d.includes('RETRY')) return 'red'
  return 'zinc'
}

function severityColor(sev?: string): string {
  const s = (sev || '').toLowerCase()
  if (s === 'critical' || s === 'high') return 'red'
  if (s === 'medium') return 'amber'
  return 'zinc'
}

function Section({ title, icon, children, defaultOpen = true }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-surface-4 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-4 py-3 bg-surface-2 hover:bg-surface-3 transition-colors text-left"
      >
        {icon}
        <span className="text-sm font-medium text-zinc-200 flex-1">{title}</span>
        {open ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
      </button>
      {open && <div className="px-4 py-3 bg-surface-1 font-ui leading-relaxed">{children}</div>}
    </div>
  )
}

function PhaseCard({ phase, index }: {
  phase: NonNullable<NonNullable<AnalysisBrief['implementation_plan']>['phases']>[number]
  index: number
}) {
  const [expanded, setExpanded] = useState(index === 0)

  return (
    <div className="rounded-lg border border-surface-4 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-surface-2 hover:bg-surface-3 transition-colors text-left"
      >
        <span className="w-5 h-5 rounded-full bg-cyan-500/15 text-cyan-400 flex items-center justify-center flex-none text-[10px] font-medium">
          {index + 1}
        </span>
        <span className="text-xs font-medium text-zinc-200 flex-1">{phase.name}</span>
        {phase.duration && (
          <span className="text-[10px] text-zinc-500 flex-none">{phase.duration}</span>
        )}
        {expanded ? <ChevronDown size={12} className="text-zinc-600" /> : <ChevronRight size={12} className="text-zinc-600" />}
      </button>

      {expanded && (
        <div className="px-3 py-2.5 bg-surface-1 space-y-2.5">
          {phase.objective && (
            <p className="text-xs text-zinc-400 leading-relaxed">{phase.objective}</p>
          )}

          {/* Tasks */}
          {phase.tasks && phase.tasks.length > 0 && (
            <div>
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block mb-1">Tasks</span>
              <div className="space-y-1.5">
                {phase.tasks.map((t, ti) => (
                  <div key={ti} className="rounded-md bg-surface-2 px-2.5 py-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-zinc-300">{t.task}</span>
                      {t.duration && <span className="text-zinc-600 flex-none text-[10px]">{t.duration}</span>}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                      {t.owner && <span className="text-zinc-500 text-[10px]">{t.owner}</span>}
                      {t.dependencies && t.dependencies.length > 0 && (
                        <span className="text-zinc-600 text-[10px]">depends: {t.dependencies.join(', ')}</span>
                      )}
                    </div>
                    {t.technical_details && (
                      <p className="text-zinc-600 text-[10px] mt-1 font-mono leading-relaxed">{t.technical_details}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exit criteria */}
          {phase.exit_criteria && phase.exit_criteria.length > 0 && (
            <div>
              <span className="text-[10px] font-medium text-emerald-500/70 uppercase tracking-wider block mb-1">Exit criteria</span>
              <ul className="space-y-0.5">
                {phase.exit_criteria.map((ec, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex gap-1.5">
                    <span className="text-emerald-500/60 flex-none">✓</span> {ec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Rollback + Go/No-Go in a row */}
          <div className="flex gap-2">
            {phase.rollback && (
              <div className="flex-1 rounded-md bg-red-500/5 border border-red-500/10 px-2.5 py-1.5">
                <span className="text-[10px] font-medium text-red-400/70 block mb-0.5">Rollback</span>
                <p className="text-[11px] text-zinc-400">{phase.rollback}</p>
              </div>
            )}
            {phase.go_no_go && (
              <div className="flex-1 rounded-md bg-amber-500/5 border border-amber-500/10 px-2.5 py-1.5">
                <span className="text-[10px] font-medium text-amber-400/70 block mb-0.5">Go / No-go</span>
                <p className="text-[11px] text-zinc-400">{phase.go_no_go}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


// ── Main Component ─────────────────────────────────────────────────

export function BriefView({ brief }: Props) {
  const rec = brief.recommendation
  const confidence = brief.confidence
  const decisionTone = decisionColor(rec?.decision)
  const summaryTone =
    decisionTone === 'red'
      ? 'bg-red-500/6 border border-red-500/20'
      : decisionTone === 'green'
        ? 'bg-emerald-500/6 border border-emerald-500/20'
        : 'bg-surface-2/75 border border-surface-4'

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="sticky top-3 z-20">
        <div className="rounded-lg border border-surface-4 bg-surface-2/85 backdrop-blur-sm px-3 py-2">
          <nav className="flex flex-wrap gap-1.5 text-[11px] font-mono">
            <a href="#summary" className="px-2.5 py-1 rounded-md bg-surface-3 text-zinc-300 hover:text-zinc-100">Summary</a>
            {brief.pricing_tiers?.length ? <a href="#pricing" className="px-2.5 py-1 rounded-md text-zinc-400 hover:bg-surface-3 hover:text-zinc-200">Pricing</a> : null}
            {brief.options?.length ? <a href="#options" className="px-2.5 py-1 rounded-md text-zinc-400 hover:bg-surface-3 hover:text-zinc-200">Options</a> : null}
            {brief.risk_register?.length ? <a href="#risks" className="px-2.5 py-1 rounded-md text-zinc-400 hover:bg-surface-3 hover:text-zinc-200">Risks</a> : null}
            {brief.implementation_plan?.phases?.length ? <a href="#plan" className="px-2.5 py-1 rounded-md text-zinc-400 hover:bg-surface-3 hover:text-zinc-200">Plan</a> : null}
            {brief.research_sources?.length ? <a href="#sources" className="px-2.5 py-1 rounded-md text-zinc-400 hover:bg-surface-3 hover:text-zinc-200">Sources</a> : null}
          </nav>
        </div>
      </div>

      {/* ── Header card: decision + confidence ── */}
      <section id="summary" className={`rounded-xl p-5 ${summaryTone}`}>
        {brief.decision_statement && (
          <p className="text-lg font-semibold text-zinc-100 mb-3 leading-relaxed font-ui">
            {brief.decision_statement}
          </p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          {rec?.decision && (
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-semibold border font-mono tracking-wide bg-surface-1/70">
              <Badge color={decisionColor(rec.decision)}>
              {rec.decision.replace(/_/g, ' ')}
              </Badge>
            </span>
          )}
          {confidence != null && (
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.round((confidence / 10) * 100)}%`,
                    backgroundColor: confidence >= 7 ? '#34d399' : confidence >= 4 ? '#fbbf24' : '#f87171',
                  }}
                />
              </div>
              <span className="text-xs text-zinc-300 tabular-nums font-mono">{confidence}/10</span>
            </div>
          )}
        </div>

        {brief.executive_summary && (
          <p className="text-base text-zinc-200 mt-4 leading-7 font-ui">
            {brief.executive_summary}
          </p>
        )}
      </section>

      {/* ── Analysis highlights (the 4 perspectives) ── */}
      {brief.analysis_highlights && (
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { key: 'financial', icon: <TrendingUp size={13} />, label: 'Financial' },
            { key: 'technical', icon: <Wrench size={13} />, label: 'Architecture' },
            { key: 'operational', icon: <Shield size={13} />, label: 'Operations' },
            { key: 'strategic', icon: <Lightbulb size={13} />, label: 'Strategy' },
          ].map(({ key, icon, label }) => {
            const text = (brief.analysis_highlights as Record<string, string>)?.[key]
            if (!text) return null
            return (
              <div key={key} className="rounded-lg bg-[#1a1a1f] p-3">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-zinc-500">{icon}</span>
                  <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</span>
                </div>
                <p className="text-sm text-zinc-300 leading-6 font-ui">{text}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Pricing tiers comparison ── */}
      {brief.pricing_tiers && brief.pricing_tiers.length > 0 && (
        <div id="pricing">
        <Section
          title={`Pricing by tier (${brief.pricing_tiers.length})`}
          icon={<TrendingUp size={14} className="text-teal-400" />}
        >
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-xs font-ui">
              <thead>
                <tr className="border-b border-surface-4">
                  <th className="text-left py-2 px-2 text-zinc-500 font-medium">Provider</th>
                  <th className="text-left py-2 px-2 text-zinc-500 font-medium">Tier / Plan</th>
                  <th className="text-right py-2 px-2 text-zinc-500 font-medium">Monthly</th>
                  <th className="text-left py-2 px-2 text-zinc-500 font-medium">Includes</th>
                  <th className="text-center py-2 px-2 text-zinc-500 font-medium">Fits?</th>
                </tr>
              </thead>
              <tbody>
                {brief.pricing_tiers.map((tier, i) => {
                  const fits = tier.fits_workload
                  return (
                    <tr key={i} className="border-b border-surface-3 last:border-0 group hover:bg-surface-2/45 transition-colors">
                      <td className="py-2 px-2 text-zinc-400 font-medium">{tier.provider}</td>
                      <td className="py-2 px-2">
                        <span className="text-zinc-200">{tier.tier}</span>
                        {tier.notes && (
                          <p className="text-zinc-600 mt-0.5 text-[11px] leading-tight group-hover:text-zinc-500 transition-colors">
                            {tier.notes}
                          </p>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right text-zinc-200 tabular-nums font-medium">
                        {tier.monthly_cost}
                      </td>
                      <td className="py-2 px-2 text-zinc-300 max-w-[200px] leading-relaxed">
                        {tier.includes || '—'}
                      </td>
                      <td className="py-2 px-2 text-center">
                        {fits === true && (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px]">✓</span>
                        )}
                        {fits === false && (
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/15 text-red-400 text-[10px]">✗</span>
                        )}
                        {fits == null && (
                          <span className="text-zinc-600">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Section>
        </div>
      )}

      {/* ── Options comparison ── */}
      {brief.options && brief.options.length > 0 && (
        <div id="options">
        <Section
          title={`Options (${brief.options.length})`}
          icon={<ArrowRight size={14} className="text-accent-bright" />}
        >
          <div className="space-y-3">
            {brief.options.map((opt, i) => (
              <div key={i} className="rounded-lg border border-surface-4 bg-surface-2/70 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-zinc-200">{opt.name}</span>
                  {opt.estimated_cost && (
                    <Badge color="blue">{opt.estimated_cost}</Badge>
                  )}
                  {opt.timeline && (
                    <Badge>{opt.timeline}</Badge>
                  )}
                </div>
                {opt.summary && (
                  <p className="text-sm text-zinc-300 mb-3 leading-6 font-ui">{opt.summary}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {opt.pros && opt.pros.length > 0 && (
                    <div className="rounded-md bg-surface-2 px-2.5 py-2 border-l-2 border-emerald-400/75">
                      <span className="text-xs font-medium text-zinc-300 block mb-1">Pros</span>
                      <ul className="space-y-0.5">
                        {opt.pros.map((p, j) => (
                          <li key={j} className="text-xs text-zinc-300 flex gap-1.5">
                            <CheckCircle2 size={12} className="text-emerald-300 mt-0.5 flex-none" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {opt.cons && opt.cons.length > 0 && (
                    <div className="rounded-md bg-surface-2 px-2.5 py-2 border-l-2 border-red-300/75">
                      <span className="text-xs font-medium text-zinc-300 block mb-1">Cons</span>
                      <ul className="space-y-0.5">
                        {opt.cons.map((c, j) => (
                          <li key={j} className="text-xs text-zinc-300 flex gap-1.5">
                            <XCircle size={12} className="text-red-300 mt-0.5 flex-none" />
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>
        </div>
      )}

      {/* ── Risk register ── */}
      {brief.risk_register && brief.risk_register.length > 0 && (
        <div id="risks">
        <Section
          title={`Risks (${brief.risk_register.length})`}
          icon={<AlertTriangle size={14} className="text-amber-400" />}
          defaultOpen={false}
        >
          <div className="space-y-2">
            {brief.risk_register.map((risk, i) => (
              <div key={i} className="flex items-start gap-2.5 py-2 border-b border-surface-3 last:border-0">
                <Badge color={severityColor(risk.likelihood || risk.impact)}>
                  {risk.likelihood || risk.impact || '?'}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-zinc-300">{risk.risk}</p>
                  {risk.mitigation && (
                    <p className="text-xs text-zinc-500 mt-0.5">{risk.mitigation}</p>
                  )}
                </div>
                {risk.owner && (
                  <span className="text-xs text-zinc-600 flex-none">{risk.owner}</span>
                )}
              </div>
            ))}
          </div>
        </Section>
        </div>
      )}

      {/* ── Recommendation ── */}
      {rec && (
        <Section
          title="Recommendation"
          icon={<CheckCircle2 size={14} className="text-emerald-400" />}
        >
          {rec.rationale && (
            <p className="text-sm text-zinc-300 leading-relaxed mb-3">{rec.rationale}</p>
          )}

          {rec.conditions && rec.conditions.length > 0 && (
            <div className="mb-3">
              <span className="text-xs font-medium text-zinc-400 block mb-1.5">Conditions</span>
              <ul className="space-y-1">
                {rec.conditions.map((c, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex gap-2">
                    <span className="text-amber-500 flex-none">*</span>
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {rec.next_steps && rec.next_steps.length > 0 && (
            <div>
              <span className="text-xs font-medium text-zinc-400 block mb-1.5">Next steps</span>
              <div className="space-y-1.5">
                {rec.next_steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="w-4 h-4 rounded-full bg-accent/15 text-accent-bright flex items-center justify-center flex-none text-[10px] font-medium mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1">
                      <span className="text-zinc-300">{step.step}</span>
                      {(step.owner || step.by_when) && (
                        <span className="text-zinc-600 ml-1">
                          {[step.owner, step.by_when].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── Implementation plan ── */}
      {brief.implementation_plan && brief.implementation_plan.phases && brief.implementation_plan.phases.length > 0 && (() => {
        const plan = brief.implementation_plan!
        const isMonitoring = plan.plan_type === 'monitoring'
        return (
          <div id="plan">
          <Section
            title={isMonitoring ? 'Monitoring plan' : `Implementation plan (${plan.phases!.length} phases)`}
            icon={<Hammer size={14} className="text-cyan-400" />}
          >
            {/* Plan header */}
            <div className="rounded-lg bg-surface-2 border border-surface-4 p-3 mb-3">
              {plan.summary && (
                <p className="text-sm text-zinc-300 leading-relaxed mb-2">{plan.summary}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {plan.recommended_option && (
                  <Badge color="blue">{plan.recommended_option}</Badge>
                )}
                {plan.estimated_total_duration && (
                  <Badge>{plan.estimated_total_duration}</Badge>
                )}
                {plan.estimated_total_cost && (
                  <Badge color="amber">{plan.estimated_total_cost}</Badge>
                )}
              </div>
            </div>

            {/* Prerequisites */}
            {plan.prerequisites && plan.prerequisites.length > 0 && (
              <div className="mb-3">
                <span className="text-xs font-medium text-zinc-400 block mb-1.5">Prerequisites</span>
                <ul className="space-y-0.5">
                  {plan.prerequisites.map((p, i) => (
                    <li key={i} className="text-xs text-zinc-400 flex gap-1.5">
                      <span className="text-zinc-600 flex-none">□</span> {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Phases */}
            <div className="space-y-2.5">
              {plan.phases!.map((phase, pi) => (
                <PhaseCard key={pi} phase={phase} index={pi} />
              ))}
            </div>

            {/* Validation checklist */}
            {plan.validation_checklist && plan.validation_checklist.length > 0 && (
              <div className="mt-3 pt-3 border-t border-surface-3">
                <span className="text-xs font-medium text-zinc-400 block mb-1.5">Validation checklist</span>
                <div className="space-y-1">
                  {plan.validation_checklist.map((vc, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-zinc-600 flex-none mt-0.5">☐</span>
                      <div className="flex-1">
                        <span className="text-zinc-300">{vc.check}</span>
                        {vc.method && <span className="text-zinc-600 ml-1">— {vc.method}</span>}
                        {vc.pass_criteria && (
                          <span className="text-emerald-500/70 ml-1">✓ {vc.pass_criteria}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Team requirements */}
            {plan.team_requirements && plan.team_requirements.length > 0 && (
              <div className="mt-3 pt-3 border-t border-surface-3">
                <span className="text-xs font-medium text-zinc-400 block mb-1.5">Team requirements</span>
                <div className="flex flex-wrap gap-1.5">
                  {plan.team_requirements.map((tr, i) => (
                    <div key={i} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-3 text-xs">
                      <span className="text-zinc-300">{tr.role}</span>
                      {tr.allocation && <span className="text-zinc-500">· {tr.allocation}</span>}
                      {tr.duration && <span className="text-zinc-600">· {tr.duration}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
          </div>
        )
      })()}

      {/* ── Devil's advocate ── */}
      {brief.devils_advocate?.assessment && (
        <Section
          title="Devil's advocate"
          icon={<AlertTriangle size={14} className="text-orange-400" />}
          defaultOpen={false}
        >
          <p className="text-sm text-zinc-300 leading-relaxed mb-2">
            {brief.devils_advocate.assessment}
          </p>
          {brief.devils_advocate.biggest_risk && (
            <div className="rounded-lg bg-red-500/8 border border-red-500/15 px-3 py-2 mb-2">
              <span className="text-xs font-medium text-red-400 block mb-0.5">Biggest risk</span>
              <p className="text-xs text-zinc-300">{brief.devils_advocate.biggest_risk}</p>
            </div>
          )}
          {brief.devils_advocate.blind_spots && brief.devils_advocate.blind_spots.length > 0 && (
            <div>
              <span className="text-xs font-medium text-zinc-400 block mb-1">Blind spots</span>
              <ul className="space-y-0.5">
                {brief.devils_advocate.blind_spots.map((b, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex gap-1.5">
                    <span className="text-orange-500">!</span> {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* ── What flips this ── */}
      {brief.what_flips_this && brief.what_flips_this.length > 0 && (
        <div className="rounded-lg border border-surface-4 bg-surface-2 px-4 py-3">
          <span className="text-xs font-medium text-zinc-400 block mb-1.5">What would change this recommendation</span>
          <ul className="space-y-1">
            {brief.what_flips_this.map((item, i) => (
              <li key={i} className="text-xs text-zinc-400 flex gap-1.5">
                <span className="text-accent-bright flex-none">→</span> {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Open questions ── */}
      {brief.open_questions && brief.open_questions.length > 0 && (
        <div className="rounded-lg border border-dashed border-surface-4 px-4 py-3">
          <span className="text-xs font-medium text-zinc-500 block mb-1.5">Open questions</span>
          <ul className="space-y-0.5">
            {brief.open_questions.map((q, i) => (
              <li key={i} className="text-xs text-zinc-500">• {q}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Research sources ── */}
      {brief.research_sources && brief.research_sources.length > 0 && (() => {
        const pricing = brief.research_sources!.filter(s => s.type === 'pricing_page')
        const web = brief.research_sources!.filter(s => s.type !== 'pricing_page')
        return (
          <div id="sources">
          <Section
            title={`Sources (${brief.research_sources!.length})`}
            icon={<Globe size={14} className="text-teal-400" />}
            defaultOpen={false}
          >
            {pricing.length > 0 && (
              <div className="mb-3">
                <span className="text-[10px] font-medium text-amber-400/70 uppercase tracking-wider block mb-1.5">
                  Vendor pricing pages ({pricing.length})
                </span>
                <div className="space-y-1">
                  {pricing.map((src, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400/50 flex-none" />
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-zinc-200 truncate underline underline-offset-2 decoration-zinc-700"
                      >
                        {src.provider ? `${src.provider} — ` : ''}{src.title || src.url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {web.length > 0 && (
              <div>
                <span className="text-[10px] font-medium text-teal-400/70 uppercase tracking-wider block mb-1.5">
                  Web research ({web.length})
                </span>
                <div className="space-y-1">
                  {web.map((src, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-teal-400/40 flex-none" />
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-400 hover:text-zinc-200 truncate underline underline-offset-2 decoration-zinc-700"
                      >
                        {src.title || src.url}
                      </a>
                      {src.agent && (
                        <span className="text-zinc-600 flex-none text-[10px]">{src.agent}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Section>
          </div>
        )
      })()}
    </div>
  )
}