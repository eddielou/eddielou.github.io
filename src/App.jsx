import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import {
  beginLogin,
  completeLoginIfRedirected,
  isConfigured,
  isLoggedIn,
  logout,
} from './spotify/auth'
import {
  AuthExpiredError,
  getAudioFeatures,
  getRecentlyPlayed,
  getTopArtists,
  getTopTracks,
} from './spotify/api'
import { buildPersonality } from './lib/personality'
import TrackList from './components/TrackList'
import PersonalityCard from './components/PersonalityCard'
import GenreBreakdown from './components/GenreBreakdown'
import MoodGraph from './components/MoodGraph'

const TIME_RANGES = [
  { value: 'short_term', label: 'Last 4 weeks' },
  { value: 'medium_term', label: 'Last 6 months' },
  { value: 'long_term', label: 'All time' },
]

function App() {
  const [authState, setAuthState] = useState('checking') // checking | signedOut | signedIn
  const [timeRange, setTimeRange] = useState('short_term')
  const [data, setData] = useState(null) // { tracks, artists, audioFeatures, personality }
  const [loadError, setLoadError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const cardRef = useRef(null)

  useEffect(() => {
    completeLoginIfRedirected().then((result) => {
      if (result.status === 'error') {
        setLoadError('Spotify sign-in failed. Please try again.')
      }
      setAuthState(isLoggedIn() ? 'signedIn' : 'signedOut')
    })
  }, [])

  const loadData = useCallback(async (range) => {
    setLoading(true)
    setLoadError(null)
    try {
      const [tracks, artists, recentlyPlayed] = await Promise.all([
        getTopTracks(range, 15),
        getTopArtists(range, 30),
        getRecentlyPlayed(50),
      ])
      const audioFeatures = await getAudioFeatures(tracks.map((t) => t.id))
      const personality = buildPersonality({ tracks, artists, audioFeatures })
      const recentPlayCounts = {}
      recentlyPlayed.forEach((item) => {
        const id = item.track?.id
        if (id) recentPlayCounts[id] = (recentPlayCounts[id] || 0) + 1
      })
      setData({ tracks, artists, audioFeatures, personality, recentPlayCounts })
    } catch (err) {
      if (err instanceof AuthExpiredError) {
        logout()
        setAuthState('signedOut')
        setData(null)
      } else {
        setLoadError('Could not load your Spotify data. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authState === 'signedIn') loadData(timeRange)
  }, [authState, timeRange, loadData])

  const handleShare = async () => {
    if (!cardRef.current) return
    setSharing(true)
    try {
      const { toPng } = await import('html-to-image')
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 })
      const link = document.createElement('a')
      link.download = 'music-personality.png'
      link.href = dataUrl
      link.click()
    } catch {
      setLoadError('Could not generate a shareable image.')
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <h1 className="brand" tabIndex={0}>
          Music Personality
        </h1>
        <p className="tagline">
          Connect Spotify to see what your listening habits say about you.
        </p>
      </header>

      <main className="content">
        {!isConfigured() && (
          <p className="notice">
            Spotify isn't configured yet — set <code>VITE_SPOTIFY_CLIENT_ID</code>.
          </p>
        )}

        {isConfigured() && authState === 'signedOut' && (
          <div className="connect">
            <button type="button" className="btn-primary" onClick={beginLogin}>
              Connect Spotify
            </button>
            {import.meta.env.DEV && window.location.hostname === 'localhost' && (
              <p className="notice notice-small">
                Spotify's login requires <code>127.0.0.1</code>, not{' '}
                <code>localhost</code>.{' '}
                <a
                  className="link"
                  href={`http://127.0.0.1:${window.location.port}${window.location.pathname}`}
                >
                  Open this page via 127.0.0.1 →
                </a>
              </p>
            )}
          </div>
        )}

        {authState === 'signedIn' && (
          <>
            <div className="toolbar">
              <div className="range-toggle" role="group" aria-label="Time range">
                {TIME_RANGES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    className={r.value === timeRange ? 'range-btn is-active' : 'range-btn'}
                    onClick={() => setTimeRange(r.value)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  logout()
                  setAuthState('signedOut')
                  setData(null)
                }}
              >
                Disconnect
              </button>
            </div>

            {loadError && <p className="notice notice-error">{loadError}</p>}
            {loading && <p className="notice">Loading your top tracks…</p>}

            {!loading && data && (
              <div className="layout">
                <section className="panel">
                  <h3 className="panel-title">Top 15 songs</h3>
                  <TrackList tracks={data.tracks} recentPlayCounts={data.recentPlayCounts} />
                  <p className="notice notice-small track-list-footnote">
                    Play counts are from your last 50 plays on Spotify, not the
                    "{TIME_RANGES.find((r) => r.value === timeRange).label}" window above —
                    Spotify's API doesn't expose real per-range play counts.
                  </p>
                </section>

                <section className="panel panel-right">
                  <PersonalityCard
                    ref={cardRef}
                    personality={data.personality}
                    timeRangeLabel={TIME_RANGES.find((r) => r.value === timeRange).label}
                  />
                  <button
                    type="button"
                    className="btn-primary btn-share"
                    onClick={handleShare}
                    disabled={sharing}
                  >
                    {sharing ? 'Generating…' : 'Download shareable card'}
                  </button>

                  <GenreBreakdown genres={data.personality.stats.topGenres} />

                  {data.audioFeatures.length > 0 ? (
                    <MoodGraph tracks={data.tracks} audioFeatures={data.audioFeatures} />
                  ) : (
                    <p className="notice notice-small">
                      Mood map unavailable — Spotify restricts audio-feature
                      data for newer developer apps.
                    </p>
                  )}
                </section>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}

export default App
