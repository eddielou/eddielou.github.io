const ENERGETIC_GENRES = [
  'edm', 'dance', 'house', 'techno', 'punk', 'metal', 'hardstyle',
  'drum and bass', 'dnb', 'trap', 'dubstep', 'hardcore', 'rave',
]
const CHILL_GENRES = [
  'lo-fi', 'lofi', 'acoustic', 'ambient', 'chill', 'jazz',
  'singer-songwriter', 'folk', 'soul', 'bossa nova', 'new age',
]
const MOODY_GENRES = [
  'emo', 'sad', 'indie folk', 'shoegaze', 'post-punk', 'slowcore', 'sadcore',
]
const BRIGHT_GENRES = ['pop', 'disco', 'funk', 'k-pop', 'reggaeton', 'afrobeats']

function average(nums) {
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : null
}

function keywordShare(genres, keywords) {
  if (!genres.length) return 0
  const hits = genres.filter((g) => keywords.some((k) => g.includes(k)))
  return hits.length / genres.length
}

function computeStats({ tracks, artists, audioFeatures }) {
  const genreCounts = {}
  artists.forEach((a) =>
    (a.genres || []).forEach((g) => {
      genreCounts[g] = (genreCounts[g] || 0) + 1
    }),
  )
  const allGenres = Object.keys(genreCounts)
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([g]) => g)

  const avgPopularity = average(tracks.map((t) => t.popularity)) ?? 50
  const years = tracks
    .map((t) => parseInt(t.album?.release_date?.slice(0, 4), 10))
    .filter((y) => Number.isFinite(y))
  const avgYear = average(years) ?? new Date().getFullYear()
  const currentYear = new Date().getFullYear()

  const hasAudioFeatures = audioFeatures.length > 0
  const energyProxy = hasAudioFeatures
    ? average(audioFeatures.map((f) => f.energy))
    : keywordShare(allGenres, ENERGETIC_GENRES) -
      keywordShare(allGenres, CHILL_GENRES) * 0.6 +
      0.5
  const valenceProxy = hasAudioFeatures
    ? average(audioFeatures.map((f) => f.valence))
    : keywordShare(allGenres, BRIGHT_GENRES) -
      keywordShare(allGenres, MOODY_GENRES) * 0.7 +
      0.5
  const danceProxy = hasAudioFeatures
    ? average(audioFeatures.map((f) => f.danceability))
    : keywordShare(allGenres, [...ENERGETIC_GENRES, ...BRIGHT_GENRES]) * 0.7 + 0.3

  return {
    topGenres,
    genreDiversity: allGenres.length,
    mainstream: avgPopularity / 100,
    recency: Math.min(Math.max((avgYear - (currentYear - 60)) / 60, 0), 1),
    isFreshDrop: currentYear - avgYear <= 1,
    energy: clamp01(energyProxy),
    valence: clamp01(valenceProxy),
    danceability: clamp01(danceProxy),
    hasAudioFeatures,
  }
}

function clamp01(n) {
  if (n == null || Number.isNaN(n)) return 0.5
  return Math.min(Math.max(n, 0), 1)
}

function genreList(genres, count = 2) {
  const picked = genres.slice(0, count)
  if (!picked.length) return 'a genre-bending mix'
  return picked.join(' and ')
}

const ARCHETYPES = [
  {
    title: 'The Chaotic Curator',
    score: (s) => s.genreDiversity / 20,
    describe: (s) =>
      `Your top artists span ${s.genreDiversity} different genres — from ${genreList(s.topGenres, 3)}. There's no throughline here except that you refuse to be pinned down.`,
  },
  {
    title: 'The Comfort Loop',
    score: (s) => 1 - Math.min(s.genreDiversity / 12, 1),
    describe: (s) =>
      `You've found your lane — mostly ${genreList(s.topGenres, 2)} — and you're staying in it. Not every playlist needs to be a discovery mission.`,
  },
  {
    title: 'The Mainstream Main Character',
    score: (s) => s.mainstream,
    describe: () =>
      `Your top tracks are the ones everyone else has on repeat too. You're not chasing obscurity — you just have great, popular taste.`,
  },
  {
    title: 'The Underground Insider',
    score: (s) => 1 - s.mainstream,
    describe: (s) =>
      `Low mainstream scores across your top tracks say it plainly: you were probably into ${genreList(s.topGenres, 2)} before it had a name.`,
  },
  {
    title: 'The Adrenaline Seeker',
    score: (s) => s.energy,
    describe: (s) =>
      `High-energy, high-tempo, no time to sit still. ${genreList(s.topGenres, 2)} keeps your pulse up whether you're working out or just existing.`,
  },
  {
    title: 'The Night Drive Dreamer',
    score: (s) => 1 - s.energy + (1 - s.valence) * 0.5,
    describe: (s) =>
      `Moody, low-energy, made for staring out of a car window at 1am. ${genreList(s.topGenres, 2)} soundtracks your quieter hours.`,
  },
  {
    title: 'The Nostalgic Optimist',
    score: (s) => (1 - s.recency) * 0.6 + s.valence * 0.4,
    describe: (s) =>
      `You gravitate toward older, sunnier sounds — ${genreList(s.topGenres, 2)} that feels warm and familiar rather than cutting-edge.`,
  },
  {
    title: 'The Fresh Drop Hunter',
    score: (s) => (s.isFreshDrop ? 1 : 0) + s.recency * 0.3,
    describe: (s) =>
      `Your top tracks skew brand new — you're finding ${genreList(s.topGenres, 2)} the week it lands, not the year after.`,
  },
  {
    title: 'The Dance Floor Regular',
    score: (s) => s.danceability * 0.8 + s.valence * 0.2,
    describe: (s) =>
      `Danceable, upbeat, built for moving. ${genreList(s.topGenres, 2)} makes it hard to stay seated.`,
  },
  {
    title: 'The Genre-Fluid Wanderer',
    score: (s) => 1 - Math.abs(s.genreDiversity / 12 - 0.5) * 2,
    describe: (s) =>
      `Not chaotic, not narrow — you move deliberately between ${genreList(s.topGenres, 3)} depending on the day.`,
  },
]

export function buildPersonality({ tracks, artists, audioFeatures }) {
  const stats = computeStats({ tracks, artists, audioFeatures })
  const ranked = ARCHETYPES.map((a) => ({ ...a, _score: a.score(stats) })).sort(
    (a, b) => b._score - a._score,
  )
  const best = ranked[0]

  return {
    title: best.title,
    description: best.describe(stats),
    stats,
  }
}
