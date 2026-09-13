import { useMemo, useState } from 'react'

function today() {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export default function WeightTracker({ profile, onSave }) {
  const [entries, setEntries] = useState(Array.isArray(profile.weightHistory) ? profile.weightHistory : [])
  const [entryDate, setEntryDate] = useState(today)
  const [weight, setWeight] = useState('')

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries],
  )
  const firstWeight = sortedEntries[0]?.weight
  const latestWeight = sortedEntries.at(-1)?.weight
  const change = firstWeight && latestWeight ? latestWeight - firstWeight : 0
  const minWeight = sortedEntries.length ? Math.min(...sortedEntries.map(entry => entry.weight)) : 0
  const maxWeight = sortedEntries.length ? Math.max(...sortedEntries.map(entry => entry.weight)) : 0
  const range = Math.max(maxWeight - minWeight, 1)
  const chartPoints = sortedEntries.map((entry, index) => {
    const x = sortedEntries.length === 1 ? 50 : (index / (sortedEntries.length - 1)) * 100
    const y = 88 - ((entry.weight - minWeight) / range) * 70
    return `${x},${y}`
  }).join(' ')

  function saveEntries(nextEntries) {
    setEntries(nextEntries)
    onSave({ weightHistory: nextEntries })
  }

  function addEntry(event) {
    event.preventDefault()
    const weightValue = Number(weight)
    if (!Number.isFinite(weightValue) || weightValue <= 0 || !entryDate) return
    const nextEntries = [
      ...entries.filter(entry => entry.date !== entryDate),
      { id: `weight-${entryDate}`, date: entryDate, weight: Math.round(weightValue * 10) / 10 },
    ]
    saveEntries(nextEntries)
    setWeight('')
  }

  function removeEntry(id) {
    saveEntries(entries.filter(entry => entry.id !== id))
  }

  return (
    <section className="workout-card weight-tracker">
      <p className="small-text">Track changes over time</p>
      <h3>Your weight trend</h3>
      <p className="profile-intro">Add your weight regularly to see whether your trend is moving up or down.</p>
      <div className="nutrition-summary">
        <div><span>Current weight</span><strong>{latestWeight ? `${latestWeight} lb` : '—'}</strong></div>
        <div><span>Change since first entry</span><strong className={change > 0 ? 'weight-gain' : change < 0 ? 'weight-loss' : ''}>{change ? `${change > 0 ? '+' : ''}${change.toFixed(1)} lb` : '—'}</strong></div>
      </div>
      {sortedEntries.length > 0 ? (
        <div className="weight-chart-wrap">
          <svg className="weight-chart" viewBox="0 0 100 100" role="img" aria-label="Weight trend chart">
            <line x1="0" y1="88" x2="100" y2="88" className="chart-axis" />
            <polyline points={chartPoints} className="chart-line" />
            {sortedEntries.map((entry, index) => {
              const x = sortedEntries.length === 1 ? 50 : (index / (sortedEntries.length - 1)) * 100
              const y = 88 - ((entry.weight - minWeight) / range) * 70
              return <circle key={entry.id} cx={x} cy={y} r="1.8" className="chart-point" />
            })}
          </svg>
          <div className="chart-labels"><span>{sortedEntries[0].date}</span><span>{sortedEntries.at(-1).date}</span></div>
        </div>
      ) : <p className="empty-message">Add your first weight entry to see your trend chart.</p>}
      <form onSubmit={addEntry} className="profile-form nutrition-entry-form">
        <h4>Log weight</h4>
        <div className="nutrition-inputs">
          <label>Date<input type="date" value={entryDate} onChange={event => setEntryDate(event.target.value)} required /></label>
          <label>Weight (lb)<input type="number" min="1" max="1000" step="0.1" value={weight} onChange={event => setWeight(event.target.value)} placeholder="e.g. 150" required /></label>
        </div>
        <button className="main-button" type="submit">Save weight</button>
      </form>
      <div className="nutrition-list" aria-live="polite">
        {[...sortedEntries].reverse().map(entry => (
          <div className="nutrition-item" key={entry.id}>
            <div><strong>{entry.weight} lb</strong><span>{entry.date}</span></div>
            <button type="button" onClick={() => removeEntry(entry.id)} aria-label={`Remove weight entry from ${entry.date}`}>Remove</button>
          </div>
        ))}
      </div>
    </section>
  )
}
