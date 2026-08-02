import { useState, useCallback } from 'react'
import useApi from './useApi.js'

const useQueryChat = () => {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  // Generates a fresh session on every page load/refresh (no persistence
  // in sessionStorage) — each browser session starts a new conversation
  const [sessionId, setSessionId] = useState(() => crypto.randomUUID())
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
    setSessionId(crypto.randomUUID())
    setMessages([])
    setError(null)
  }, [])

  return { messages, isLoading, error, sendQuery, startNewChat }
}

export default useQueryChat