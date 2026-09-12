import { useEffect, useMemo, useState } from 'react'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function numberOrZero(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0
}

function nutritionPer100g(product) {
  const nutrients = product.nutriments || {}
  return {
    calories: numberOrZero(nutrients['energy-kcal_100g'] || nutrients['energy-kcal_value']),
    protein: numberOrZero(nutrients.proteins_100g),
    carbs: numberOrZero(nutrients.carbohydrates_100g),
    fat: numberOrZero(nutrients.fat_100g),
  }
}

const SAVED_FOODS = [
  { name: 'Greek yogurt', serving: 170, calories: 100, protein: 10, carbs: 3.6, fat: 0.4 },
  { name: 'Cottage cheese', serving: 113, calories: 90, protein: 12, carbs: 4, fat: 2.5 },
  { name: 'Egg', serving: 50, calories: 72, protein: 6.3, carbs: 0.4, fat: 4.8 },
  { name: 'Chicken breast', serving: 140, calories: 231, protein: 43.4, carbs: 0, fat: 5 },
  { name: 'Salmon', serving: 140, calories: 291, protein: 31.2, carbs: 0, fat: 17.5 },
  { name: 'Lean ground beef', serving: 113, calories: 244, protein: 29.5, carbs: 0, fat: 13 },
  { name: 'Tofu', serving: 100, calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  { name: 'Black beans', serving: 130, calories: 114, protein: 7.6, carbs: 20.4, fat: 0.5 },
  { name: 'Brown rice', serving: 195, calories: 216, protein: 5, carbs: 44.8, fat: 1.8 },
  { name: 'Oatmeal', serving: 234, calories: 166, protein: 5.9, carbs: 28.1, fat: 3.6 },
  { name: 'Whole wheat bread', serving: 64, calories: 158, protein: 8, carbs: 26.5, fat: 2.4 },
  { name: 'Quinoa', serving: 185, calories: 222, protein: 8.1, carbs: 39.4, fat: 3.6 },
  { name: 'Sweet potato', serving: 180, calories: 162, protein: 3.6, carbs: 37.2, fat: 0.3 },
  { name: 'Avocado', serving: 100, calories: 160, protein: 2, carbs: 8.5, fat: 14.7 },
  { name: 'Banana', serving: 118, calories: 105, protein: 1.3, carbs: 27, fat: 0.4 },
  { name: 'Apple', serving: 182, calories: 95, protein: 0.5, carbs: 25.1, fat: 0.3 },
  { name: 'Blueberries', serving: 148, calories: 84, protein: 1.1, carbs: 21.4, fat: 0.5 },
  { name: 'Broccoli', serving: 156, calories: 53, protein: 3.7, carbs: 10.8, fat: 0.6 },
  { name: 'Mixed salad greens', serving: 85, calories: 20, protein: 1.7, carbs: 3.1, fat: 0.3 },
  { name: 'Almonds', serving: 28, calories: 164, protein: 6, carbs: 6.1, fat: 14.2 },
  { name: 'Peanut butter', serving: 32, calories: 188, protein: 8, carbs: 6.3, fat: 16 },
  { name: 'Hummus', serving: 30, calories: 50, protein: 2.4, carbs: 4.2, fat: 2.8 },
]

export default function Nutrition({ profile, onSave }) {
  const [plan, setPlan] = useState(profile.nutrition || '')
  const [entries, setEntries] = useState(Array.isArray(profile.nutritionEntries) ? profile.nutritionEntries : [])
  const [entryDate, setEntryDate] = useState(today)
  const [meal, setMeal] = useState('Breakfast')
  const [food, setFood] = useState('')
  const [calories, setCalories] = useState('')
  const [protein, setProtein] = useState('')
  const [carbs, setCarbs] = useState('')
  const [fat, setFat] = useState('')
  const [servingGrams, setServingGrams] = useState('100')
  const [foodResults, setFoodResults] = useState([])
  const [foodSearchStatus, setFoodSearchStatus] = useState('')
  const [selectedFood, setSelectedFood] = useState(null)
  const [saved, setSaved] = useState(false)
  const todaysEntries = useMemo(() => entries.filter(entry => entry.date === entryDate), [entries, entryDate])
  const todaysCalories = todaysEntries.reduce((total, entry) => total + entry.calories, 0)
  const macroTotals = todaysEntries.reduce((totals, entry) => ({
    protein: totals.protein + entry.protein,
    carbs: totals.carbs + entry.carbs,
    fat: totals.fat + entry.fat,
  }), { protein: 0, carbs: 0, fat: 0 })
  const largestMacro = Math.max(...Object.values(macroTotals), 1)

  useEffect(() => {
    const searchTerm = food.trim()
    if (searchTerm.length < 2 || selectedFood?.name === searchTerm) {
      return undefined
    }

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      setFoodSearchStatus('Searching foods...')
      try {
        const params = new URLSearchParams({
          search_terms: searchTerm,
          search_simple: '1',
          action: 'process',
          json: '1',
          page_size: '8',
          fields: 'code,product_name,brands,nutriments,serving_quantity',
        })
        const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Food search failed')
        const result = await response.json()
        const products = (result.products || []).filter(product => product.product_name && product.nutriments)
        setFoodResults(products)
        setFoodSearchStatus(products.length ? '' : 'No matching foods found. You can enter the values manually.')
      } catch (error) {
        if (error.name !== 'AbortError') {
          setFoodResults([])
          setFoodSearchStatus('Food lookup unavailable. Enter the values manually.')
        }
      }
    }, 350)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [food, selectedFood])

  function applyFood(product, grams = servingGrams) {
    const per100g = nutritionPer100g(product)
    const multiplier = Math.max(0, numberOrZero(grams)) / 100
    setSelectedFood({ name: product.product_name, per100g })
    setFood(product.product_name)
    setCalories(String(Math.round(per100g.calories * multiplier)))
    setProtein(String(Math.round(per100g.protein * multiplier * 10) / 10))
    setCarbs(String(Math.round(per100g.carbs * multiplier * 10) / 10))
    setFat(String(Math.round(per100g.fat * multiplier * 10) / 10))
    setFoodResults([])
    setFoodSearchStatus('Nutrition loaded from Open Food Facts. Check the serving size before adding it.')
  }

  function applySavedFood(savedFood) {
    setServingGrams(String(savedFood.serving))
    applyFood({
      product_name: savedFood.name,
      nutriments: {
        'energy-kcal_100g': savedFood.calories / savedFood.serving * 100,
        proteins_100g: savedFood.protein / savedFood.serving * 100,
        carbohydrates_100g: savedFood.carbs / savedFood.serving * 100,
        fat_100g: savedFood.fat / savedFood.serving * 100,
      },
    }, savedFood.serving)
    setFoodSearchStatus('Saved food loaded. Adjust the serving size before adding it.')
  }

  function changeServingSize(value) {
    setServingGrams(value)
    if (selectedFood) applyFood({ product_name: selectedFood.name, nutriments: {
      'energy-kcal_100g': selectedFood.per100g.calories,
      proteins_100g: selectedFood.per100g.protein,
      carbohydrates_100g: selectedFood.per100g.carbs,
      fat_100g: selectedFood.per100g.fat,
    } }, value)
  }

  function saveNutrition(nextEntries = entries, nextPlan = plan) {
    setEntries(nextEntries)
    setPlan(nextPlan)
    onSave({ nutrition: nextPlan.trim(), nutritionEntries: nextEntries })
    setSaved(true)
  }

  function addFood(event) {
    event.preventDefault()
    const calorieValue = Number(calories)
    const proteinValue = Number(protein) || 0
    const carbsValue = Number(carbs) || 0
    const fatValue = Number(fat) || 0
    if (!food.trim() || !Number.isFinite(calorieValue) || calorieValue < 0 || proteinValue < 0 || carbsValue < 0 || fatValue < 0) return
    const nextEntries = [...entries, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, date: entryDate, meal, food: food.trim(), calories: Math.round(calorieValue), protein: proteinValue, carbs: carbsValue, fat: fatValue }]
    saveNutrition(nextEntries)
    setFood('')
    setCalories('')
    setProtein('')
    setCarbs('')
    setFat('')
    setServingGrams('100')
    setSelectedFood(null)
    setFoodSearchStatus('')
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
      <div className="macro-chart" role="img" aria-label={`Daily macros: ${Math.round(macroTotals.protein)} grams protein, ${Math.round(macroTotals.carbs)} grams carbohydrates, ${Math.round(macroTotals.fat)} grams fat`}>
        <h4>Daily macros</h4>
        {[
          ['Protein', macroTotals.protein, 'macro-protein'],
          ['Carbs', macroTotals.carbs, 'macro-carbs'],
          ['Fat', macroTotals.fat, 'macro-fat'],
        ].map(([label, value, className]) => (
          <div className="macro-row" key={label}>
            <span>{label}</span>
            <div className="macro-track"><div className={`macro-fill ${className}`} style={{ width: `${Math.max(value ? 4 : 0, Math.round(value / largestMacro * 100))}%` }} /></div>
            <strong>{Math.round(value)}g</strong>
          </div>
        ))}
      </div>
      <div className="saved-foods">
        <div className="saved-foods-heading">
          <h4>Saved foods</h4>
          <span>Quick picks use the standard serving shown.</span>
        </div>
        <div className="saved-food-grid">
          {SAVED_FOODS.map(savedFood => (
            <button type="button" key={savedFood.name} className="saved-food-button" onClick={() => applySavedFood(savedFood)}>
              <strong>{savedFood.name}</strong>
              <span>{savedFood.serving}g · {savedFood.calories} cal</span>
            </button>
          ))}
        </div>
      </div>
      <form onSubmit={addFood} className="profile-form nutrition-entry-form">
        <h4>Log a food item</h4>
        <div className="nutrition-inputs">
          <label>Date<input type="date" value={entryDate} onChange={event => setEntryDate(event.target.value)} required /></label>
          <label>Meal<select value={meal} onChange={event => setMeal(event.target.value)}><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option></select></label>
          <label className="food-search-label">Food item
            <input value={food} onChange={event => { setFood(event.target.value); setSelectedFood(null); setFoodResults([]); setFoodSearchStatus('') }} placeholder="e.g. Greek yogurt" autoComplete="off" required />
            {foodResults.length > 0 && <div className="food-results" role="listbox" aria-label="Food search results">
              {foodResults.map(product => <button type="button" key={product.code || product.product_name} role="option" onClick={() => { setServingGrams(String(product.serving_quantity || 100)); applyFood(product, product.serving_quantity || 100) }}>
                <strong>{product.product_name}</strong><span>{product.brands || 'Open Food Facts'} · per 100g: {Math.round(nutritionPer100g(product).calories)} cal</span>
              </button>)}
            </div>}
            {foodSearchStatus && <small className="food-search-status">{foodSearchStatus}</small>}
          </label>
          <label>Serving size (g)<input type="number" min="0" step="1" value={servingGrams} onChange={event => changeServingSize(event.target.value)} /></label>
          <label>Calories<input type="number" min="0" step="1" value={calories} onChange={event => setCalories(event.target.value)} placeholder="e.g. 180" required /></label>
          <label>Protein (g)<input type="number" min="0" step="0.1" value={protein} onChange={event => setProtein(event.target.value)} placeholder="e.g. 17" /></label>
          <label>Carbs (g)<input type="number" min="0" step="0.1" value={carbs} onChange={event => setCarbs(event.target.value)} placeholder="e.g. 8" /></label>
          <label>Fat (g)<input type="number" min="0" step="0.1" value={fat} onChange={event => setFat(event.target.value)} placeholder="e.g. 4" /></label>
        </div>
        <button className="main-button" type="submit">Add food item</button>
      </form>
      <div className="nutrition-list" aria-live="polite">
        {todaysEntries.length === 0 ? <p className="empty-message">No food items logged for this date.</p> : todaysEntries.map(entry => (
          <div className="nutrition-item" key={entry.id}>
            <div><strong>{entry.food}</strong><span>{entry.meal} · {entry.protein}g protein · {entry.carbs}g carbs · {entry.fat}g fat</span></div>
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
