import { useState } from 'react'
import './App.css'

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

function App() {
  const [screen, setScreen] = useState('home')
  const [selectedCategory, setSelectedCategory] = useState('Cardio')
  const [workout, setWorkout] = useState([])
  const [completed, setCompleted] = useState([])

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
    setWorkout([])
    setCompleted([])
    setScreen('home')
  }

  const progress =
    workout.length === 0
      ? 0
      : Math.round(
          (completed.length / workout.length) * 100
        )

  if (screen === 'home') {
    return (
      <div className="app-shell">
        <div className="login-card">
          <h1>Glass Ceiling Fitness</h1>

          <p className="tagline">
            Break barriers. Build strength.
          </p>

          <button onClick={() => setScreen('builder')}>
            Build Workout
          </button>
        </div>
      </div>
    )
  }

  if (screen === 'builder') {
    return (
      <div className="dashboard">

        <header className="top-bar">

          <div>
            <p className="eyebrow">
              GLASS CEILING
            </p>

            <h1>FITNESS</h1>
          </div>

          <button
            className="sign-out"
            onClick={() => setScreen('home')}
          >
            Home
          </button>

        </header>

        <section className="welcome">

          <p>Workout Builder</p>

          <h2>
            Build Today's Workout
          </h2>

        </section>

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
            Today's Workout
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

          <div>
            <p className="eyebrow">
              GLASS CEILING
            </p>

            <h1>FITNESS</h1>
          </div>

        </header>

        <section className="welcome">

          <p>
            Today's Workout
          </p>

          <h2>
            Break Through
          </h2>

        </section>

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
                      ` • ${exercise.speed} mph`}

                    {exercise.incline &&
                      ` • Incline ${exercise.incline}`}
                  </p>

                ) : (

                  <p>
                    {exercise.sets} sets × {exercise.reps} reps

                    {exercise.weight &&
                      ` • ${exercise.weight} lbs`}
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