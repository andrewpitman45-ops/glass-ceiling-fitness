import { useMemo, useState } from 'react'

function today() {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

export default function CaloriesBurned({ profile, onSave }) {
  const [entries, setEntries] = useState(Array.isArray(profile.caloriesBurned) ? profile.caloriesBurned : [])
  const [entryDate, setEntryDate] = useState(today)
  const [activity, setActivity] = useState('')
  const [calories, setCalories] = useState('')
  const todaysEntries = useMemo(() => entries.filter(entry => entry.date === entryDate), [entries, entryDate])
  const todaysCalories = todaysEntries.reduce((total, entry) => total + entry.calories, 0)

  function saveEntries(nextEntries) {
    setEntries(nextEntries)
    onSave({ caloriesBurned: nextEntries })
  }

  function addActivity(event) {
    event.preventDefault()
    const calorieValue = Number(calories)
    if (!activity.trim() || !Number.isFinite(calorieValue) || calorieValue < 0) return
    saveEntries([...entries, {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: entryDate,
      activity: activity.trim(),
      calories: Math.round(calorieValue),
    }])
    setActivity('')
    setCalories('')
  }

  function removeActivity(id) {
    saveEntries(entries.filter(entry => entry.id !== id))
  }

  return (
    <section className="workout-card">
      <p className="small-text">Track your movement and workouts</p>
      <h3>Your daily burn</h3>
      <p className="profile-intro">Completed workouts are added automatically. You can also record walks, activities, or other movement here.</p>
      <div className="nutrition-summary">
        <div><span>{entryDate === today() ? "Today's calories burned" : `${entryDate} calories burned`}</span><strong>{todaysCalories}</strong></div>
        <div><span>Activities</span><strong>{todaysEntries.length}</strong></div>
      </div>
      <form onSubmit={addActivity} className="profile-form nutrition-entry-form">
        <h4>Log activity</h4>
        <div className="nutrition-inputs">
          <label>Date<input type="date" value={entryDate} onChange={event => setEntryDate(event.target.value)} required /></label>
          <label>Activity<input value={activity} onChange={event => setActivity(event.target.value)} placeholder="e.g. 30 minute walk" required /></label>
          <label>Calories burned<input type="number" min="0" step="1" value={calories} onChange={event => setCalories(event.target.value)} placeholder="e.g. 140" required /></label>
        </div>
        <button className="main-button" type="submit">Add activity</button>
      </form>
      <div className="nutrition-list" aria-live="polite">
        {todaysEntries.length === 0 ? <p className="empty-message">No calories burned logged for this date.</p> : todaysEntries.map(entry => (
          <div className="nutrition-item" key={entry.id}>
            <div><strong>{entry.activity}</strong><span>{entry.date}</span></div>
            <strong>{entry.calories} cal</strong>
            <button type="button" onClick={() => removeActivity(entry.id)} aria-label={`Remove ${entry.activity}`}>Remove</button>
          </div>
        ))}
      </div>
    </section>
  )
}