import imdb from './data/imdbTop250.json'
import pitchfork from './data/pitchfork.json'

export const COLLECTIONS = [
  { id: 'custom', label: 'Custom', items: null, sizes: null },
  {
    id: 'imdb',
    label: 'IMDB Top',
    items: imdb,
    sizes: [50, 100, 250],
  },
  {
    id: 'pitchfork',
    label: 'Top Albums',
    items: pitchfork,
    sizes: [50, 100, 200],
    note: 'Approximate list, not the official Pitchfork reader order.',
  },
]

export const storageKey = (collection, size) =>
  collection.sizes ? `elo-ranker:${collection.id}:${size}` : 'elo-ranker-cards'
