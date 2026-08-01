const Logo = ({ size = 'md' }) => {
  const isLarge = size === 'lg'
  const iconSize = isLarge ? 28 : 20
  const textClass = isLarge ? 'text-lg' : 'text-sm'

  return (
    <div className="flex items-center gap-2.5">
      <svg width={iconSize} height={iconSize} viewBox="0 0 20 20" fill="none">
        <rect x="1" y="7" width="3" height="6" rx="1" fill="var(--primary)" />
        <rect x="6" y="3" width="3" height="14" rx="1" fill="var(--primary)" />
        <rect x="11" y="9" width="3" height="4" rx="1" fill="var(--primary)" />
        <rect x="16" y="5" width="3" height="10" rx="1" fill="var(--primary)" />
      </svg>
      <span className={`font-heading font-semibold ${textClass} tracking-tight text-foreground`}>
        Advanced RAG
      </span>
    </div>
  )
}

export default Logo