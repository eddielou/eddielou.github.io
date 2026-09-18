const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID
const SCOPES = 'user-top-read user-read-recently-played'

const STORAGE_KEYS = {
  verifier: 'spotify_code_verifier',
  state: 'spotify_auth_state',
  accessToken: 'spotify_access_token',
  refreshToken: 'spotify_refresh_token',
  expiresAt: 'spotify_token_expires_at',
}

function redirectUri() {
  return window.location.origin + window.location.pathname
}

function randomString(length) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const values = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(values, (v) => chars[v % chars.length]).join('')
}

async function sha256Base64Url(plain) {
  const data = new TextEncoder().encode(plain)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export function isConfigured() {
  return Boolean(CLIENT_ID)
}

export async function beginLogin() {
  const verifier = randomString(64)
  const state = randomString(16)
  const challenge = await sha256Base64Url(verifier)

  sessionStorage.setItem(STORAGE_KEYS.verifier, verifier)
  sessionStorage.setItem(STORAGE_KEYS.state, state)

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri(),
    scope: SCOPES,
    state,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  })

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`
}

function storeTokens(data) {
  localStorage.setItem(STORAGE_KEYS.accessToken, data.access_token)
  localStorage.setItem(
    STORAGE_KEYS.expiresAt,
    String(Date.now() + data.expires_in * 1000),
  )
  if (data.refresh_token) {
    localStorage.setItem(STORAGE_KEYS.refreshToken, data.refresh_token)
  }
}

async function requestToken(body) {
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) return null
  return res.json()
}

// Consumes ?code=&state= from the current URL after the Spotify redirect,
// exchanges it for tokens, and strips the params from the address bar.
export async function completeLoginIfRedirected() {
  const url = new URL(window.location.href)
  const code = url.searchParams.get('code')
  const returnedState = url.searchParams.get('state')
  const errorParam = url.searchParams.get('error')

  if (!code && !errorParam) return { status: 'none' }

  url.searchParams.delete('code')
  url.searchParams.delete('state')
  url.searchParams.delete('error')
  window.history.replaceState({}, '', url.toString())

  if (errorParam) return { status: 'error', error: errorParam }

  const expectedState = sessionStorage.getItem(STORAGE_KEYS.state)
  const verifier = sessionStorage.getItem(STORAGE_KEYS.verifier)
  sessionStorage.removeItem(STORAGE_KEYS.state)
  sessionStorage.removeItem(STORAGE_KEYS.verifier)

  if (!verifier || returnedState !== expectedState) {
    return { status: 'error', error: 'state_mismatch' }
  }

  const data = await requestToken(
    new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri(),
      code_verifier: verifier,
    }),
  )

  if (!data) return { status: 'error', error: 'token_exchange_failed' }

  storeTokens(data)
  return { status: 'success' }
}

async function refreshAccessToken() {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.refreshToken)
  if (!refreshToken) return null

  const data = await requestToken(
    new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  )

  if (!data) {
    logout()
    return null
  }

  storeTokens(data)
  return data.access_token
}

export async function getValidAccessToken() {
  const token = localStorage.getItem(STORAGE_KEYS.accessToken)
  const expiresAt = Number(localStorage.getItem(STORAGE_KEYS.expiresAt) || 0)

  if (token && Date.now() < expiresAt - 60_000) return token
  if (!localStorage.getItem(STORAGE_KEYS.refreshToken)) return null

  return refreshAccessToken()
}

export function isLoggedIn() {
  return Boolean(
    localStorage.getItem(STORAGE_KEYS.accessToken) &&
      localStorage.getItem(STORAGE_KEYS.refreshToken),
  )
}

export function logout() {
  Object.values(STORAGE_KEYS).forEach((key) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  })
}
