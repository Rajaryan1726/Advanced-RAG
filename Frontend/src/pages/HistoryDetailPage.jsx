import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, Loader2, User, Bot } from 'lucide-react'
import { useHistorySession } from '../hooks/useHistory.js'

const CITATION_REGEX = /\(Module\s+(\d+),\s*Lecture\s*'([^']+)',\s*([\d:.]+)-([\d:.]+)\)/g

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

const HistoryDetailPage = () => {
  const { id: sessionId } = useParams()
  const { messages, isLoading, error } = useHistorySession(sessionId)

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/history"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Back to history
      </Link>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="text-muted-foreground animate-spin" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {!isLoading && !error && messages.length > 0 && (
        <div className="flex flex-col gap-6">
          {messages.map((entry) => (
            <div key={entry._id} className="flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <User size={15} className="text-secondary-foreground" />
                </div>
                <div className="rounded-xl px-4 py-2.5 text-sm bg-primary text-primary-foreground max-w-[80%]">
                  {entry.query}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot size={15} className="text-primary" />
                </div>
                <div className="flex flex-col gap-2 max-w-[80%]">
                  <div className="rounded-xl px-4 py-2.5 text-sm leading-relaxed bg-secondary text-secondary-foreground">
                    {renderAnswerWithCitations(entry.response || '').map((part, i) =>
                      part.type === 'citation' ? (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.5 rounded bg-primary/15 text-primary text-xs font-medium"
                        >
                          M{part.module} · {part.lecture} · {part.start}–{part.end}
                        </span>
                      ) : (
                        <span key={i}>{part.content}</span>
                      )
                    )}
                  </div>

                  {entry.judgeScore != null && (
                    <div
                      className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                        entry.judgeScore >= 7
                          ? 'text-green-500'
                          : entry.judgeScore >= 4
                          ? 'text-amber-500'
                          : 'text-destructive'
                      }`}
                    >
                      <ShieldCheck size={13} />
                      Judge Score: {entry.judgeScore}/10
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default HistoryDetailPage