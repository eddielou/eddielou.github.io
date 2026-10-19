import { useEffect, useRef, useState } from 'react'
import { FONTS, THEMES } from './themes'

export default function Settings({ theme, onTheme, font, onFont, spotify }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="settings" ref={ref}>
      <button
        className="gear"
        onClick={() => setOpen((o) => !o)}
        aria-label="Settings"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
          <circle cx="12" cy="12" r="6.5" />
        </svg>
      </button>
      {open && (
        <div className="settings-panel" role="dialog" aria-label="Settings">
          <h2>SETTINGS</h2>
          <p className="setting-label">Color scheme</p>
          {THEMES.map((t) => (
            <button
              key={t.id}
              className={`theme-opt${t.id === theme ? ' on' : ''}`}
              onClick={() => onTheme(t.id)}
            >
              <span
                className="swatch"
                style={{ background: t.swatch[0], color: t.swatch[1] }}
              >
                Aa
              </span>
              {t.label}
            </button>
          ))}
          <p className="setting-label font-label">Font</p>
          {FONTS.map((f) => (
            <button
              key={f.id}
              className={`theme-opt${f.id === font ? ' on' : ''}`}
              style={{ fontFamily: f.family }}
              onClick={() => onFont(f.id)}
            >
              {f.label}
            </button>
          ))}
          {spotify?.configured && (
            <>
              <p className="setting-label font-label">Spotify</p>
              {spotify.loggedIn ? (
                <button className="theme-opt" onClick={spotify.onDisconnect}>
                  Disconnect
                </button>
              ) : (
                <button className="theme-opt" onClick={spotify.onConnect}>
                  Connect Spotify
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
