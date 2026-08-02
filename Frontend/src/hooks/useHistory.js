import { useState, useCallback, useEffect } from 'react'
import useApi from './useApi.js'

export const useHistoryList = () => {
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const api = useApi()

  const fetchHistory = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get('/history')
      console.log('RAW history list response:', response)
      setSessions(response.sessions || [])
    } catch (err) {
      console.error('History fetch error:', err)
      setError(err.message || 'Failed to load history')
    } finally {
      setIsLoading(false)
    }
  }, [api])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return { sessions, isLoading, error, refetch: fetchHistory }
}

export const useHistorySession = (sessionId) => {
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const api = useApi()

  useEffect(() => {
    if (!sessionId) return
    setIsLoading(true)
    setError(null)
    api
      .get(`/history/session/${sessionId}`)
      .then((response) => {
        console.log('RAW history session response:', response)
        setMessages(response.messages || [])
      })
      .catch((err) => {
        console.error('History session fetch error:', err)
        setError(err.message || 'Failed to load this conversation')
      })
      .finally(() => setIsLoading(false))
  }, [sessionId, api])

  return { messages, isLoading, error }
}