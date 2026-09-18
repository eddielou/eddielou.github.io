import { getValidAccessToken } from './auth'

const BASE = 'https://api.spotify.com/v1'

class AuthExpiredError extends Error {}

async function spotifyFetch(path) {
  const token = await getValidAccessToken()
  if (!token) throw new AuthExpiredError('Not authenticated')

  const res = await fetch(`${BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (res.status === 401) throw new AuthExpiredError('Session expired')
  if (!res.ok) throw new Error(`Spotify API error ${res.status}`)
  return res.json()
}

export { AuthExpiredError }

export async function getTopTracks(timeRange, limit = 15) {
  const data = await spotifyFetch(
    `/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
  )
  return data.items
}

export async function getTopArtists(timeRange, limit = 30) {
  const data = await spotifyFetch(
    `/me/top/artists?time_range=${timeRange}&limit=${limit}`,
  )
  return data.items
}

// Spotify restricts this endpoint for newer API apps — fail soft so the
// rest of the app works with genre/popularity data alone.
export async function getAudioFeatures(trackIds) {
  if (!trackIds.length) return []
  try {
    const data = await spotifyFetch(`/audio-features?ids=${trackIds.join(',')}`)
    return (data.audio_features || []).filter(Boolean)
  } catch {
    return []
  }
}

// Spotify has no "play count" endpoint at all — this is the closest proxy:
// your last 50 played tracks, which is *not* scoped to the selected time
// range. Fails soft (e.g. missing scope on an older session) so the track
// list still renders without counts.
export async function getRecentlyPlayed(limit = 50) {
  try {
    const data = await spotifyFetch(`/me/player/recently-played?limit=${limit}`)
    return data.items || []
  } catch (err) {
    if (err instanceof AuthExpiredError) throw err
    return []
  }
}
