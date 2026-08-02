import { Link } from 'react-router-dom'
import { History as HistoryIcon, ShieldCheck, ChevronRight, Loader2, MessageSquare } from 'lucide-react'
import { useHistoryList } from '../hooks/useHistory.js'

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const HistoryPage = () => {
  const { sessions, isLoading, error } = useHistoryList()

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Query history
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review past conversations and the answers you were given.
        </p>
      </div>

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

      {!isLoading && !error && sessions.length === 0 && (
        <div className="flex flex-col items-center justify-center border border-border rounded-xl bg-card/50 py-20 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <HistoryIcon size={26} className="text-primary" />
          </div>
          <h2 className="text-base font-medium text-foreground mb-1">
            Nothing here yet
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            Once you start asking questions, your past conversations will
            show up here.
          </p>
        </div>
      )}

      {!isLoading && !error && sessions.length > 0 && (
        <div className="border border-border rounded-xl bg-card overflow-hidden divide-y divide-border">
          {sessions.map((session) => (
            <Link
              key={session.sessionId}
              to={`/history/${session.sessionId}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-secondary/40 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{session.title}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(session.lastQueryAt)}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <MessageSquare size={11} />
                    {session.messageCount}
                  </span>
                  {session.latestJudgeScore != null && (
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium ${
                        session.latestJudgeScore >= 7
                          ? 'text-green-500'
                          : session.latestJudgeScore >= 4
                          ? 'text-amber-500'
                          : 'text-destructive'
                      }`}
                    >
                      <ShieldCheck size={11} />
                      {session.latestJudgeScore}/10
                    </span>
                  )}
                </div>
              </div>
              <ChevronRight size={18} className="text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default HistoryPage