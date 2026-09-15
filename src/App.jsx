import { useRef, useState } from 'react'
import './App.css'
import Brand from './Brand'
import CaloriesBurned from './CaloriesBurned'
import Nutrition from './Nutrition'
import WeightTracker from './WeightTracker'
import { ProfileForm } from './Profiles'
import { supabase } from './supabase'

const exerciseLibrary = {
  Cardio: [
    'Treadmill Walking',
    'Incline Treadmill Walking',
    'Easy Recovery Walking',
  ],

  Chest: [
    'Dumbbell Bench Press',
    'Incline Dumbbell Press',
    'Push-ups',
  ],

  Back: [
    'Dumbbell Rows',
    'One-Arm Dumbbell Rows',
    'Pull-ups',
    'Dumbbell Pullovers',
  ],

  Shoulders: [
    'Dumbbell Shoulder Press',
    'Dumbbell Lateral Raises',
    'Dumbbell Reverse Flies',
  ],

  Biceps: [
    'Dumbbell Bicep Curls',
    'Hammer Curls',
  ],

  Triceps: [
    'Overhead Triceps Extensions',
    'Push-ups',
    'Bench Press',
    'Incline Press',
  ],

  'Quadriceps / Front of Legs': [
    'Leg Press',
    'Leg Extension',
    'Bulgarian Split Squats',
    'Reverse Lunges',
    'Goblet Squats',
  ],

  'Hamstrings / Glutes': [
    'Seated Leg Curl',
    'Romanian Deadlifts',
    'Bulgarian Split Squats',
    'Reverse Lunges',
  ],

  Hips: [
    'Hip Abductor',
    'Hip Adductor',
  ],

  Calves: [
    'Calf Raise Machine',
    'Standing Dumbbell Calf Raises',
  ],

  'Core / Abs': [
    'Reverse Crunches',
    'Hanging Leg Raises',
    'Flutter Kicks',
    'Weighted Sit-ups',
    'Plank',
    'Side Plank',
    'Dumbbell Suitcase Hold',
  ],

  'Recovery / Mobility': [
    'Easy Walking',
    'Light Stretching',
    'Complete Rest Day',
  ],
}

const workoutMetDatabase = {
  'Dumbbell Bench Press': 5,
  'Incline Dumbbell Press': 5,
  'Push-ups': 3.8,
  'Dumbbell Rows': 5,
  'One-Arm Dumbbell Rows': 5,
  'Pull-ups': 8,
  'Dumbbell Pullovers': 5,
  'Dumbbell Shoulder Press': 5,
  'Dumbbell Lateral Raises': 3.5,
  'Dumbbell Reverse Flies': 3.5,
  'Dumbbell Bicep Curls': 3.5,
  'Hammer Curls': 3.5,
  'Overhead Triceps Extensions': 3.5,
  'Bench Press': 5,
  'Incline Press': 5,
  'Leg Press': 5,
  'Leg Extension': 3.5,
  'Bulgarian Split Squats': 5,
  'Reverse Lunges': 5,
  'Goblet Squats': 5,
  'Seated Leg Curl': 3.5,
  'Romanian Deadlifts': 5,
  'Hip Abductor': 3.5,
  'Hip Adductor': 3.5,
  'Calf Raise Machine': 3.5,
  'Standing Dumbbell Calf Raises': 3.5,
  'Reverse Crunches': 3.8,
  'Hanging Leg Raises': 3.8,
  'Weighted Sit-ups': 3.8,
  'Plank': 3.8,
  'Side Plank': 3.8,
  'Dumbbell Suitcase Hold': 3.5,
  'Flutter Kicks': 3.8,
}

