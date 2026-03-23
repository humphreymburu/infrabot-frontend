interface Props {
    status: 'ready' | 'submitted' | 'streaming' | 'error'
    messageCount: number
  }
  
  export function StatusBar({ status, messageCount }: Props) {
    const isActive = status === 'submitted' || status === 'streaming'
  
    return (
      <div className="flex items-center gap-3 text-xs text-muted">
        {messageCount > 0 && (
          <span className="tabular-nums">
            {Math.ceil(messageCount / 2)} {Math.ceil(messageCount / 2) === 1 ? 'analysis' : 'analyses'}
          </span>
        )}
        <div className="flex items-center gap-1.5">
          <div className={`
            w-1.5 h-1.5 rounded-full transition-colors
            ${isActive ? 'bg-accent animate-pulse-subtle' : status === 'error' ? 'bg-red-400' : 'bg-emerald-500/70'}
          `} />
          <span>
            {status === 'submitted' ? 'Thinking' :
             status === 'streaming' ? 'Streaming' :
             status === 'error' ? 'Error' : 'Ready'}
          </span>
        </div>
      </div>
    )
  }