import { useState, useRef, useEffect } from 'react'
import { useAnalysis } from './hooks/useAnalysis'
import { PipelineView } from './components/PipelineView'
import { BriefView } from './components/BriefView'
import { ChatInput } from './components/Chatinput'
import { EmptyState } from './components/Emptystate'
import { RotateCcw } from 'lucide-react'

export default function App() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')
  const [question, setQuestion] = useState('')

  const {
    phase, agents, brief, streamText, error, searchEnabled,
    analyze, reset, isLoading,
  } = useAnalysis()

  // Auto-scroll as content arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [phase, agents, brief, streamText])

  const handleSend = (text: string) => {
    if (!text.trim() || isLoading) return
    setQuestion(text)
    setInput('')
    analyze(text)
  }

  const handleNewAnalysis = () => {
    reset()
    setQuestion('')
    setInput('')
  }

  const isActive = phase !== 'idle'

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="flex-none border-b border-surface-3 bg-surface-1 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-accent/10 border border-accent/20 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent-bright">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-sm font-medium text-zinc-100 tracking-tight">INFRABOT</h1>
          </div>

          <div className="flex items-center gap-3">
            {isActive && (
              <button
                onClick={handleNewAnalysis}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-surface-3 transition-colors"
              >
                <RotateCcw size={12} />
                New analysis
              </button>
            )}
            <div className="flex items-center gap-1.5 text-xs text-zinc-500">
              <div className={`w-1.5 h-1.5 rounded-full transition-colors ${
                isLoading ? 'bg-accent-bright animate-pulse' :
                phase === 'error' ? 'bg-red-400' :
                phase === 'done' ? 'bg-emerald-500' :
                'bg-zinc-600'
              }`} />
              {phase === 'idle' ? 'Ready' :
               phase === 'done' ? 'Complete' :
               phase === 'error' ? 'Error' :
               'Analyzing'}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">

          {/* Empty state */}
          {phase === 'idle' && (
            <EmptyState
              onSelect={handleSend}
              value={input}
              onChange={setInput}
              onSend={handleSend}
              disabled={isLoading}
            />
          )}

          {/* User question */}
          {question && (
            <div className="mb-5 animate-slide-up">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-surface-3 flex items-center justify-center flex-none mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-zinc-400">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-medium text-zinc-500 block mb-1">Your question</span>
                  <p className="text-sm text-zinc-300 leading-relaxed">{question}</p>
                </div>
              </div>
            </div>
          )}

          {/* Pipeline visualization */}
          {isActive && (
            <PipelineView phase={phase} agents={agents} searchEnabled={searchEnabled} />
          )}

          {/* Streaming text (executive summary as it arrives) */}
          {streamText && !brief && (
            <div className="mb-5 animate-fade-in">
              <div className="flex gap-3">
                <div className="w-6 h-6 rounded-md bg-accent/10 border border-accent/15 flex items-center justify-center flex-none mt-0.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-accent-bright">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs font-medium text-zinc-500 block mb-1">Synthesizing</span>
                  <p className="text-sm text-zinc-300 leading-relaxed">{streamText}</p>
                </div>
              </div>
            </div>
          )}

          {/* Structured brief */}
          {brief && (
            <BriefView brief={brief} />
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 rounded-md bg-red-500/8 border border-red-500/15 animate-fade-in">
              <p className="text-sm text-red-300 mb-2">Analysis failed</p>
              <p className="text-xs text-red-400/70">{error}</p>
              <button
                onClick={handleNewAnalysis}
                className="mt-3 text-xs text-red-300 hover:text-red-200 underline underline-offset-2"
              >
                Try again
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      {phase !== 'idle' && (
      <div className="flex-none border-t border-surface-3 bg-surface-1">
        <div className="max-w-3xl mx-auto px-4 py-3">
          {phase === 'done' ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleNewAnalysis}
                className="
                  flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md
                  bg-surface-2 border border-surface-4
                  hover:border-accent/35 hover:bg-surface-3
                  text-sm text-zinc-400 hover:text-zinc-200
                  transition-all
                "
              >
                <RotateCcw size={14} />
                Start new analysis
              </button>
            </div>
          ) : (
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={handleSend}
              disabled={isLoading}
            />
          )}
        </div>
      </div>
      )}
    </div>
  )
}