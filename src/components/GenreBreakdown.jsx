function GenreBreakdown({ genres }) {
  if (!genres.length) return null

  return (
    <div className="genres">
      <h3 className="panel-title">Top genres</h3>
      <div className="genre-chips">
        {genres.map((g) => (
          <span className="chip" key={g}>
            {g}
          </span>
        ))}
      </div>
    </div>
  )
}

export default GenreBreakdown
