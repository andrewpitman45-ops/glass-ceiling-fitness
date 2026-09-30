import { readFile, writeFile } from 'node:fs/promises'
import { parseRow } from './csv.mjs'
const directory = process.argv[2] || '.fdc-import'
const readRows = async name => (await readFile(`${directory}/${name}.csv`, 'utf8')).trim().split(/\r?\n/).slice(1).map(parseRow)
const units = new Map((await readRows('measure_unit')).map(row => [row[0], row[1]]))
const portions = new Map()
for (const row of await readRows('food_portion')) {
  const weight = Number(row[7])
  if (!Number.isFinite(weight) || weight <= 0) continue
  const unit = units.get(row[4])
  const amount = Number(row[3]) || 1
  const label = row[5] || [amount, unit && !['undetermined', 'unknown'].includes(unit) ? unit : '', row[6]].filter(Boolean).join(' ')
  if (!label || label === '1') continue
  const options = portions.get(row[1]) || []
  if (!options.some(option => option.label === label && option.grams === weight)) options.push({ label, grams: weight })
  portions.set(row[1], options)
}
const file = 'public/data/usda-foods.json'
const foods = JSON.parse(await readFile(file, 'utf8'))
for (const row of foods) row[7] = portions.get(row[0]) || []
await writeFile(file, JSON.stringify(foods))
console.log(`Added portions to ${foods.filter(row => row[7].length).length} foods`)
