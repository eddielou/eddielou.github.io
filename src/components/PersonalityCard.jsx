import { forwardRef } from 'react'

const PersonalityCard = forwardRef(function PersonalityCard(
  { personality, timeRangeLabel },
  ref,
) {
  return (
    <div className="personality-card" ref={ref}>
      <span className="personality-eyebrow">Your music personality</span>
      <h2 className="personality-title">{personality.title}</h2>
      <p className="personality-desc">{personality.description}</p>
      <span className="personality-range">{timeRangeLabel}</span>
    </div>
  )
})

export default PersonalityCard
