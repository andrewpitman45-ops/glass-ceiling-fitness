export const cleanWorkoutName = name => name.replace(/[?？]/g, '').replace(/\s+/g, ' ').trim()

export function cleanWorkoutProfile(profile) {
  const cleanItems = items => items.map(item => ({ ...item, name: cleanWorkoutName(item.name), ...(item.dayTitle ? { dayTitle: cleanWorkoutName(item.dayTitle) } : {}) }))
  return {
    ...profile,
    ...(profile.workout ? { workout: cleanItems(profile.workout) } : {}),
    weeklyWorkouts: Object.fromEntries(Object.entries(profile.weeklyWorkouts || {}).map(([day, items]) => [day, cleanItems(items)])),
    completed: (profile.completed || []).map(key => {
      const split = key.lastIndexOf('|')
      return split < 0 ? cleanWorkoutName(key) : key.slice(0, split + 1) + cleanWorkoutName(key.slice(split + 1))
    }),
  }
}

const days = 'monday|tuesday|wednesday|thursday|friday|saturday|sunday|extra'

// Keep the original prescription: ranges, seconds, sides and circuit notes
// cannot safely be reduced to a single repetitions field.
export function parseWorkoutPlanText(text, defaultDay = 'monday') {
  const plan = {}
  let day = defaultDay
  let session = ''
  let title = ''
  let circuit = ''
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim().replace(/^#+\s*/, '').replace(/^[-•]\s*/, '').replace(/\*\*/g, '').trim()
    if (!line) continue
    const heading = line.match(new RegExp(`^(${days})\\b(?:\\s*[—–-]\\s*(.*))?$`, 'i'))
    if (heading) {
      day = heading[1].toLowerCase()
      title = cleanWorkoutName(heading[2] || '')
      session = ''
      circuit = ''
      continue
    }
    if (/^(before work|after work|morning|evening)\b/i.test(line)) {
      session = line
      circuit = ''
      continue
    }
    if (/^complete\s+\d+\s+rounds/i.test(line)) {
      circuit = line.replace(/:$/, '')
      continue
    }
    const instruction = /^(rest\b|finish\b|focus on\b)/i.test(line)
    if (instruction && plan[day]?.length) {
      plan[day].at(-1).notes = [plan[day].at(-1).notes, line].filter(Boolean).join('\n')
      continue
    }
    const split = line.indexOf(':')
    const legacy = line.match(/^(.+?)\s+(\d+.*(?:[×x]|minutes?).*)$/i)
    const name = cleanWorkoutName(split >= 0 ? line.slice(0, split).trim() : legacy ? legacy[1] : line)
    const prescription = split >= 0 ? line.slice(split + 1).trim() : legacy ? legacy[2] : line
    if (!name) continue
    const item = { name, prescription, session, dayTitle: title, notes: circuit, sets: '', reps: '', weight: '' }
    plan[day] ||= []
    plan[day].push(item)
  }
  return plan
}

export function mergeWorkoutPlan(existing, incoming) {
  const result = { ...existing }
  for (const [day, exercises] of Object.entries(incoming)) {
    const merged = [...(result[day] || [])]
    for (const exercise of exercises) {
      if (!merged.some(item => item.name === exercise.name && (item.session || '') === (exercise.session || ''))) merged.push(exercise)
    }
    result[day] = merged
  }
  return result
}

