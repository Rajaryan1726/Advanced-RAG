// Central fetch wrapper for all backend API calls.
// - Base URL is read directly: import.meta.env.VITE_API_BASE_URL
//   (matches the pattern used in main.jsx — direct env read, no wrapper file)
// - Export an async function `apiRequest(path, options = {}, getToken)`
//   where getToken is a function passed in by the caller (from Clerk's
//   useAuth().getToken) — this file itself has NO React hooks, it's a
//   plain utility, so the token must be passed in rather than fetched here
// - Inside apiRequest:
//   1. const token = await getToken()
//   2. Build headers: { 'Content-Type': 'application/json', ...options.headers }
//      and if token exists, add Authorization: `Bearer ${token}`
//      (skip Content-Type header entirely if options.body is FormData —
//      browser needs to set its own multipart boundary, this matters for
//      Module 4's file upload calls)
//   3. Fetch `${API_BASE_URL}${path}` with { ...options, headers }
//   4. If response is not ok (response.ok === false):
//      - try to parse response JSON for an error message field
//      - throw an Error with that message, or a fallback like
//        `Request failed: ${response.status}`
//   5. If response ok, return response.json() (assume all backend
//      responses are JSON — matches ingest/query/history route patterns)
// - Also export convenience methods that wrap apiRequest:
//     apiGet(path, getToken)
//     apiPost(path, body, getToken)  -> JSON.stringify(body) as options.body
//     apiPostForm(path, formData, getToken) -> formData directly as body,
//       no Content-Type header (for Module 4 file uploads)
// - No error toast/UI logic here — this is a pure data layer, callers
//   handle displaying errors


const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

async function apiRequest(path, options = {}, getToken) {
  const token = await getToken()

  const headers = {
    ...options.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // If options.body is FormData, skip setting Content-Type header
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    let errorMessage = `Request failed: ${response.status}`

    try {
      const errorData = await response.json()
      if (errorData && errorData.message) {
        errorMessage = errorData.message
      }
    } catch (e) {
      // If response is not JSON, keep the default error message
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

export function apiGet(path, getToken) {
  return apiRequest(path, { method: 'GET' }, getToken)
}

export function apiPost(path, body, getToken) {
  return apiRequest(
    path,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
    getToken
  )
}

export function apiPostForm(path, formData, getToken) {
  return apiRequest(
    path,
    {
      method: 'POST',
      body: formData,
    },
    getToken
  )
}