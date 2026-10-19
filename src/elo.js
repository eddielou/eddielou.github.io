export const START_ELO = 1000
const K = 32

// Standard ELO: expected score from rating difference, then move by K * (actual - expected).
export function updateElo(winner, loser) {
  const expectedWin = 1 / (1 + 10 ** ((loser - winner) / 400))
  const delta = K * (1 - expectedWin)
  return [winner + delta, loser - delta]
}
