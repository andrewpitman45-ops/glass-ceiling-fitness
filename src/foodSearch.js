export function normalizeSearch(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
}

export function searchFoods(products, query, limit = 12) {
  const term = normalizeSearch(query)
  if (!term) return []
  const singular = word => word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word
  const words = term.split(' ').map(singular)
  return products.map(product => {
    const name = normalizeSearch(product.product_name)
    const text = `${name} ${normalizeSearch(product.brands || '')}`.split(' ').map(singular).join(' ')
    if (!words.every(word => text.includes(word))) return null
    const tokens = name.split(' ').map(singular)
    const mainFood = normalizeSearch(product.product_name.split(',')[0]).split(' ').map(singular).join(' ')
    const primaryMatch = mainFood === words.join(' ') || (words.join(' ') === 'steak' && mainFood === 'beef steak')
    const score = (primaryMatch ? 40 : 0) + (name === term ? 100 : 0) + (name.startsWith(term) ? 20 : 0)
      + words.filter(word => tokens.includes(word)).length * 5
      + (product.dataType === 'survey_fndds_food' ? 3 : 0)
    return { product, score }
  }).filter(Boolean).sort((a, b) => b.score - a.score
    || a.product.product_name.length - b.product.product_name.length
    || a.product.product_name.localeCompare(b.product.product_name)).slice(0, limit).map(item => item.product)
}

export function decodeUsda(rows) {
  return rows.map(([id, name, calories, protein, carbs, fat, dataType]) => ({
    code: `usda-${id}`, product_name: name, source: 'USDA FoodData Central', dataType,
    serving_quantity: 100,
    nutriments: { 'energy-kcal_100g': calories, proteins_100g: protein, carbohydrates_100g: carbs, fat_100g: fat },
  }))
}

let catalogPromise
export function loadUsdaFoods() {
  if (!catalogPromise) {
    catalogPromise = fetch(`${import.meta.env.BASE_URL}data/usda-foods.json`)
      .then(response => {
        if (!response.ok) throw new Error('USDA catalog unavailable')
        return response.json()
      }).then(decodeUsda).catch(error => { catalogPromise = undefined; throw error })
  }
  return catalogPromise
}
