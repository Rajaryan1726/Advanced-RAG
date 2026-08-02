import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Sparkles, Send, User, Bot, Clock, ShieldCheck, Plus } from 'lucide-react'
import useQueryChat from '../hooks/useQuery.js'

const CITATION_REGEX = /\(Module\s+(\d+),\s*Lecture\s*'([^']+)',\s*([\d:.]+)-([\d:.]+)\)/g

const QueryPage = () => {
  const { messages, isLoading, error, sendQuery, startNewChat } = useQueryChat()
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendQuery(input)
    setInput('')
  }

  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            Ask about your course
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Get grounded answers with exact lecture and timestamp references.
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={startNewChat}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-secondary/50 transition-colors shrink-0"
          >
            <Plus size={14} />
            New chat
          </button>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex-1 flex flex-col border border-border rounded-xl bg-card/50 overflow-y-auto"
      >
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageSquare size={26} className="text-primary" />
            </div>
            <h2 className="text-base font-medium text-foreground mb-1">
              No conversation yet
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Ask a question about any uploaded lecture and get a cited answer
              with clickable timestamps.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-5">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive mt-2 text-center">{error}</p>
      )}

      <form
        onSubmit={handleSubmit}
        className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 focus-within:border-primary/50 transition-colors"
      >
        <Sparkles size={16} className="text-muted-foreground shrink-0" />
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about your lectures..."
          disabled={isLoading}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none py-2 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:brightness-110 transition-all shrink-0"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  )
}

const formatTimestamp = (raw) => {
  const parts = raw.split(':').map(Number)
  let totalSeconds
  if (parts.length === 3) {
    totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
  } else if (parts.length === 2) {
    totalSeconds = parts[0] * 60 + parts[1]
  } else {
    return raw
  }
  const mins = Math.floor(totalSeconds / 60)
  const secs = Math.floor(totalSeconds % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

const formatLectureTitle = (raw) => {
  return raw
    .replace(/^\d+_/, '')
    .replace(/_epm$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const renderAnswerWithCitations = (text) => {
  const parts = []
  let lastIndex = 0
  let match

  const regex = new RegExp(CITATION_REGEX)
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    parts.push({
      type: 'citation',
      module: match[1],
      lecture: formatLectureTitle(match[2]),
      start: formatTimestamp(match[3]),
      end: formatTimestamp(match[4]),
    })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }

  return parts
}

const ChatMessage = ({ message }) => {
  const isUser = message.role === 'user'
  const parts = !isUser ? renderAnswerWithCitations(message.content) : null

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? 'bg-secondary' : 'bg-primary/10'
        }`}
      >
        {isUser ? (
          <User size={15} className="text-secondary-foreground" />
        ) : (
          <Bot size={15} className="text-primary" />
        )}
      </div>

      <div className={`flex flex-col gap-2 max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-primary text-primary-foreground'
              : message.isError
              ? 'bg-destructive/10 text-destructive border border-destructive/30'
              : 'bg-secondary text-secondary-foreground'
          }`}
        >
          {isUser
            ? message.content
            : parts.map((part, i) =>
                part.type === 'citation' ? (
                  <span
                    key={i}
                    className="inline-flex items-baseline gap-1 mx-0.5 px-1.5 py-0.5 rounded bg-primary/15 text-primary text-xs font-medium align-baseline"
                  >
                    <Clock size={10} className="relative top-0.5" />
                    M{part.module} · {part.lecture} · {part.start}–{part.end}
                  </span>
                ) : (
                  <span key={i}>{part.content}</span>
                )
              )}
        </div>

        {!isUser && !message.isError && message.groundednessScore !== null && (
          <div
            className={`inline-flex items-center gap-1.5 text-xs font-medium ${
              message.groundednessScore >= 7
                ? 'text-green-500'
                : message.groundednessScore >= 4
                ? 'text-amber-500'
                : 'text-destructive'
            }`}
          >
            <ShieldCheck size={13} />
            Groundedness: {message.groundednessScore}/10
          </div>
        )}
      </div>
    </div>
  )
}

const TypingIndicator = () => (
  <div className="flex gap-3">
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <Bot size={15} className="text-primary" />
    </div>
    <div className="rounded-xl px-4 py-3 bg-secondary flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.3s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:-0.15s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" />
    </div>
  </div>
)

export default QueryPage