const SIZE = 280
const PADDING = 24

function MoodGraph({ tracks, audioFeatures }) {
  if (!audioFeatures.length) return null

  const featuresById = new Map(audioFeatures.map((f) => [f.id, f]))
  const points = tracks
    .map((t) => ({ track: t, features: featuresById.get(t.id) }))
    .filter((p) => p.features)

  if (!points.length) return null

  const toX = (valence) => PADDING + valence * (SIZE - PADDING * 2)
  const toY = (energy) => SIZE - PADDING - energy * (SIZE - PADDING * 2)

  return (
    <div className="mood-graph">
      <h3 className="panel-title">Mood map</h3>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width="100%" role="img" aria-label="Scatter plot of top tracks by energy and valence">
        <line x1={PADDING} y1={SIZE / 2} x2={SIZE - PADDING} y2={SIZE / 2} className="mood-axis" />
        <line x1={SIZE / 2} y1={PADDING} x2={SIZE / 2} y2={SIZE - PADDING} className="mood-axis" />
        <text x={SIZE - PADDING} y={SIZE / 2 - 8} className="mood-label" textAnchor="end">happy</text>
        <text x={PADDING} y={SIZE / 2 - 8} className="mood-label" textAnchor="start">sad</text>
        <text x={SIZE / 2 + 6} y={PADDING + 10} className="mood-label">energetic</text>
        <text x={SIZE / 2 + 6} y={SIZE - PADDING - 2} className="mood-label">calm</text>
        {points.map(({ track, features }) => (
          <circle
            key={track.id}
            cx={toX(features.valence)}
            cy={toY(features.energy)}
            r={5}
            className="mood-point"
          >
            <title>{`${track.name} — ${track.artists[0]?.name}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  )
}

export default MoodGraph
