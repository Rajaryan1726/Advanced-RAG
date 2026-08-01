import { MessageSquare, Sparkles } from 'lucide-react'

const QueryPage = () => {
  return (
    <div className="max-w-3xl mx-auto h-full flex flex-col">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Ask about your course
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Get grounded answers with exact lecture and timestamp references.
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center border border-border rounded-xl bg-card/50 py-20 px-6 text-center">
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

      <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 opacity-60">
        <Sparkles size={16} className="text-muted-foreground shrink-0" />
        <span className="text-sm text-muted-foreground">
          Ask a question about your lectures...
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Query functionality coming in a later build step.
      </p>
    </div>
  )
}

export default QueryPage