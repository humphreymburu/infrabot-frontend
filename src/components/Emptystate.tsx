import { ChatInput } from './Chatinput'

interface Props {
  onSelect: (question: string) => void
  value: string
  onChange: (value: string) => void
  onSend: (text: string) => void
  disabled: boolean
}

const EXAMPLES = [
  {
    label: 'Build vs buy',
    question: 'Should we build our own auth system or use Auth0/Clerk? We have 3 engineers, 50k MAU, and need SSO within 2 months.',
  },
  {
    label: 'Migration decision',
    question: 'We\'re considering migrating from self-hosted PostgreSQL to PlanetScale. 200GB database, ~2000 QPS, team of 4. Timeline is 3 months, budget is $5k/mo.',
  },
  {
    label: 'Architecture choice',
    question: 'Our Django monolith is struggling at 500 RPS. Should we go microservices, modular monolith, or add a caching layer? Team is 8 engineers, risk appetite is moderate.',
  },
  {
    label: 'Vendor evaluation',
    question: 'Kafka vs Redpanda vs AWS Kinesis for our event pipeline. 150k events/sec, 5 consumers, 14-day retention. We\'re already on AWS. Budget conscious.',
  },
]

export function EmptyState({
  onSelect,
  value,
  onChange,
  onSend,
  disabled,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-2 animate-fade-in">
      <p className="text-[10px] uppercase tracking-[0.22em] text-zinc-400 mb-4 text-center font-mono">
        Multi-agent · structured brief
      </p>

      <h2 className="text-3xl md:text-4xl font-semibold text-zinc-100 tracking-tight text-center mb-3 max-w-3xl">
        Make bulletproof tech decisions, faster.
      </h2>

      <p className="text-base text-zinc-300 mb-7 text-center max-w-2xl leading-relaxed font-ui">
        Describe a technology decision once, then get a clear brief across cost, architecture,
        operations, and strategy with implementation-ready next steps.
      </p>

      <div className="w-full max-w-2xl mb-4">
        <ChatInput
          value={value}
          onChange={onChange}
          onSend={onSend}
          disabled={disabled}
          large
        />
      </div>

      <p className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3 w-full max-w-2xl font-mono">
        Try a prompt
      </p>
      <div className="flex flex-wrap justify-center gap-2 w-full max-w-2xl">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => onSelect(ex.question)}
            className="
              px-3.5 py-2 rounded-full text-xs font-medium font-mono
              border border-surface-4 bg-[#1a1a1f] text-zinc-300
              hover:border-accent/55 hover:text-zinc-100 hover:bg-surface-3
              transition-colors duration-150
            "
          >
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  )
}
