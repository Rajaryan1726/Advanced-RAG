import { useLocation } from 'react-router-dom'

const pageTitles = {
  '/query': 'Query',
  '/upload': 'Upload',
  '/history': 'History',
}

const Topbar = () => {
  const location = useLocation()
  const title = pageTitles[location.pathname] || 'Workspace'

  return (
    <header className="h-14 bg-background border-b border-border flex items-center justify-between px-6">
      <span className="text-sm text-muted-foreground">{title}</span>
      <div className="w-7 h-7 rounded-full bg-secondary border border-border" />
      {/* Clerk UserButton replaces the circle above — Module 2 */}
    </header>
  )
}

export default Topbar