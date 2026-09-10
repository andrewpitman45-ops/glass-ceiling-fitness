export const STORAGE_KEY = 'glass-ceiling-fitness.profiles.v1'

export function readProfiles(storage) {
  try {
    const profiles = JSON.parse((storage || window.localStorage).getItem(STORAGE_KEY) || '[]')
    if (!Array.isArray(profiles)) return []
    return profiles.filter(profile => profile && typeof profile.id === 'string' &&
      typeof profile.name === 'string' && typeof profile.goal === 'string').map(profile => ({
        ...profile,
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
