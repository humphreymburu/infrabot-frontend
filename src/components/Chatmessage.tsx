import type { UIMessage } from 'ai'
import ReactMarkdown from 'react-markdown'

interface Props {
  message: UIMessage
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'

  // Extract text from parts (AI SDK v5+ format)
  const text = message.parts
    ?.filter((p): p is Extract<typeof p, { type: 'text' }> => p.type === 'text')
    .map((p) => p.text)
    .join('\n') || ''

  if (!text) return null

  return (
    <div className={`flex gap-3 py-4 animate-slide-up ${isUser ? '' : ''}`}>
      {/* Avatar */}
      <div className={`
        w-6 h-6 rounded-md flex items-center justify-center flex-none mt-0.5
        ${isUser ? 'bg-surface-3' : 'bg-accent/15'}
      `}>
        {isUser ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-zinc-400">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent-bright">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-muted mb-1 block">
          {isUser ? 'You' : 'Advisor'}
        </span>
        {isUser ? (
          <p className="text-zinc-200 text-sm leading-relaxed">{text}</p>
        ) : (
          <div className="message-prose text-sm">
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}