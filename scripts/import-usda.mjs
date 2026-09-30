import { createReadStream } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createInterface } from 'node:readline'

// USDA CSV quotes embedded commas, quotes and occasionally line breaks.
export function parseRow(line) {
  const fields = []; let value = ''; let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (quoted && line[i + 1] === '"') { value += '"'; i++ }
      else quoted = !quoted
    } else if (c === ',' && !quoted) { fields.push(value); value = '' }
    else value += c
  }
  if (quoted) return null
  fields.push(value)
  return fields
}
async function* rows(path) {
  const lines = createInterface({ input: createReadStream(path), crlfDelay: Infinity })
  let pending = ''; let header = true
  for await (const line of lines) {
    pending += (pending ? '\n' : '') + line
    const row = parseRow(pending)
    if (!row) continue
    pending = ''
    if (header) { header = false; continue }
    yield row
  }
  if (pending) throw new Error(`Incomplete CSV record in ${path}`)
}
const directory = resolve(process.argv[2] || '.fdc-import')
const foods = new Map()
const types = new Set(['foundation_food', 'sr_legacy_food', 'survey_fndds_food'])
for await (const row of rows(resolve(directory, 'food.csv'))) {
  if (types.has(row[1])) foods.set(row[0], { id: row[0], name: row[2], type: row[1], nutrients: {} })
}
console.log(`Reading nutrients for ${foods.size} everyday foods...`)
const ids = new Set(['1008', '2047', '2048', '1003', '1004', '1005'])
for await (const row of rows(resolve(directory, 'food_nutrient.csv'))) {
  if (!ids.has(row[2])) continue
  const food = foods.get(row[1])
  if (food && row[3] !== '' && Number.isFinite(Number(row[3])) && Number(row[3]) >= 0) food.nutrients[row[2]] = Number(row[3])
}
const products = []; let skipped = 0
for (const food of foods.values()) {
  const n = food.nutrients
  const energy = n['2048'] ?? n['1008'] ?? n['2047']
  // Missing nutrient values are unknown, never silently zero-filled.
  if ([energy, n['1003'], n['1004'], n['1005']].some(value => value === undefined)) { skipped++; continue }
  products.push([food.id, food.name, energy, n['1003'], n['1005'], n['1004'], food.type])
}
products.sort((a, b) => Number(a[0]) - Number(b[0]))
await mkdir('public/data', { recursive: true })
await writeFile('public/data/usda-foods.json', JSON.stringify(products))
await writeFile('public/data/usda-import.json', JSON.stringify({ source: 'FoodData_Central_csv_2026-04-30', includedTypes: [...types], imported: products.length, skippedMissingMacros: skipped }, null, 2) + '\n')
console.log(`Imported ${products.length} foods; skipped ${skipped} with incomplete calories/macros.`)