function estimateCalories(exercise, bodyWeight) {
  const weightInPounds = Number(bodyWeight) > 0 ? Number(bodyWeight) : 150
  if (exercise.cardio || exercise.minutes !== undefined) {
    const minutes = Number(exercise.time ?? exercise.minutes)
    const distance = Number(exercise.distance)
    const cardioMinutes = minutes > 0 ? minutes : distance > 0 ? distance * 10 : 0
    if (!Number.isFinite(cardioMinutes) || cardioMinutes <= 0) return 0
    const incline = Math.max(0, Number(exercise.incline) || 0)
    const speed = Math.max(0, Number(exercise.speed) || 0)
    const met = 3.5 + Math.min(incline, 20) * 0.15 + Math.min(speed, 12) * 0.08
    return Math.round(met * 3.5 * (weightInPounds / 2.205) / 200 * cardioMinutes)
  }
  const sets = Number(exercise.sets)
  const reps = Number(exercise.reps)
  if (!Number.isFinite(sets) || !Number.isFinite(reps) || sets <= 0 || reps <= 0) return 0

  const kilograms = weightInPounds / 2.205
  const met = workoutMetDatabase[exercise.name] || 4
  const activeMinutes = sets * (reps * 4 / 60)
  const restMinutes = Math.max(0, sets - 1)
  const totalMinutes = activeMinutes + restMinutes
  return Math.round(met * 3.5 * kilograms / 200 * totalMinutes)
}

function localDate() {
  const date = new Date()
  const offset = date.getTimezoneOffset() * 60000
  return new Date(date.getTime() - offset).toISOString().slice(0, 10)
}

function currentMonth() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function youtubeSearchUrl(exerciseName) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${exerciseName} proper form`)}`
}

function weekStart(dateString) {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const daysFromMonday = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - daysFromMonday)
  return date.toISOString().slice(0, 10)
}

function normalizeRewards(profile) {
  if (profile.rewardMonth === currentMonth()) {
    return {
      ...profile,
      monthlyWorkoutDates: Array.isArray(profile.monthlyWorkoutDates) ? profile.monthlyWorkoutDates : [],
      completedWeeks: Array.isArray(profile.completedWeeks) ? profile.completedWeeks : [],
      rewardPoints: Number.isInteger(profile.rewardPoints) ? profile.rewardPoints : 0,
    }
  }

  return {
    ...profile,
    rewardMonth: currentMonth(),
    monthlyWorkoutDates: [],
    completedWeeks: [],
    rewardPoints: 0,
  }
}

