import { getValidAccessToken, logout } from './auth'

const BASE = 'https://api.spotify.com/v1'
const CACHE_KEY = 'rt_spotify_saved_albums'
const CACHE_MS = 24 * 60 * 60 * 1000

export class AuthExpiredError extends Error {}

async function get(url) {
  const token = await getValidAccessToken()
  if (!token) throw new AuthExpiredError('Not authenticated')
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (res.status === 401) throw new AuthExpiredError('Session expired')
  if (res.status === 429) {
    const wait = Number(res.headers.get('Retry-After') || 2) * 1000
    await new Promise((r) => setTimeout(r, wait))
    return get(url)
  }
  if (!res.ok) throw new Error(`Spotify API error ${res.status}`)
  return res.json()
}

// Lowercase, strip accents, and drop everything but letters/digits.
export const norm = (s) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, '')

// "Album (Deluxe Edition)" / "Album - Remastered 2009" -> "album"
const baseAlbum = (s) =>
  norm(s.replace(/\s*[([].*?[)\]]/g, '').replace(/\s+-\s+.*$/, ''))

const albumKeys = (name) => [...new Set([norm(name), baseAlbum(name)])]

// Walks every page of saved tracks and saved albums. Returns compact
// {artists: [normalised], albums: [normalised keys]} records, one per album.
async function fetchAll(onProgress) {
  const seen = new Map()
  const add = (album) => {
    if (!album?.name) return
    const id = album.id ?? album.name
    if (seen.has(id)) return
    seen.set(id, {
      artists: (album.artists ?? []).map((a) => norm(a.name)),
      albums: albumKeys(album.name),
    })
  }

  let url = `${BASE}/me/albums?limit=50`
  while (url) {
    const page = await get(url)
    page.items.forEach((i) => add(i.album))
    url = page.next
  }

  url = `${BASE}/me/tracks?limit=50`
  let done = 0
  while (url) {
    const page = await get(url)
    page.items.forEach((i) => add(i.track?.album))
    done += page.items.length
    onProgress?.(done, page.total)
    url = page.next
  }
  return [...seen.values()]
}

export async function loadSavedAlbums({ onProgress, force = false } = {}) {
  if (!force) {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY))
      if (cached && Date.now() - cached.at < CACHE_MS) return cached.albums
    } catch {
      /* ignore bad cache */
    }
  }
  const albums = await fetchAll(onProgress)
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), albums }))
  } catch {
    /* storage unavailable */
  }
  return albums
}

export function clearSpotify() {
  logout()
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    /* storage unavailable */
  }
}

// Does the library contain a saved song/album matching "Artist — Album"?
export function isSaved(cardText, savedAlbums) {
  const [artist, ...rest] = cardText.split(' — ')
  const album = rest.join(' — ')
  if (!album) return false
  const a = norm(artist)
  const keys = albumKeys(album)
  return savedAlbums.some(
    (s) =>
      s.albums.some((k) => keys.includes(k)) &&
      s.artists.some((x) => x === a || x.includes(a) || a.includes(x)),
  )
}
