export const THEMES = [
  { id: 'synthwave', label: 'Synthwave', swatch: ['#140c28', '#ff5fa8'] },
  { id: 'gameboy', label: 'Game Boy', swatch: ['#0f380f', '#9bbc0f'] },
  { id: 'midnight', label: 'Midnight', swatch: ['#0b1220', '#5ee1c9'] },
  { id: 'mac', label: 'Classic Mac', swatch: ['#e8e8e8', '#1a3fd1'] },
]

const KEY = 'rank-things-theme'

export function loadTheme() {
  try {
    const id = localStorage.getItem(KEY)
    if (THEMES.some((t) => t.id === id)) return id
  } catch {
    /* storage unavailable */
  }
  return THEMES[0].id
}

export function applyTheme(id) {
  document.documentElement.dataset.theme = id
  try {
    localStorage.setItem(KEY, id)
  } catch {
    /* storage unavailable */
  }
}

export const FONTS = [
  { id: 'courier', label: 'Courier', family: "'Courier New', Courier, monospace" },
  { id: 'plex', label: 'IBM Plex Mono', family: "'IBM Plex Mono', monospace" },
  { id: 'vt323', label: 'VT323', family: "'VT323', monospace" },
  { id: 'pixel', label: 'Press Start 2P', family: "'Press Start 2P', monospace" },
]

const FONT_KEY = 'rank-things-font'

export function loadFont() {
  try {
    const id = localStorage.getItem(FONT_KEY)
    if (FONTS.some((f) => f.id === id)) return id
  } catch {
    /* storage unavailable */
  }
  return FONTS[0].id
}

export function applyFont(id) {
  document.documentElement.dataset.font = id
  try {
    localStorage.setItem(FONT_KEY, id)
  } catch {
    /* storage unavailable */
  }
}
