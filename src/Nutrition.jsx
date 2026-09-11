import { useMemo, useState } from 'react'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function Nutrition({ profile, onSave }) {
  const [plan, setPlan] = useState(profile.nutrition || '')
  const [entries, setEntries] = useState(Array.isArray(profile.nutritionEntries) ? profile.nutritionEntries : [])
  const [entryDate, setEntryDate] = useState(today)
  const [meal, setMeal] = useState('Breakfast')
  const [food, setFood] = useState('')
  const [calories, setCalories] = useState('')
  const [saved, setSaved] = useState(false)
  const todaysEntries = useMemo(() => entries.filter(entry => entry.date === entryDate), [entries, entryDate])
  const todaysCalories = todaysEntries.reduce((total, entry) => total + entry.calories, 0)

  function saveNutrition(nextEntries = entries, nextPlan = plan) {
    setEntries(nextEntries)
    setPlan(nextPlan)
    onSave({ nutrition: nextPlan.trim(), nutritionEntries: nextEntries })
    setSaved(true)
  }

  function addFood(event) {
    event.preventDefault()
    const calorieValue = Number(calories)
    if (!food.trim() || !Number.isFinite(calorieValue) || calorieValue < 0) return
    const nextEntries = [...entries, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, date: entryDate, meal, food: food.trim(), calories: Math.round(calorieValue) }]
    saveNutrition(nextEntries)
    setFood('')
    setCalories('')
  }

  function removeFood(id) {
    saveNutrition(entries.filter(entry => entry.id !== id))
  }
  return (
    <section className="workout-card">
      <p className="small-text">Your nutrition planning space</p>
      <h3>A routine that fits your life</h3>
      <p className="profile-intro">Log what you eat, keep an eye on calories, and save the notes that make your plan work in everyday life.</p>
      {profile.clientType === 'youre-with-us' && <p className="profile-intro">You decide what to include, such as foods you enjoy, textures you prefer, and any support you would like with meal preparation.</p>}
      <div className="nutrition-summary">
        <div><span>{entryDate === today() ? "Today's calories" : `${entryDate} calories`}</span><strong>{todaysCalories}</strong></div>
        <div><span>Food items</span><strong>{todaysEntries.length}</strong></div>
      </div>
      <form onSubmit={addFood} className="profile-form nutrition-entry-form">
        <h4>Log a food item</h4>
        <div className="nutrition-inputs">
          <label>Date<input type="date" value={entryDate} onChange={event => setEntryDate(event.target.value)} required /></label>
          <label>Meal<select value={meal} onChange={event => setMeal(event.target.value)}><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option></select></label>
          <label>Food item<input value={food} onChange={event => setFood(event.target.value)} placeholder="e.g. Greek yogurt" required /></label>
          <label>Calories<input type="number" min="0" step="1" value={calories} onChange={event => setCalories(event.target.value)} placeholder="e.g. 180" required /></label>
        </div>
        <button className="main-button" type="submit">Add food item</button>
      </form>
      <div className="nutrition-list" aria-live="polite">
        {todaysEntries.length === 0 ? <p className="empty-message">No food items logged for this date.</p> : todaysEntries.map(entry => (
          <div className="nutrition-item" key={entry.id}>
            <div><strong>{entry.food}</strong><span>{entry.meal}</span></div>
            <strong>{entry.calories} cal</strong>
            <button type="button" onClick={() => removeFood(entry.id)} aria-label={`Remove ${entry.food}`}>Remove</button>
          </div>
        ))}
      </div>
      <form onSubmit={event => { event.preventDefault(); saveNutrition(entries, plan) }} className="profile-form">
        <label htmlFor="nutrition-plan">My nutrition plan and notes</label>
        <textarea id="nutrition-plan" rows={6} maxLength={10000} value={plan} placeholder="Add meal ideas, a weekly routine, or notes from your nutrition plan..." onChange={event => { setPlan(event.target.value); setSaved(false) }} />
        <p className="demo-note">Saved to your account. These notes are not automatically shared with a trainer.</p>
        <button className="main-button" type="submit">Save nutrition plan</button>
        {saved && <p role="status" className="save-status">Nutrition plan updated in this view. Account save progress appears above.</p>}
      </form>
    </section>
  )
}
