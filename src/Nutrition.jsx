import { useEffect, useMemo, useState } from 'react'
import { localFoods } from './dunkinFoods'
import { loadUsdaFoods, searchFoods, servingOptions } from './foodSearch'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function numberOrZero(value) {
  return Number.isFinite(Number(value)) ? Number(value) : 0
}

function nutritionPer100g(product) {
  const nutrients = product.nutriments || {}
  return {
    calories: numberOrZero(nutrients['energy-kcal_100g'] ?? (nutrients.energy_100g / 4.184)),
    protein: numberOrZero(nutrients.proteins_100g),
    carbs: numberOrZero(nutrients.carbohydrates_100g),
    fat: numberOrZero(nutrients.fat_100g),
  }
}

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
  const [servings, setServings] = useState('1')
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

    let localResults = searchFoods(localFoods, searchTerm)
    const controller = new AbortController()
    let active = true
    let networkTimeout
    const timeout = setTimeout(async () => {
      setFoodResults(localResults)
      setFoodSearchStatus('Searching foods...')
      let catalogUnavailable = false
      try {
        const usdaFoods = await loadUsdaFoods()
        if (!active) return
        localResults = searchFoods([...localFoods, ...usdaFoods], searchTerm)
        setFoodResults(localResults)
        setFoodSearchStatus(localResults.length ? '' : 'Searching packaged foods...')
      } catch {
        catalogUnavailable = true
      }
      if (!active) return
      networkTimeout = setTimeout(() => controller.abort(), 8000)
      try {
        const params = new URLSearchParams({
          search_terms: searchTerm,
          search_simple: '1',
          action: 'process',
          json: '1',
          page_size: '8',
          fields: 'code,product_name,brands,nutriments,serving_quantity,serving_size',
        })
        const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?${params}`, { signal: controller.signal })
        if (!response.ok) throw new Error('Food search failed')
        const result = await response.json()
        if (!active) return
        const products = (result.products || []).filter(product => product.product_name && product.nutriments)
        const localCodes = new Set(localResults.map(product => product.code))
        const mergedProducts = [...localResults, ...products.filter(product => !localCodes.has(product.code))]
        setFoodResults(mergedProducts)
        setFoodSearchStatus(mergedProducts.length ? '' : 'No matching foods found. You can enter the values manually.')
      } catch {
        if (active) {
          setFoodResults(localResults)
          setFoodSearchStatus(localResults.length ? '' : (catalogUnavailable ? 'Food catalogs unavailable. Retry your search or enter values manually.' : 'No local matches. Packaged-food lookup is unavailable; try another name or enter values manually.'))
        }
      } finally {
        clearTimeout(networkTimeout)
      }
    }, 250)

    return () => {
      active = false
      clearTimeout(networkTimeout)
      clearTimeout(timeout)
      controller.abort()
    }
  }, [food, selectedFood])

  function applyFood(product, count = servings, portion = servingOptions(product)[0]) {
    const per100g = nutritionPer100g(product)
    const multiplier = Math.max(0, numberOrZero(count)) * portion.grams / 100
    setSelectedFood({ name: product.product_name, per100g, product, portion })
    setFood(product.product_name)
    setCalories(String(Math.round(per100g.calories * multiplier)))
    setProtein(String(Math.round(per100g.protein * multiplier * 10) / 10))
    setCarbs(String(Math.round(per100g.carbs * multiplier * 10) / 10))
    setFat(String(Math.round(per100g.fat * multiplier * 10) / 10))
    setFoodResults([])
    const source = product.source || (localFoods.some(food => food.code === product.code) ? 'the local food catalog' : 'Open Food Facts')
    setFoodSearchStatus(`Nutrition loaded from ${source}. Check the serving size before adding it.`)

  }

  function changeServingSize(value) {
    setServings(value)
    if (selectedFood) applyFood(selectedFood.product, value, selectedFood.portion)
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
    if (!Number.isFinite(Number(servings)) || Number(servings) <= 0 || !food.trim() || !Number.isFinite(calorieValue) || calorieValue < 0 || proteinValue < 0 || carbsValue < 0 || fatValue < 0) return
    const nextEntries = [...entries, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, date: entryDate, meal, servings: Number(servings), servingLabel: selectedFood?.portion.label || null, food: food.trim(), calories: Math.round(calorieValue), protein: proteinValue, carbs: carbsValue, fat: fatValue }]
    saveNutrition(nextEntries)
    setFood('')
    setCalories('')
    setProtein('')
    setCarbs('')
    setFat('')
    setServings('1')
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
      <form onSubmit={addFood} className="profile-form nutrition-entry-form">
        <h4>Log a food item</h4>
        <div className="nutrition-inputs">
          <label>Date<input type="date" value={entryDate} onChange={event => setEntryDate(event.target.value)} required /></label>
          <label>Meal<select value={meal} onChange={event => setMeal(event.target.value)}><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option></select></label>
          <label className="food-search-label">Food item
            <input value={food} onChange={event => { setFood(event.target.value); setSelectedFood(null); setFoodResults([]); setFoodSearchStatus('') }} placeholder="e.g. steak, chicken breast, Greek yogurt" autoComplete="off" required />
            {foodResults.length > 0 && <div className="food-results" role="listbox" aria-label="Food search results">
              {foodResults.map(product => <button type="button" key={product.code || product.product_name} role="option" onClick={() => { setServings('1'); applyFood(product, '1') }}>
                <strong>{product.product_name}</strong><span>{product.brands || product.source || 'Open Food Facts'} · per 100g: {Math.round(nutritionPer100g(product).calories)} cal</span>
              </button>)}
            </div>}
            {foodSearchStatus && <small className="food-search-status">{foodSearchStatus}</small>}
          </label>
          <label>Servings<input type="number" min="0.01" step="any" value={servings} onChange={event => changeServingSize(event.target.value)} required /><small>{selectedFood ? 'Use 0.5 for half a serving or 2 for two servings.' : 'For manual foods, enter nutrition totals for the servings eaten.'}</small></label>
          {selectedFood && <label>Serving size<select value={servingOptions(selectedFood.product).findIndex(portion => portion.label === selectedFood.portion.label && portion.grams === selectedFood.portion.grams)} onChange={event => applyFood(selectedFood.product, servings, servingOptions(selectedFood.product)[Number(event.target.value)])}>
            {servingOptions(selectedFood.product).map((portion, index) => <option key={index} value={index}>{portion.label}</option>)}
          </select></label>}
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
