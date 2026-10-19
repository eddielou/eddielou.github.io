import { useCallback, useEffect, useState } from 'react'
import { START_ELO, updateElo } from './elo'
import { COLLECTIONS, storageKey } from './collections'
import {
  answer,
  choicesLeft,
  currentPair,
  isDone,
  removeFromSession,
  startSession,
  totalChoices,
} from './sortSession'
import Settings from './Settings'
import {
  beginLogin,
  completeLoginIfRedirected,
  isConfigured,
  isLoggedIn,
} from './spotify/auth'
import {
  AuthExpiredError,
  clearSpotify,
  isSaved,
  loadSavedAlbums,
} from './spotify/library'
import { applyFont, applyTheme, loadFont, loadTheme } from './themes'
import './App.css'

const defaultCards = (key, items) =>
  (items ?? []).map((item, i) => ({
    id: `${key}:${item.idx ?? i}`,
    text: item.text,
    img: item.img,
    elo: START_ELO,
    games: 0,
    wins: 0,
    losses: 0,
  }))

function loadCards(key, items) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key))
    if (Array.isArray(parsed)) {
      // Premade cards keep their saved ratings, but take text and artwork
      // from the current data (saved cards may predate or differ from it).
      const fresh = new Map(defaultCards(key, items).map((c) => [c.id, c]))
      return parsed.map((c) => ({
        ...c,
        text: fresh.get(c.id)?.text ?? c.text,
        img: fresh.get(c.id)?.img ?? c.img,
        wins: c.wins ?? 0,
        losses: c.losses ?? 0,
      }))
    }
  } catch {
    /* fall through to defaults */
  }
  return defaultCards(key, items)
}

const HISTORY_CAP = 500

// Names of cards the user deleted, for the export's "removed" section.
function loadRemoved(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(`${key}:removed`))
    if (Array.isArray(parsed)) return parsed
  } catch {
    /* fall through */
  }
  return []
}

function loadHistory(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(`${key}:history`))
    if (Array.isArray(parsed)) return parsed
  } catch {
    /* fall through to empty */
  }
  return []
}

const record = (c) => `${c.wins ?? 0}W-${c.losses ?? 0}L`

function CardArt({ src, premade }) {
  if (src) return <img className="art" src={src} alt="" />
  return premade ? <div className="art blank">?</div> : null
}

