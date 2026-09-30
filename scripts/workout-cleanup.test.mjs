import assert from 'node:assert/strict'
import { cleanWorkoutProfile, parseWorkoutPlanText } from '../src/workoutPlan.js'

const original = {
  weeklyWorkouts: { monday: [{ name: 'Push-ups??', session: 'Morning', prescription: '3×15', dayTitle: 'Push? day' }] },
  completed: ['Morning|Push-ups??'], nutrition: 'Keep this?', sessions: 12,
}
const cleaned = cleanWorkoutProfile(original)
assert.equal(cleaned.weeklyWorkouts.monday[0].name, 'Push-ups')
assert.equal(cleaned.weeklyWorkouts.monday[0].dayTitle, 'Push day')
assert.equal(cleaned.weeklyWorkouts.monday[0].prescription, '3×15')
assert.deepEqual(cleaned.completed, ['Morning|Push-ups'])
assert.equal(cleaned.nutrition, 'Keep this?')
assert.equal(original.weeklyWorkouts.monday[0].name, 'Push-ups??')
assert.deepEqual(cleanWorkoutProfile(cleaned), cleaned)
const imported = parseWorkoutPlanText('Monday — Push?\n- Dip machine??: 4×12–20\n- ???: 3×10')
assert.equal(imported.monday.length, 1)
assert.equal(imported.monday[0].name, 'Dip machine')
assert.equal(imported.monday[0].prescription, '4×12–20')
assert.equal(imported.monday[0].dayTitle, 'Push')
console.log('Workout cleanup checks passed.')
