// Thin React hook that binds Clerk's getToken to the apiClient functions,
// so components don't need to pass getToken manually every call.
// - Import { useAuth } from '@clerk/clerk-react'
// - Import { apiGet, apiPost, apiPostForm } from '../lib/apiClient.js'
// - Inside the hook: const { getToken } = useAuth()
// - Return an object with three functions that close over getToken:
//     get: (path) => apiGet(path, getToken)
//     post: (path, body) => apiPost(path, body, getToken)
//     postForm: (path, formData) => apiPostForm(path, formData, getToken)
// - Default export function useApi()
// - This is the hook components will actually call, e.g.:
//     const api = useApi()
//     const data = await api.get('/history')

import { useMemo } from 'react'
import { useAuth } from '@clerk/clerk-react'
import { apiGet, apiPost, apiPostForm } from '../lib/apiClient.js'

export default function useApi() {
  const { getToken } = useAuth()

  return useMemo(
    () => ({
      get: (path) => apiGet(path, getToken),
      post: (path, body) => apiPost(path, body, getToken),
      postForm: (path, formData) => apiPostForm(path, formData, getToken),
    }),
    [getToken]
  )
}