function App({ initialProfile, onSignOut }) {
  const [screen, setScreen] = useState('home')
  const [selectedDay, setSelectedDay] = useState('monday')
  const [selectedCategory, setSelectedCategory] = useState('Cardio')
  const [menuOpen, setMenuOpen] = useState(false)
  const [profile, setProfile] = useState(() => normalizeRewards(initialProfile))
  const [storageError, setStorageError] = useState('')
  const [saving, setSaving] = useState(false)
  const saveQueue = useRef(Promise.resolve())
  const latestProfile = useRef(normalizeRewards(initialProfile))
  const revision = useRef(0)
  const weeklyWorkouts = profile.weeklyWorkouts || {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
}

const workout = weeklyWorkouts[selectedDay] || []
  const completed = profile.completed || []

  function updateProfile(changes) {
    const next = { ...latestProfile.current, ...changes }
    latestProfile.current = next
    setProfile(next)
    setSaving(true)
    const currentRevision = ++revision.current
    saveQueue.current = saveQueue.current.then(async () => {
      try {
        const { data, error } = await supabase.from('member_profiles').update({ data: next }).eq('user_id', initialProfile.id).select('user_id').single()
        if (error || !data) throw error || new Error('Save failed')
        if (revision.current === currentRevision) setStorageError('')
      } catch {
        setStorageError('Your latest changes could not be saved to your account. Keep this tab open and retry.')
      } finally {
        if (revision.current === currentRevision) setSaving(false)
      }
    })
  }

  function setWorkout(next) {
    const nextWeeklyWorkouts = {
      ...weeklyWorkouts,
      [selectedDay]: next,
    }

    updateProfile({
      weeklyWorkouts: nextWeeklyWorkouts,
      completed: completed.filter(name => next.some(item => item.name === name)),
    })
  }

  function setCompleted(next) {
    updateProfile({ completed: next })
  }

  function saveDetails(details) {
    updateProfile(details)
    setScreen('home')
  }

  function signOut() {
    onSignOut()
  }

  function addExercise(name) {
    const alreadyAdded = workout.some(
      (exercise) => exercise.name === name
    )

    if (alreadyAdded) {
      return
    }

    const isCardio = name.toLowerCase().includes('treadmill') ||
      name.toLowerCase().includes('walking') ||
      name.toLowerCase().includes('stretching')
    const newExercise = {
      name,
      cardio: isCardio,
      sets: '3',
      reps: '10',
      weight: '',
      time: isCardio ? '' : undefined,
      distance: isCardio ? '' : undefined,
      speed: isCardio ? '' : undefined,
      incline: isCardio ? '' : undefined,
    }

    setWorkout([...workout, newExercise])
  }

  function removeExercise(name) {
    setWorkout(
      workout.filter((exercise) => exercise.name !== name)
    )
  }

  function updateExercise(name, field, value) {
    setWorkout(
      workout.map((exercise) =>
        exercise.name === name
          ? {
              ...exercise,
              [field]: value,
            }
          : exercise
      )
    )
  }

  function toggleComplete(name) {
    if (completed.includes(name)) {
      setCompleted(
        completed.filter((exercise) => exercise !== name)
      )
    } else {
      setCompleted([...completed, name])
    }
  }

  function finishWorkout() {
  const finishedWorkout = weeklyWorkouts[selectedDay] || []
  const workoutCalories = finishedWorkout.reduce(
    (total, exercise) => total + estimateCalories(exercise, profile.bodyWeight),
    0
  )

  const nextWeeklyWorkouts = {
    ...weeklyWorkouts,
    [selectedDay]: finishedWorkout,
  }

  const nextCaloriesBurned = [
    ...(profile.caloriesBurned || []),
    {
      id: `workout-${localDate()}-${selectedDay}-${profile.sessions + 1}`,
      date: localDate(),
      activity: `${selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)} workout`,
      calories: workoutCalories,
    },
  ]

  const workoutDate = localDate()
  const monthlyWorkoutDates = Array.from(new Set([
    ...(profile.monthlyWorkoutDates || []),
    workoutDate,
  ]))
  const completedWeeks = profile.completedWeeks || []
  const currentWeek = weekStart(workoutDate)
  const completedWorkoutsThisWeek = monthlyWorkoutDates.filter(
    date => weekStart(date) === currentWeek
  ).length
  const earnsPoint = completedWorkoutsThisWeek >= 7 && !completedWeeks.includes(currentWeek)

  updateProfile({
    weeklyWorkouts: nextWeeklyWorkouts,
    completed: [],
    sessions: profile.sessions + 1,
    caloriesBurned: nextCaloriesBurned,
    rewardMonth: currentMonth(),
    monthlyWorkoutDates,
    completedWeeks: earnsPoint ? [...completedWeeks, currentWeek] : completedWeeks,
    rewardPoints: (profile.rewardPoints || 0) + (earnsPoint ? 1 : 0),
  })

  setScreen('home')
}

  const progress =
    workout.length === 0
      ? 0
      : Math.round(
          (completed.length / workout.length) * 100
        )

  const rewardPoints = Math.max(0, profile.rewardPoints || 0)
  const rewardProgress = Math.min(rewardPoints / 4, 1)
  const monthlyWorkoutCount = (profile.monthlyWorkoutDates || []).length
  const currentWeekWorkoutCount = (profile.monthlyWorkoutDates || []).filter(
    date => weekStart(date) === weekStart(localDate())
  ).length


  const daySelector = (
    <div className="day-selector">
      {[
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday',
        'sunday',
      ].map((day) => (
        <button
          key={day}
          type="button"
          className={selectedDay === day ? 'main-button' : 'secondary-button'}
          onClick={() => {
            setSelectedDay(day)
            setCompleted([])
          }}
        >
          {day.charAt(0).toUpperCase() + day.slice(1)}
        </button>
      ))}
    </div>
  )

  const navigation = (
    <nav className="profile-nav" aria-label="Profile navigation">
      <button className="sign-out" onClick={() => setScreen('profile')}>{profile.name}</button>
      <div className="settings-menu">
        <button className="gear-button" aria-expanded={menuOpen} aria-label="Open profile settings menu" title="Profile settings" onClick={() => setMenuOpen(!menuOpen)}><span className="menu-lines" aria-hidden="true"><span></span><span></span><span></span></span></button>
        {menuOpen && (
          <div className="settings-menu-panel">
            <button className="settings-menu-item" onClick={() => { setMenuOpen(false); setScreen('home') }}>Workouts</button>
            <button className="settings-menu-item" onClick={() => { setMenuOpen(false); setScreen('weight') }}>Weight tracker</button>
            <button className="settings-menu-item" onClick={() => { setMenuOpen(false); setScreen('nutrition') }}>Nutrition</button>
            <button className="settings-menu-item" onClick={() => { setMenuOpen(false); setScreen('calories') }}>Calories burned</button>
            <button className="settings-menu-item" onClick={() => { setMenuOpen(false); setScreen('info') }}>Workout info</button>
            <button className="settings-menu-item" disabled={saving} onClick={signOut}>Sign out</button>
          </div>
        )}
      </div>
    </nav>
  )
  const notice = <>{saving && <p className="welcome" role="status">Saving changes...</p>}{storageError && <div className="storage-error" role="alert">{storageError} <button className="secondary-button" disabled={saving} onClick={() => updateProfile({})}>Retry save</button></div>}</>

  const supportedClient = profile.clientType === 'youre-with-us'

  if (screen === 'nutrition') {
    return <main className="dashboard">
      <header className="top-bar"><Brand />{navigation}</header>
      {notice}
      <section className="welcome"><p>{supportedClient ? "Your nutrition space · Through You're With Us" : 'Your personal nutrition space'}</p><h2>Your nutrition plan</h2></section>
      <Nutrition key={profile.id} profile={profile} onSave={updateProfile} />
      <div className="welcome"><button className="secondary-button" onClick={() => setScreen('home')}>Back to my dashboard</button></div>
    </main>
  }

  if (screen === 'calories') {
    return <main className="dashboard">
      <header className="top-bar"><Brand />{navigation}</header>
      {notice}
      <section className="welcome"><p>Daily activity tracking</p><h2>Calories burned</h2></section>
      <CaloriesBurned key={profile.id} profile={profile} onSave={updateProfile} />
      <div className="welcome"><button className="secondary-button" onClick={() => setScreen('home')}>Back to my dashboard</button></div>
    </main>
  }

  if (screen === 'weight') {
    return <main className="dashboard">
      <header className="top-bar"><Brand />{navigation}</header>
      {notice}
      <section className="welcome"><p>Progress tracking</p><h2>Weight tracker</h2></section>
      <WeightTracker key={profile.id} profile={profile} onSave={updateProfile} />
      <div className="welcome"><button className="secondary-button" onClick={() => setScreen('home')}>Back to my dashboard</button></div>
    </main>
  }

  if (screen === 'info') {
    return <main className="dashboard">
      <header className="top-bar"><Brand />{navigation}</header>
      {notice}
      <section className="welcome"><p>Workout guidance</p><h2>Exercise info</h2></section>
      <section className="workout-card info-card">
        <p className="small-text">Move with confidence</p>
        <h3>Learn each exercise before you begin</h3>
        <p className="profile-intro">Use the links below to search YouTube for demonstrations of each exercise, including proper form and setup. These are general educational resources; choose variations that fit your body and comfort level.</p>
        <div className="info-list">
          {Object.entries(exerciseLibrary).map(([category, exercises]) => (
            <div className="info-group" key={category}>
              <h4>{category}</h4>
              {exercises.map(exercise => (
                <a className="video-link" href={youtubeSearchUrl(exercise)} target="_blank" rel="noreferrer" key={exercise}>
                  <span>{exercise}</span>
                  <span aria-hidden="true">Watch search ↗</span>
                </a>
              ))}
            </div>
          ))}
        </div>
      </section>
      <div className="welcome"><button className="secondary-button" onClick={() => setScreen('home')}>Back to my dashboard</button></div>
    </main>
  }

  if (screen === 'home' || screen === 'profile') {
    return (
      <main className="dashboard">
        <header className="top-bar">
          <Brand />
          {navigation}
        </header>
        {notice}
        <section className="welcome"><p>{supportedClient ? "Your fitness space · Through You're With Us" : 'Your personal fitness space'}</p><h2>Welcome, {profile.name}.</h2></section>
        {screen === 'profile' ? (
          <section className="workout-card settings-card">
            <h3>Edit profile</h3>
            <ProfileForm profile={profile} onSave={saveDetails} onCancel={() => setScreen('home')} />
          </section>
        ) : (
          <>
            {daySelector}
            <div className="stats-grid">
              <section className="stat-card"><p>Workouts this month</p><h3>{monthlyWorkoutCount}</h3></section>
              <section className="stat-card"><p>Exercises in your workout</p><h3>{workout.length}</h3></section>
            </div>
            <p className="small-text selected-day-label">{selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)}</p>
            <section className="workout-card">
              <button className="main-button" onClick={() => setScreen('builder')}>{workout.length ? 'Edit Workout' : 'Log Workout'}</button>
              {workout.length > 0 && <button className="secondary-button" onClick={() => setScreen('workout')}>Resume workout</button>}
            </section>
            <section className="workout-card">
              <button className="main-button" onClick={() => setScreen('nutrition')}>{profile.nutrition || profile.nutritionEntries?.length ? 'View Food Log' : 'Log Food'}</button>
            </section>
            <section className="reward-card">
              <div className="reward-copy">
                <p className="small-text">Monthly consistency reward</p>
                <h3>{rewardPoints >= 4 ? 'Prize unlocked' : `${rewardPoints} of 4 points`}</h3>
                <p className="small-text">Complete 7 workouts in one week to earn a point. This month resets automatically at the start of a new month.</p>
                <p className="reward-week">This week: {currentWeekWorkoutCount} / 7 workouts</p>
              </div>
              <div className="reward-pie" style={{ '--reward-progress': `${rewardProgress * 360}deg` }} role="img" aria-label={`${rewardPoints} of 4 reward points earned this month`}>
                <strong>{Math.min(rewardPoints, 4)}</strong>
                <span>/ 4</span>
              </div>
            </section>
            <p className="welcome trainer-credentials">Licensed &amp; insured NASM personal trainer · Your goals. Your pace.</p>
          </>
        )}
      </main>
    )
  }

  if (screen === 'builder') {
    return (
      <div className="dashboard">

        <header className="top-bar">

          <Brand />

          {navigation}

        </header>

        {notice}
        <section className="welcome">

          <p>Workout Builder</p>

          <h2>
            Build {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)} Workout
          </h2>

        </section>

        {daySelector}

        <section className="goal-card">

          <p className="small-text">
            Exercise Library
          </p>

          <h3>
            Choose a Category
          </h3>

          <div className="category-grid">

            {Object.keys(exerciseLibrary).map(
              (category) => (
                <button
                  key={category}
                  className={
                    selectedCategory === category
                      ? 'category-button active-category'
                      : 'category-button'
                  }
                  onClick={() =>
                    setSelectedCategory(category)
                  }
                >
                  {category}
                </button>
              )
            )}

          </div>

        </section>

        <section className="workout-card">

          <p className="small-text">
            {selectedCategory}
          </p>

          <h3>
            Available Exercises
          </h3>

          {exerciseLibrary[selectedCategory].map(
            (exercise) => (
              <div
                className="exercise"
                key={exercise}
              >

                <span>
                  {exercise}
                </span>

                <a className="exercise-video-link" href={youtubeSearchUrl(exercise)} target="_blank" rel="noreferrer">YouTube</a>

                <button
                  onClick={() =>
                    addExercise(exercise)
                  }
                >
                  Add
                </button>

              </div>
            )
          )}

        </section>

        <section className="workout-card">

          <p className="small-text">
            {selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1)} Workout
          </p>

          <h3>
            Selected Exercises
          </h3>

          {workout.length === 0 && (
            <p className="empty-message">
              No exercises added yet.
            </p>
          )}

          {workout.map((exercise) => (

            <div
              className="builder-exercise"
              key={exercise.name}
            >

              <div className="builder-title">

                <strong>
                  {exercise.name}
                </strong>

                <button
                  onClick={() =>
                    removeExercise(
                      exercise.name
                    )
                  }
                >
                  Remove
                </button>

              </div>

              {exercise.cardio || exercise.minutes !== undefined ? (
                <div className="exercise-inputs cardio-inputs">
                  <label>
                    Time (min)
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={exercise.time ?? exercise.minutes ?? ''}
                      onChange={(event) => updateExercise(exercise.name, 'time', event.target.value)}
                    />
                  </label>
                  <label>
                    Speed (mph)
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={exercise.speed || ''}
                      onChange={(event) => updateExercise(exercise.name, 'speed', event.target.value)}
                    />
                  </label>
                  <label>
                    Distance (mi)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={exercise.distance || ''}
                      onChange={(event) => updateExercise(exercise.name, 'distance', event.target.value)}
                    />
                  </label>
                  <label>
                    Incline (%)
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={exercise.incline || ''}
                      onChange={(event) => updateExercise(exercise.name, 'incline', event.target.value)}
                    />
                  </label>
                </div>
              ) : (
                <div className="exercise-inputs">

                <label>
                  Sets

                  <input
                    type="number"
                    min="1"
                    value={exercise.sets || ''}
                    onChange={(event) =>
                      updateExercise(
                        exercise.name,
                        'sets',
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Reps

                  <input
                    type="number"
                    min="1"
                    value={exercise.reps || ''}
                    onChange={(event) =>
                      updateExercise(
                        exercise.name,
                        'reps',
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Weight (lb)

                  <input
                    type="number"
                    min="0"
                    placeholder="bodyweight"
                    value={exercise.weight || ''}
                    onChange={(event) =>
                      updateExercise(
                        exercise.name,
                        'weight',
                        event.target.value
                      )
                    }
                  />
                </label>
                </div>
              )}

              <p className="calorie-estimate">
                Estimated calories: {estimateCalories(exercise, profile.bodyWeight)}
              </p>

            </div>
          ))}

          {workout.length > 0 && (

            <button
              className="main-button"
              onClick={() =>
                setScreen('workout')
              }
            >
              Start Workout
            </button>

          )}

        </section>

      </div>
    )
  }

  if (screen === 'workout') {
    return (
      <div className="dashboard">

        <header className="top-bar">

          <Brand />

          {navigation}
        </header>
        {notice}

        <section className="welcome">

          <p>
            Today's Workout
          </p>

          <h2>
            Move at Your Pace
          </h2>

        </section>

        {daySelector}

        <section className="goal-card">

          <div className="goal-header">

            <div>
              <p className="small-text">
                Workout Progress
              </p>

              <h3>
                {progress}% Complete
              </h3>
            </div>

            <strong>
              {completed.length} / {workout.length}
            </strong>

          </div>

          <div className="progress-track">

            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

        </section>

        <section className="workout-card">

          {workout.map((exercise) => {

            const isDone =
              completed.includes(
                exercise.name
              )

            return (
              <div
                className="active-workout-card"
                key={exercise.name}
              >

                <h3>
                  {exercise.name}
                </h3>

                <a className="exercise-video-link" href={youtubeSearchUrl(exercise.name)} target="_blank" rel="noreferrer">Find a video on YouTube ↗</a>

                {exercise.cardio || exercise.minutes !== undefined ? (
                  <p>
                    {exercise.time || exercise.minutes ? `${exercise.time || exercise.minutes} minutes` : 'Time not set'}
                    {exercise.speed && ` · ${exercise.speed} mph`}
                    {exercise.incline && ` · Incline ${exercise.incline}%`}
                    {exercise.distance && ` · ${exercise.distance} mi`}
                  </p>
                ) : (
                  <p>
                    {exercise.sets || 0} sets × {exercise.reps || 0} reps
                    {exercise.weight && ` · ${exercise.weight} lbs`}
                  </p>
                )}

                <p className="calorie-estimate">
                  Estimated calories: {estimateCalories(exercise, profile.bodyWeight)}
                </p>

                <button
                  className={
                    isDone
                      ? 'complete-button completed-button'
                      : 'complete-button'
                  }
                  onClick={() =>
                    toggleComplete(
                      exercise.name
                    )
                  }
                >
                  {isDone
                    ? 'Completed ✓'
                    : 'Complete Exercise'}
                </button>

              </div>
            )
          })}

          {completed.length === workout.length &&
            workout.length > 0 && (

              <button
                className="main-button"
                onClick={finishWorkout}
              >
                Finish Workout
              </button>

            )}

        </section>

      </div>
    )
  }

  return null
}

export default App
