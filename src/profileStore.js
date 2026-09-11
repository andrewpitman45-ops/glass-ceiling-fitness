export const STORAGE_KEY = 'glass-ceiling-fitness.profiles.v1'

export function readProfiles(storage) {
  try {
    const profiles = JSON.parse((storage || window.localStorage).getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(profiles)) return []
    return profiles.filter(profile => profile && typeof profile.id === 'string' &&
      typeof profile.name === 'string' && typeof profile.goal === 'string').map(profile => ({
        ...profile,
        clientType: profile.clientType === 'youre-with-us' ? 'youre-with-us' : 'independent',
        nutrition: typeof profile.nutrition === 'string' ? profile.nutrition : '',
        nutritionEntries: Array.isArray(profile.nutritionEntries) ? profile.nutritionEntries.filter(entry => entry && typeof entry.id === 'string' && typeof entry.date === 'string' && typeof entry.food === 'string' && Number.isFinite(entry.calories)).map(entry => ({
          id: entry.id,
          date: entry.date,
          meal: typeof entry.meal === 'string' ? entry.meal : 'Snack',
          food: entry.food,
          calories: Math.max(0, Math.round(entry.calories)),
        })) : [],
        caloriesBurned: Array.isArray(profile.caloriesBurned) ? profile.caloriesBurned.filter(entry => entry && typeof entry.id === 'string' && typeof entry.date === 'string' && typeof entry.activity === 'string' && Number.isFinite(entry.calories)).map(entry => ({
          id: entry.id,
          date: entry.date,
          activity: entry.activity,
          calories: Math.max(0, Math.round(entry.calories)),
        })) : [],
        workout: Array.isArray(profile.workout) ? profile.workout.filter(item => item && typeof item.name === 'string') : [],
        completed: Array.isArray(profile.completed) ? profile.completed.filter(item => typeof item === 'string') : [],
        sessions: Number.isInteger(profile.sessions) && profile.sessions >= 0 ? profile.sessions : 0,
      }))
  } catch {
    return []
  }
}

export function saveProfiles(storage, profiles) {
  storage.setItem(STORAGE_KEY, JSON.stringify(profiles))
}
