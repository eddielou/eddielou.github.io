import { useCallback, useEffect, useState } from 'react'
import { START_ELO, updateElo } from './elo'
import './App.css'

const STORAGE_KEY = 'elo-ranker-cards'

function loadCards() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
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
  const [cards, setCards] = useState(loadCards)
  const [text, setText] = useState('')
  const [ranking, setRanking] = useState(false)
  const [pair, setPair] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards))
    } catch {
      /* storage unavailable */
    }
  }, [cards])

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

  const resetElo = () =>
    setCards((cs) => cs.map((c) => ({ ...c, elo: START_ELO, games: 0 })))

  const sorted = [...cards].sort((a, b) => b.elo - a.elo)
  const canRank = cards.length >= 2
  const left = ranking && pair ? cards[pair[0]] : null
  const right = ranking && pair ? cards[pair[1]] : null

  return (
    <div className="app">
      <header>
        <h1>ELO RANKER</h1>
        <p>&gt; make cards. pick winners. see the ranking_</p>
      </header>

      <main>
        <section className="stage">
          {ranking && left && right ? (
            <>
              <div className="duel">
                {[left, right].map((c, side) => (
                  <button
                    key={c.id}
                    className="card duel-card"
                    onClick={() => choose(side)}
                  >
                    <span className="card-text">{c.text}</span>
                    <span className="elo">{Math.round(c.elo)}</span>
                    <span className="key">{side ? '→' : '←'}</span>
                  </button>
                ))}
              </div>
              <button className="btn" onClick={() => setRanking(false)}>
                Done (Esc)
              </button>
            </>
          ) : (
            <>
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
                  onClick={resetElo}
                  disabled={cards.length === 0}
                >
                  Reset ELO
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
    </div>
  )
}
