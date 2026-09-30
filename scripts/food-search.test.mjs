import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { decodeUsda, searchFoods } from '../src/foodSearch.js'
const foods = decodeUsda(JSON.parse(readFileSync(new URL('../public/data/usda-foods.json', import.meta.url))))
test('everyday foods search the imported USDA catalog', () => {
  for (const query of ['steak', 'chicken breast', 'eggs', 'rice', 'banana', 'salmon']) {
    assert.ok(searchFoods(foods, query).length > 0, query)
  }
  assert.match(searchFoods(foods, 'steak')[0].product_name, /^(Beef steak|Steak),/i)
  assert.match(searchFoods(foods, 'rice')[0].product_name, /^Rice,/i)
})
test('search ignores case, punctuation, and accents and requires every word', () => {
  assert.deepEqual(searchFoods(foods, 'CHICKEN, breast'), searchFoods(foods, 'chicken breast'))
  assert.deepEqual(searchFoods(foods, 'stéak'), searchFoods(foods, 'steak'))
  assert.deepEqual(searchFoods(foods, 'steak zzzzzzz'), [])
  assert.deepEqual(searchFoods(foods, '---'), [])
})
test('all imported foods contain finite nonnegative macros and unique identifiers', () => {
  assert.equal(new Set(foods.map(food => food.code)).size, foods.length)
  for (const food of foods) for (const amount of Object.values(food.nutriments)) {
    assert.ok(Number.isFinite(amount) && amount >= 0)
  }
})
test('USDA column decoding preserves per-100g nutrient units and zero carbohydrate', () => {
  const [food] = decodeUsda([['123', 'Example steak', 200, 25, 0, 10, 'sr_legacy_food']])
  assert.equal(food.nutriments['energy-kcal_100g'], 200)
  assert.equal(food.nutriments.proteins_100g, 25)
  assert.equal(food.nutriments.carbohydrates_100g, 0)
  assert.equal(food.nutriments.fat_100g, 10)
  assert.equal(food.serving_quantity, 100)
})
