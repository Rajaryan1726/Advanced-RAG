import { Routes, Route } from 'react-router-dom'
import UploadPage from './pages/UploadPage.jsx'
import QueryPage from './pages/QueryPage.jsx'
import HistoryPage from './pages/HistoryPage.jsx'
import HistoryDetailPage from './pages/HistoryDetailPage.jsx'
import SignInPage from './pages/SignInPage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import AppShell from './components/layout/AppShell.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'

const App = () => {
  return (
    <Routes>
      <Route path="/sign-in" element={<SignInPage />} />
      <Route path="/sign-up" element={<SignUpPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<AppShell />}>
          <Route index element={<QueryPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="query" element={<QueryPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="history/:id" element={<HistoryDetailPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App