import { useCallback, useEffect, useState } from 'react'
import { START_ELO, updateElo } from './elo'
import { COLLECTIONS, storageKey } from './collections'
import './App.css'

const defaultCards = (key, items) =>
  (items ?? []).map((text, i) => ({
    id: `${key}:${i}`,
    text,
    elo: START_ELO,
    games: 0,
  }))

function loadCards(key, items) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key))
    if (Array.isArray(parsed)) return parsed
  } catch {
    /* fall through to defaults */
  }
  return defaultCards(key, items)
}

// Pick two distinct cards, favouring ones that have been compared least and
// avoiding an immediate repeat of the previous pairing.
function pickPair(cards, previous) {
  const pool = cards.map((c, i) => ({ i, w: 1 / (1 + c.games) }))
  const draw = (items) => {
    const total = items.reduce((s, x) => s + x.w, 0)
    let r = Math.random() * total
    return items.find((x) => (r -= x.w) < 0) ?? items[items.length - 1]
  }
  for (let tries = 0; tries < 10; tries++) {
    const a = draw(pool)
    const b = draw(pool.filter((x) => x.i !== a.i))
    const pair = Math.random() < 0.5 ? [a.i, b.i] : [b.i, a.i]
    const same =
      previous && [...pair].sort().join() === [...previous].sort().join()
    if (!same || cards.length <= 2) return pair
  }
  return [0, 1]
}

export default function App() {
  const [collectionId, setCollectionId] = useState(
    () => localStorage.getItem('elo-ranker-collection') ?? 'custom',
  )
  const collection =
    COLLECTIONS.find((c) => c.id === collectionId) ?? COLLECTIONS[0]
  const [sizes, setSizes] = useState({})
  const size = sizes[collection.id] ?? collection.sizes?.[0]
  const key = storageKey(collection, size)

  const pick = (id) => {
    setCollectionId(id)
    try {
      localStorage.setItem('elo-ranker-collection', id)
    } catch {
      /* storage unavailable */
    }
  }

  return (
    <div className="app">
      <header>
        <h1>ELO RANKER</h1>
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
        </nav>
        {collection.note && <p className="note">* {collection.note}</p>}
      </header>
      <Ranker
        key={key}
        storageKey={key}
        items={collection.items?.slice(0, size)}
        editable={!collection.sizes}
      />
    </div>
  )
}

function Ranker({ storageKey: key, items, editable }) {
  const [cards, setCards] = useState(() => loadCards(key, items))
  const [text, setText] = useState('')
  const [ranking, setRanking] = useState(false)
  const [pair, setPair] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(cards))
    } catch {
      /* storage unavailable */
    }
  }, [cards, key])

  const addCard = (e) => {
    e.preventDefault()
    const t = text.trim()
    if (!t) return
    setCards((cs) => [
      ...cs,
      { id: crypto.randomUUID(), text: t, elo: START_ELO, games: 0 },
    ])
    setText('')
  }

  const removeCard = (id) => setCards((cs) => cs.filter((c) => c.id !== id))

  const removeDuelCard = (id) => {
    const next = cards.filter((c) => c.id !== id)
    setCards(next)
    if (next.length < 2) setRanking(false)
    else setPair(pickPair(next, null))
  }

  const startRanking = () => {
    setPair(pickPair(cards, null))
    setRanking(true)
  }

  const choose = useCallback(
    (side) => {
      if (!pair) return
      const winner = cards[pair[side]]
      const loser = cards[pair[1 - side]]
      const [w, l] = updateElo(winner.elo, loser.elo)
      const next = cards.map((c) =>
        c.id === winner.id
          ? { ...c, elo: w, games: c.games + 1 }
          : c.id === loser.id
            ? { ...c, elo: l, games: c.games + 1 }
            : c,
      )
      setCards(next)
      setPair(pickPair(next, pair))
    },
    [cards, pair],
  )

  useEffect(() => {
    if (!ranking) return
    const onKey = (e) => {
      if (e.key === 'ArrowLeft') choose(0)
      else if (e.key === 'ArrowRight') choose(1)
      else if (e.key === 'Escape') setRanking(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ranking, choose])

  // Custom: keep the user's cards, zero their ratings. Premade: restore the
  // full original list at 1000.
  const reset = () =>
    editable
      ? setCards((cs) => cs.map((c) => ({ ...c, elo: START_ELO, games: 0 })))
      : setCards(defaultCards(key, items))

  const sorted = [...cards].sort((a, b) => b.elo - a.elo)
  const canRank = cards.length >= 2
  const left = ranking && pair ? cards[pair[0]] : null
  const right = ranking && pair ? cards[pair[1]] : null

  return (
      <main>
        <section className="stage">
          {ranking && left && right ? (
            <>
              <div className="duel">
                {[left, right].map((c, side) => (
                  <div className="duel-wrap" key={c.id}>
                    <button
                      className="card duel-card"
                      onClick={() => choose(side)}
                    >
                      <span className="card-text">{c.text}</span>
                      <span className="elo">{Math.round(c.elo)}</span>
                      <span className="key">{side ? '→' : '←'}</span>
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
              <button className="btn" onClick={() => setRanking(false)}>
                Done (Esc)
              </button>
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
                  disabled={!canRank}
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
                  <span className="elo">{Math.round(c.elo)}</span>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </main>
  )
}
