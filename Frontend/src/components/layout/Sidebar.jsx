import { NavLink } from 'react-router-dom'
import { MessageSquare, Upload, History } from 'lucide-react'
import Logo from './Logo.jsx'

const navItems = [
  { to: '/query', label: 'Query', Icon: MessageSquare },
  { to: '/upload', label: 'Upload', Icon: Upload },
  { to: '/history', label: 'History', Icon: History },
]

const Sidebar = () => {
  return (
    <aside className="w-60 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <Logo />
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {navItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => {
              const base =
                'px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2.5'
              return isActive
                ? `${base} bg-sidebar-accent text-sidebar-foreground`
                : `${base} text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50`
            }}
          >
            <Icon size={16} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar