import { History as HistoryIcon } from 'lucide-react'

const HistoryPage = () => {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          Query history
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review past questions and the answers you were given.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center border border-border rounded-xl bg-card/50 py-20 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <HistoryIcon size={26} className="text-primary" />
        </div>
        <h2 className="text-base font-medium text-foreground mb-1">
          Nothing here yet
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Once you start asking questions, your past queries and their
          answers will show up here.
        </p>
      </div>
    </div>
  )
}

export default HistoryPage