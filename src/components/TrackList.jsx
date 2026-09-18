function TrackList({ tracks, recentPlayCounts = {} }) {
  return (
    <ol className="track-list">
      {tracks.map((track, i) => {
        const count = recentPlayCounts[track.id]
        return (
          <li key={track.id} className="track-row">
            <span className="track-rank">{i + 1}</span>
            <img
              className="track-art"
              src={track.album?.images?.[2]?.url || track.album?.images?.[0]?.url}
              alt=""
              width={44}
              height={44}
              loading="lazy"
            />
            <span className="track-info">
              <span className="track-name">{track.name}</span>
              <span className="track-artist">
                {track.artists.map((a) => a.name).join(', ')}
              </span>
            </span>
            {count > 0 && (
              <span className="track-plays" title="Times played in your last 50 plays">
                {count}×
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

export default TrackList
