import { useState, useCallback } from 'react'
import useApi from './useApi.js'

const SESSION_STORAGE_KEY = 'advanced_rag_session_id'

const getOrCreateSessionId = () => {
  let sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId)
  }
  return sessionId
}

const useQueryChat = () => {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sessionId, setSessionId] = useState(getOrCreateSessionId)
  const api = useApi()

  const sendQuery = useCallback(
    async (queryText) => {
      if (!queryText.trim()) return

      const userMessage = { role: 'user', content: queryText, id: Date.now() }
      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)
      setError(null)

      try {
        const response = await api.post('/query', { query: queryText, sessionId })

        console.log('RAW query response:', response)

        const assistantMessage = {
          role: 'assistant',
          content: response.answer,
          groundednessScore: response.groundednessScore ?? null,
          id: Date.now() + 1,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } catch (err) {
        console.error('Query error:', err)
        setError(err.message || 'Failed to get a response')
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: 'Sorry, something went wrong while answering that.',
            isError: true,
            id: Date.now() + 1,
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [api, sessionId]
  )

  const startNewChat = useCallback(() => {
    const newSessionId = crypto.randomUUID()
    sessionStorage.setItem(SESSION_STORAGE_KEY, newSessionId)
    setSessionId(newSessionId)
    setMessages([])
    setError(null)
  }, [])

  return { messages, isLoading, error, sendQuery, startNewChat }
}

export default useQueryChat