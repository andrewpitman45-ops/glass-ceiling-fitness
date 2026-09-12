import { useRef, useState } from 'react'
import './App.css'
import Brand from './Brand'
import CaloriesBurned from './CaloriesBurned'
import Nutrition from './Nutrition'
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

const exerciseMetValues = {
  'Treadmill Walking': 3.5,
  'Incline Treadmill Walking': 5,
  'Easy Recovery Walking': 2.8,
  'Easy Walking': 2.8,
  'Light Stretching': 2.3,
  'Complete Rest Day': 1.2,
  'Push-ups': 8,
  Plank: 3.5,
  'Side Plank': 3.5,
}

function estimateCalories(exercise, bodyWeight) {
  const weightInPounds = Number(bodyWeight) > 0 ? Number(bodyWeight) : 150
  const minutes = Number(exercise.minutes || exercise.duration || 0)
  const met = exerciseMetValues[exercise.name] || 5
  if (minutes <= 0) return 0
  return Math.round(met * 3.5 * (weightInPounds / 2.205) / 200 * minutes)
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

    const isCardio =
      name.includes('Walking') ||
      name === 'Easy Walking'

    const newExercise = {
      name,
      sets: isCardio ? '' : '3',
      reps: isCardio ? '' : '10',
      weight: '',
      minutes: isCardio ? '10' : '',
      duration: isCardio ? '' : '30',
      speed: '',
      incline: '',
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
      <button className="sign-out" onClick={() => setScreen('home')}>{profile.name}</button>
      <button className="sign-out" onClick={() => setScreen('nutrition')}>Nutrition</button>
      <button className="sign-out" onClick={() => setScreen('calories')}>Calories burned</button>
      <button className="sign-out" disabled={saving} onClick={signOut}>Sign out</button>
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
          <section className="workout-card">
            <h3>Edit profile</h3>
            <ProfileForm profile={profile} onSave={saveDetails} onCancel={() => setScreen('home')} />
          </section>
        ) : (
          <>
            <section className="goal-card">
              <p className="small-text">Your fitness goal</p><h3>{profile.goal}</h3>
              <button className="secondary-button" onClick={() => setScreen('profile')}>Edit profile</button>
            </section>
            {daySelector}
            <div className="stats-grid">
              <section className="stat-card"><p>Workouts this month</p><h3>{monthlyWorkoutCount}</h3></section>
              <section className="stat-card"><p>Exercises in your workout</p><h3>{workout.length}</h3></section>
            </div>
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

              {exercise.minutes !== '' ? (

                <div className="exercise-inputs">

                  <label>
                    Minutes

                    <input
                      type="number"
                      value={exercise.minutes}
                      onChange={(event) =>
                        updateExercise(
                          exercise.name,
                          'minutes',
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Speed

                    <input
                      type="number"
                      step="0.1"
                      placeholder="mph"
                      value={exercise.speed}
                      onChange={(event) =>
                        updateExercise(
                          exercise.name,
                          'speed',
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Incline

                    <input
                      type="number"
                      placeholder="%"
                      value={exercise.incline}
                      onChange={(event) =>
                        updateExercise(
                          exercise.name,
                          'incline',
                          event.target.value
                        )
                      }
                    />
                  </label>

                </div>

              ) : (

                <div className="exercise-inputs">

                  <label>
                    Sets

                    <input
                      type="number"
                      value={exercise.sets}
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
                      value={exercise.reps}
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
                    Duration

                    <input
                      type="number"
                      min="1"
                      placeholder="minutes"
                      value={exercise.duration || ''}
                      onChange={(event) =>
                        updateExercise(
                          exercise.name,
                          'duration',
                          event.target.value
                        )
                      }
                    />
                  </label>

                  <label>
                    Weight

                    <input
                      type="number"
                      placeholder="lbs"
                      value={exercise.weight}
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

                {exercise.minutes !== '' ? (

                  <p>
                    {exercise.minutes} minutes

                    {exercise.speed &&
                      ` · ${exercise.speed} mph`}

                    {exercise.incline &&
                      ` · Incline ${exercise.incline}`}
                  </p>

                ) : (

                  <p>
                    {exercise.sets} sets × {exercise.reps} reps

                    {exercise.duration &&
                      ` · ${exercise.duration} minutes`}

                    {exercise.weight &&
                      ` · ${exercise.weight} lbs`}
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