export default function App() {
  const [collectionId, setCollectionId] = useState(
    () => localStorage.getItem('elo-ranker-collection') ?? 'custom',
  )
  const collection =
    COLLECTIONS.find((c) => c.id === collectionId) ?? COLLECTIONS[0]
  const [sizes, setSizes] = useState({})
  const size = sizes[collection.id] ?? collection.sizes?.[0]
  const filterable = collection.id === 'pitchfork'
  const [onlySaved, setOnlySaved] = useState(
    () => localStorage.getItem('rank-things-only-saved') === '1',
  )
  const filtering = filterable && onlySaved
  const key = storageKey(collection, size) + (filtering ? ':saved' : '')

  const [loggedIn, setLoggedIn] = useState(isLoggedIn)
  const [saved, setSaved] = useState(null) // normalised saved albums
  const [loadState, setLoadState] = useState({ busy: false, done: 0, total: 0, error: null })

  // Finish a Spotify redirect (?code=...) if we just came back from one.
  useEffect(() => {
    completeLoginIfRedirected().then((r) => {
      if (r.status === 'success') setLoggedIn(true)
      else if (r.status === 'error')
        setLoadState((l) => ({ ...l, error: 'Spotify sign-in failed.' }))
    })
  }, [])

  const refreshSaved = useCallback((force = false) => {
    setLoadState({ busy: true, done: 0, total: 0, error: null })
    loadSavedAlbums({
      force,
      onProgress: (done, total) =>
        setLoadState((l) => ({ ...l, done, total })),
    })
      .then((albums) => {
        setSaved(albums)
        setLoadState({ busy: false, done: 0, total: 0, error: null })
      })
      .catch((err) => {
        if (err instanceof AuthExpiredError) {
          clearSpotify()
          setLoggedIn(false)
        }
        setLoadState({
          busy: false,
          done: 0,
          total: 0,
          error: 'Could not load your Spotify library.',
        })
      })
  }, [])

  useEffect(() => {
    if (filtering && loggedIn && saved === null && !loadState.busy && !loadState.error)
      refreshSaved()
  }, [filtering, loggedIn, saved, loadState, refreshSaved])

  const toggleSaved = () => {
    const next = !onlySaved
    setOnlySaved(next)
    try {
      localStorage.setItem('rank-things-only-saved', next ? '1' : '0')
    } catch {
      /* storage unavailable */
    }
  }

  const disconnect = () => {
    clearSpotify()
    setLoggedIn(false)
    setSaved(null)
  }

  // Top N of the list first, then keep only albums the user has saved.
  const items = (() => {
    const top = collection.items?.slice(0, size)
    if (!filtering || !saved) return top
    return top
      .map((it, idx) => ({ ...it, idx }))
      .filter((it) => isSaved(it.text, saved))
  })()
  const awaitingLibrary = filtering && !(loggedIn && saved)

  const pick = (id) => {
    setCollectionId(id)
    try {
      localStorage.setItem('elo-ranker-collection', id)
    } catch {
      /* storage unavailable */
    }
  }

  const [theme, setTheme] = useState(loadTheme)
  const changeTheme = (id) => {
    setTheme(id)
    applyTheme(id)
  }

  const [font, setFont] = useState(loadFont)
  const changeFont = (id) => {
    setFont(id)
    applyFont(id)
  }

  return (
    <div className="app">
      <Settings
        theme={theme}
        onTheme={changeTheme}
        font={font}
        onFont={changeFont}
        spotify={{
          configured: isConfigured(),
          loggedIn,
          onConnect: beginLogin,
          onDisconnect: disconnect,
        }}
      />
      <header>
        <h1>RANK THINGS</h1>
        <p>&gt; make cards. pick winners. see the ranking_</p>
        <nav className="picker">
          {COLLECTIONS.map((c) => (
            <button
              key={c.id}
              className={`btn tab${c.id === collection.id ? ' on' : ''}`}
              onClick={() => pick(c.id)}
            >
              {c.label}
            </button>
          ))}
          {collection.sizes && (
            <span className="sizes">
              {collection.sizes.map((n) => (
                <button
                  key={n}
                  className={`btn tab${n === size ? ' on' : ''}`}
                  onClick={() => setSizes((s) => ({ ...s, [collection.id]: n }))}
                >
                  Top {n}
                </button>
              ))}
            </span>
          )}
          {filterable && (
            <button
              className={`btn tab${onlySaved ? ' on' : ''}`}
              onClick={toggleSaved}
              title="Only show albums you have saved songs from on Spotify"
            >
              Only my saved
            </button>
          )}
        </nav>
        {collection.note && <p className="note">* {collection.note}</p>}
        {filtering && saved && (
          <p className="note">
            * Showing {items.length} of the top {size} albums you have saved
            songs from on Spotify.{' '}
            <button className="link" onClick={() => refreshSaved(true)}>
              Refresh library
            </button>
          </p>
        )}
      </header>
      {awaitingLibrary ? (
        <section className="stage spotify-gate">
          {loadState.busy ? (
            <p>
              Reading your Spotify library...{' '}
              {loadState.total > 0 &&
                `${loadState.done}/${loadState.total} saved songs`}
            </p>
          ) : !isConfigured() ? (
            <p>
              Spotify isn&apos;t configured. Set <code>VITE_SPOTIFY_CLIENT_ID</code>.
            </p>
          ) : !loggedIn ? (
            <>
              <p>Connect Spotify to see only albums you have saved songs from.</p>
              {loadState.error && <p className="err">{loadState.error}</p>}
              <button className="btn primary" onClick={beginLogin}>
                Connect Spotify
              </button>
            </>
          ) : (
            <>
              <p className="err">{loadState.error}</p>
              <button className="btn" onClick={() => refreshSaved(true)}>
                Try again
              </button>
            </>
          )}
        </section>
      ) : (
        <Ranker
          key={key}
          storageKey={key}
          items={items}
          editable={!collection.sizes}
        />
      )}
    </div>
  )
}

