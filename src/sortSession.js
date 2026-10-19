// Binary-insertion sort driven by the user's choices. Each step compares the
// card being inserted (`x`) against the midpoint of the already-ranked list,
// so a full ranking needs about log2(n!) choices rather than n^2.

const ceilLog2 = (n) => (n <= 1 ? 0 : Math.ceil(Math.log2(n)))

// Worst-case choices to fully rank n cards.
export function totalChoices(n) {
  let sum = 0
  for (let size = 1; size < n; size++) sum += ceilLog2(size + 1)
  return sum
}

function shuffle(a) {
  const out = [...a]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// Move on to the next pending card once the current one has a slot.
function advance(s) {
  if (s.lo < s.hi || s.x === null) return s
  const sorted = [...s.sorted]
  sorted.splice(s.lo, 0, s.x)
  const [x, ...pending] = s.pending
  return {
    sorted,
    pending,
    x: x ?? null,
    lo: 0,
    hi: sorted.length,
    flip: Math.random() < 0.5,
  }
}

export function startSession(ids) {
  const [first, ...rest] = shuffle(ids)
  if (first === undefined) return { sorted: [], pending: [], x: null, lo: 0, hi: 0, flip: false }
  const [x, ...pending] = rest
  return { sorted: [first], pending, x: x ?? null, lo: 0, hi: 1, flip: Math.random() < 0.5 }
}

export const isDone = (s) => s.x === null

// [leftId, rightId] for the next choice.
export function currentPair(s) {
  const other = s.sorted[Math.floor((s.lo + s.hi) / 2)]
  return s.flip ? [other, s.x] : [s.x, other]
}

// Choose which side `x` appears on so a card that carries over from the
// previous matchup stays on the side it was on.
function withStableSides(s, prev) {
  if (isDone(s)) return s
  const other = s.sorted[Math.floor((s.lo + s.hi) / 2)]
  let flip = Math.random() < 0.5
  if (prev) {
    if (s.x === prev[0]) flip = false
    else if (s.x === prev[1]) flip = true
    else if (other === prev[0]) flip = true
    else if (other === prev[1]) flip = false
  }
  return { ...s, flip }
}

export function answer(s, winnerId) {
  const prev = currentPair(s)
  const mid = Math.floor((s.lo + s.hi) / 2)
  const xWins = winnerId === s.x
  return withStableSides(
    advance({
      ...s,
      lo: xWins ? s.lo : mid + 1,
      hi: xWins ? mid : s.hi,
    }),
    prev,
  )
}

// Drop a card without losing progress. Removing a ranked card invalidates the
// current search bounds, so the card being inserted starts its search again.
export function removeFromSession(s, id) {
  const prev = isDone(s) ? null : currentPair(s)
  return withStableSides(removeRaw(s, id), prev)
}

function removeRaw(s, id) {
  if (s.x === id) {
    const [x, ...pending] = s.pending
    return advance({ ...s, x: x ?? null, pending, lo: 0, hi: s.sorted.length, flip: Math.random() < 0.5 })
  }
  const sorted = s.sorted.filter((c) => c !== id)
  return advance({
    ...s,
    sorted,
    pending: s.pending.filter((c) => c !== id),
    lo: 0,
    hi: sorted.length,
  })
}

// Worst-case choices still needed.
export function choicesLeft(s) {
  if (isDone(s)) return 0
  let size = s.sorted.length + 1
  let left = ceilLog2(s.hi - s.lo + 1)
  for (let i = 0; i < s.pending.length; i++) {
    left += ceilLog2(size + 1)
    size++
  }
  return left
}
