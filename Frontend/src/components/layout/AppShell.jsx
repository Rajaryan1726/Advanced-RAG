// - Import { Outlet } from 'react-router-dom'
// - Import Sidebar from './Sidebar.jsx'
// - Import Topbar from './Topbar.jsx'
// - Render a flex layout: Topbar on top (full width), then below it a flex
//   row containing Sidebar (fixed width, e.g. w-64) on the left and
//   <Outlet /> (flex-1, p-6) on the right for the active page content
// - Root wrapper div: min-h-screen flex flex-col
// - No data fetching, no auth logic here — pure layout composition
// - Default export function AppShell()

import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import usePageTitle from '../../hooks/usePageTitle.js'

const AppShell = () => {
  usePageTitle()
  const location = useLocation()

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
          <div key={location.pathname} className="animate-page-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default AppShell