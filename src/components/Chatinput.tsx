import { useRef, useEffect } from 'react'
import { Send } from 'lucide-react'

interface Props {
  value: string
  onChange: (value: string) => void
  onSend: (text: string) => void
  disabled: boolean
  className?: string
  large?: boolean
}

export function ChatInput({
  value,
  onChange,
  onSend,
  disabled,
  className = '',
  large = false,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }, [value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend(value)
    }
  }

  return (
    <div
      className={[
        'relative flex items-end gap-2 rounded-lg border border-surface-4 bg-surface-2/95',
        'focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25',
        'shadow-[0_0_0_1px_rgba(255,255,255,0.02),0_14px_36px_rgba(0,0,0,0.55)]',
        large ? 'px-4 py-3.5' : 'px-3 py-2',
        className,
      ].join(' ')}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Describe a tech decision you're facing..."
        rows={1}
        className="
          flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-500
          resize-none outline-none py-1
          disabled:opacity-50
        "
      />
      <button
        onClick={() => onSend(value)}
        disabled={disabled || !value.trim()}
        className={[
          'flex-none rounded-md flex items-center justify-center',
          'bg-accent hover:bg-[#1dd7c9] disabled:brightness-75',
          'shadow-[0_2px_10px_rgba(18,196,182,0.35)] hover:shadow-[0_2px_16px_rgba(18,196,182,0.55)]',
          'disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95',
          large ? 'w-10 h-10' : 'w-8 h-8',
        ].join(' ')}
      >
        <Send size={large ? 16 : 14} className="text-white translate-x-[0.5px]" />
      </button>
    </div>
  )
}