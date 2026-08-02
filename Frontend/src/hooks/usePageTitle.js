import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const titleMap = {
  '/query': 'Query',
  '/upload': 'Upload',
  '/history': 'History',
}

const usePageTitle = () => {
  const location = useLocation()

  useEffect(() => {
    let suffix = titleMap[location.pathname]

    if (!suffix && location.pathname.startsWith('/history/')) {
      suffix = 'Conversation'
    }

    document.title = suffix ? `Advanced RAG — ${suffix}` : 'Advanced RAG'
  }, [location.pathname])
}

export default usePageTitle