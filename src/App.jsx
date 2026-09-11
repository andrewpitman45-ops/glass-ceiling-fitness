import { useRef, useState } from 'react'
import './App.css'
import Brand from './Brand'
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

function App({ initialProfile, onSignOut }) {
  const [screen, setScreen] = useState('home')
  const [selectedDay, setSelectedDay] = useState('monday')
  const [selectedCategory, setSelectedCategory] = useState('Cardio')
  const [profile, setProfile] = useState(initialProfile)
  const [storageError, setStorageError] = useState('')
  const [saving, setSaving] = useState(false)
  const saveQueue = useRef(Promise.resolve())
  const latestProfile = useRef(initialProfile)
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

  const nextWeeklyWorkouts = {
    ...weeklyWorkouts,
    [selectedDay]: finishedWorkout,
  }

  updateProfile({
    weeklyWorkouts: nextWeeklyWorkouts,
    completed: [],
    sessions: profile.sessions + 1,
  })

  setScreen('home')
}

  const progress =
    workout.length === 0
      ? 0
      : Math.round(
          (completed.length / workout.length) * 100
        )


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
      <Nutrition key={profile.id} profile={profile} onSave={nutrition => updateProfile({ nutrition })} />
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
              <section className="stat-card"><p>Workouts finished</p><h3>{profile.sessions}</h3></section>
              <section className="stat-card"><p>Exercises in your workout</p><h3>{workout.length}</h3></section>
            </div>
            <section className="workout-card">
              <h3>Your customized fitness plan</h3>
              <p className="small-text">{supportedClient ? 'You guide your goals. Work with your trainer to choose exercises, adjustments, and support that fit your preferences and accessibility needs.' : 'Build a routine around your goals, schedule, and preferences. Use this space to record your customized workout.'}</p>
              <p className="demo-note">The exercise library is a starting point. Work with your trainer to choose any adjustments you need; exercises do not change automatically based on how you join.</p>
              <button className="main-button" onClick={() => setScreen('builder')}>{workout.length ? 'Edit saved workout' : 'Build workout'}</button>
              {workout.length > 0 && <button className="secondary-button" onClick={() => setScreen('workout')}>Resume workout</button>}
            </section>
            <section className="workout-card">
              <p className="small-text">Nutrition</p>
              <h3>Planning for everyday life</h3>
              <p className="small-text">{supportedClient ? 'A separate space for meal routines, food preferences, and the practical support that works for you.' : 'Keep meal ideas and your personal nutrition plan alongside your fitness routine.'}</p>
              <button className="main-button" onClick={() => setScreen('nutrition')}>{profile.nutrition ? 'View nutrition plan' : 'Start nutrition plan'}</button>
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

                    {exercise.weight &&
                      ` · ${exercise.weight} lbs`}
                  </p>

                )}

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