function Ranker({ storageKey: key, items, editable }) {
  const [cards, setCards] = useState(() => loadCards(key, items))
  const [text, setText] = useState('')
  const [bulk, setBulk] = useState(null) // null = closed, string = textarea contents
  const [session, setSession] = useState(null)
  const [history, setHistory] = useState(() => loadHistory(key))
  const [removed, setRemoved] = useState(() => loadRemoved(key))
  const [showHistory, setShowHistory] = useState(false)
  // Loser of the latest choice, when that was its first loss.
  const [firstLoss, setFirstLoss] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(cards))
    } catch {
      /* storage unavailable */
    }
  }, [cards, key])

  useEffect(() => {
    try {
      localStorage.setItem(`${key}:history`, JSON.stringify(history))
    } catch {
      /* storage unavailable */
    }
  }, [history, key])

  useEffect(() => {
    try {
      localStorage.setItem(`${key}:removed`, JSON.stringify(removed))
    } catch {
      /* storage unavailable */
    }
  }, [removed, key])

  const addCard = (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    setCards((cs) => [
      ...cs,
      { id: crypto.randomUUID(), text: t, elo: START_ELO, games: 0, wins: 0, losses: 0 },
    ])
    setText('')
  }

  const addBulk = (e) => {
    e.preventDefault()
    const lines = bulk
      .split('\n')
      .map((l) => l.trim().slice(0, 120))
      .filter(Boolean)
    if (!lines.length) return
    setCards((cs) => [
      ...cs,
      ...lines.map((t) => ({
        id: crypto.randomUUID(),
        text: t,
        elo: START_ELO,
        games: 0,
        wins: 0,
        losses: 0,
      })),
    ])
    setBulk(null)
  }

  const noteRemoved = (...texts) => setRemoved((r) => [...r, ...texts])

  const removeCard = (id) => {
    const card = cards.find((c) => c.id === id)
    if (card) noteRemoved(card.text)
    setCards((cs) => cs.filter((c) => c.id !== id))
  }

  // Removing a first-time loser from the banner also undoes that matchup:
  // the winner gets its previous rating/record back and the history entry goes.
  const removeFirstLoser = useCallback(() => {
    const { id, winner, text } = firstLoss
    noteRemoved(text)
    setCards((cs) =>
      cs.filter((c) => c.id !== id).map((c) => (c.id === winner.id ? winner : c)),
    )
    setHistory((h) => h.slice(1))
    setFirstLoss(null)
    setSession((s) => (cards.length - 1 < 2 ? null : removeFromSession(s, id)))
  }, [cards.length, firstLoss])

  // Delete cards mid-ranking (one via ×, or both of the pair via ↑).
  const removeDuelCards = useCallback(
    (ids) => {
      setFirstLoss(null)
      noteRemoved(...cards.filter((c) => ids.includes(c.id)).map((c) => c.text))
      const next = cards.filter((c) => !ids.includes(c.id))
      setCards(next)
      setSession((s) =>
        next.length < 2 ? null : ids.reduce(removeFromSession, s),
      )
    },
    [cards],
  )
  const removeDuelCard = (id) => removeDuelCards([id])

  const startRanking = () => setSession(startSession(cards.map((c) => c.id)))

  const ranking = session !== null
  const finished = ranking && isDone(session)
  const pair = ranking && !finished ? currentPair(session) : null

  const choose = useCallback(
    (side) => {
      if (!pair) return
      const winnerId = pair[side]
      const loserId = pair[1 - side]
      const winner = cards.find((c) => c.id === winnerId)
      const loser = cards.find((c) => c.id === loserId)
      const [w, l] = updateElo(winner.elo, loser.elo)
      setCards(
        cards.map((c) =>
          c.id === winnerId
            ? { ...c, elo: w, games: c.games + 1, wins: c.wins + 1 }
            : c.id === loserId
              ? { ...c, elo: l, games: c.games + 1, losses: c.losses + 1 }
              : c,
        ),
      )
      setHistory((h) =>
        [
          { win: winner.text, lose: loser.text, delta: w - winner.elo },
          ...h,
        ].slice(0, HISTORY_CAP),
      )
      setFirstLoss(
        (loser.losses ?? 0) === 0 && (loser.wins ?? 0) === 0
          ? { id: loser.id, text: loser.text, winner }
          : null,
      )
      setSession(answer(session, winnerId))
    },
    [cards, pair, session],
  )

  useEffect(() => {
    if (!ranking) return
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') choose(0)
      else if (e.key === 'ArrowRight') choose(1)
      else if (e.key === 'ArrowUp' && pair) {
        e.preventDefault()
        removeDuelCards(pair)
      }
      else if (e.key === 'Escape') setSession(null)
      else if ((e.key === 'r' || e.key === 'R') && firstLoss)
        removeFirstLoser()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ranking, choose, firstLoss, removeFirstLoser, pair, removeDuelCards])

  // Custom: keep the user's cards, zero their ratings. Premade: restore the
  // full original list at 1000.
  // While ranking, it restarts the session on the fresh cards.
  const reset = () => {
    const what = editable ? 'all ratings' : 'all cards and ratings'
    if (!window.confirm(`Reset ${what}? This cannot be undone.`)) return
    const next = editable
      ? cards.map((c) => ({ ...c, elo: START_ELO, games: 0, wins: 0, losses: 0 }))
      : defaultCards(key, items)
    setCards(next)
    setHistory([])
    if (!editable) setRemoved([])
    setFirstLoss(null)
    setSession(
      ranking && next.length >= 2 ? startSession(next.map((c) => c.id)) : null,
    )
  }

  const sorted = [...cards].sort((a, b) => b.elo - a.elo)

  const exportRanking = async () => {
    const csv = (t) => (/[",\n]/.test(t) ? `"${t.replaceAll('"', '""')}"` : t)
    const lines = ['#, Card Name, Elo, W/L']
    sorted.forEach((c, i) =>
      lines.push(
        `${i + 1}, ${csv(c.text)}, ${Math.round(c.elo)}, ${c.wins ?? 0}/${c.losses ?? 0}`,
      ),
    )
    if (removed.length) {
      lines.push('', 'Removed (unranked)', ...removed.map(csv))
    }
    const blob = new Blob([lines.join('\n') + '\n'], { type: 'text/plain' })
    const name = `rank-things-${key.replace(/[^a-z0-9]+/gi, '-')}.txt`
    try {
      // Native save dialog where supported.
      const handle = await window.showSaveFilePicker({
        suggestedName: name,
        types: [{ description: 'Text file', accept: { 'text/plain': ['.txt'] } }],
      })
      const w = await handle.createWritable()
      await w.write(blob)
      await w.close()
    } catch (err) {
      if (err?.name === 'AbortError') return
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = name
      a.click()
      URL.revokeObjectURL(a.href)
    }
  }
  const byId = new Map(cards.map((c) => [c.id, c]))
  const duel = pair ? pair.map((id) => byId.get(id)) : null

  return (
    <main>
      <section className="stage">
        {ranking ? (
          <>
            <p className="progress">
              {finished
                ? 'Ranking complete.'
                : `Choices left: up to ${choicesLeft(session)}`}
            </p>
            {!finished && (
              <p className="keys">
                Click a card or press the Left / Right arrow key to pick the winner. Up arrow discards both.
              </p>
            )}
            {firstLoss && !finished && (
              <p className="first-loss">
                <span>
                  {firstLoss.text} just lost for the first time. Remove it?
                </span>
                <button
                  className="btn"
                  onClick={removeFirstLoser}
                >
                  Remove (R)
                </button>
              </p>
            )}
            {duel && (
              <div className="duel">
                {duel.map((c, side) => (
                  <div className="duel-wrap" key={c.id}>
                    <button
                      className="card duel-card"
                      onClick={() => choose(side)}
                    >
                      <CardArt src={c.img} premade={!editable} />
                      <span className="card-text">{c.text}</span>
                      <span className="elo">{Math.round(c.elo)}</span>
                      <span className="rec">{record(c)}</span>
                      <span className="key">{side ? 'Right key' : 'Left key'}</span>
                    </button>
                    <button
                      className="remove"
                      onClick={() => removeDuelCard(c.id)}
                      aria-label={`Remove ${c.text}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="actions">
              <button className="btn" onClick={() => setSession(null)}>
                Done (Esc)
              </button>
              <button className="btn" onClick={reset}>
                {editable ? 'Reset ELO' : 'Reset all'}
              </button>
              <button className="btn" onClick={exportRanking}>
                Export
              </button>
            </div>
          </>
        ) : (
          <>
            {editable && (
              <form className="add" onSubmit={addCard}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="New card text..."
                  maxLength={120}
                  autoFocus
                />
                <button className="btn" type="submit">
                  Add
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={() => setBulk(bulk === null ? '' : null)}
                >
                  Bulk
                </button>
              </form>
            )}
            {editable && bulk !== null && (
              <form className="bulk" onSubmit={addBulk}>
                <textarea
                  value={bulk}
                  onChange={(e) => setBulk(e.target.value)}
                  placeholder={'One card per line...\nPizza\nTacos\nSushi'}
                  rows={6}
                  autoFocus
                />
                <button className="btn" type="submit">
                  Add{' '}
                  {bulk.split('\n').filter((l) => l.trim()).length || ''} cards
                </button>
              </form>
            )}

            <div className="cards">
              {cards.map((c) => (
                <div className="card" key={c.id}>
                  <button
                    className="remove"
                    onClick={() => removeCard(c.id)}
                    aria-label={`Remove ${c.text}`}
                  >
                    ×
                  </button>
                  <span className="card-text">{c.text}</span>
                  <span className="elo">{Math.round(c.elo)}</span>
                  <span className="rec">{record(c)}</span>
                </div>
              ))}
              {cards.length === 0 && (
                <p className="empty">No cards yet. Add at least two.</p>
              )}
            </div>

            <div className="actions">
              <button
                className="btn primary"
                onClick={startRanking}
                disabled={cards.length < 2}
              >
                Ranking
              </button>
              <button
                className="btn"
                onClick={reset}
                disabled={editable && cards.length === 0}
              >
                {editable ? 'Reset ELO' : 'Reset all'}
              </button>
              <button
                className="btn"
                onClick={exportRanking}
                disabled={cards.length === 0}
              >
                Export
              </button>
              {cards.length >= 2 && (
                <span className="hint">
                  ~{totalChoices(cards.length)} choices to rank {cards.length}
                </span>
              )}
            </div>
          </>
        )}
      </section>

      <aside className="board">
        <h2>LEADERBOARD</h2>
        {sorted.length === 0 ? (
          <p className="empty">—</p>
        ) : (
          <ol>
            {sorted.map((c) => (
              <li key={c.id}>
                <span className="name">{c.text}</span>
                <span className="rec">{record(c)}</span>
                <span className="elo">{Math.round(c.elo)}</span>
              </li>
            ))}
          </ol>
        )}
        <button
          className="btn tab history-toggle"
          onClick={() => setShowHistory((v) => !v)}
          aria-expanded={showHistory}
        >
          {showHistory ? 'Hide history' : 'History'}
        </button>
        {showHistory &&
          (history.length === 0 ? (
            <p className="empty">No choices yet.</p>
          ) : (
            <ul className="history">
              {history.map((h, i) => (
                <li key={history.length - i}>
                  <span>
                    {h.win} <span className="beat">beat</span> {h.lose}
                  </span>
                  <span className="elo">
                    {h.delta >= 0 ? '+' : ''}
                    {Math.round(h.delta)}
                  </span>
                </li>
              ))}
            </ul>
          ))}
      </aside>
    </main>
  )
}
