import { cleanWorkoutProfile } from './workoutPlan'
import { lazy, Suspense, useEffect, useState } from 'react'
import App from './App'
import Brand from './Brand'
import { ProfileForm } from './Profiles'
import { supabase } from './supabase'

const LegalPage = lazy(() => import('./LegalPages'))
const WORKOUT_RESET_VERSION = 2
const LEGAL_VERSION = '2026-10-02'
const LEGAL_PAGE_KEYS = ['terms', 'privacy', 'disclaimer', 'community', 'contact']
const EMPTY_WEEKLY_WORKOUTS = {
  monday: [],
  tuesday: [],
  wednesday: [],
  thursday: [],
  friday: [],
  saturday: [],
  sunday: [],
  extra: [],
}

function resetWorkoutData(profile) {
  return {
    ...profile,
    weeklyWorkouts: { ...EMPTY_WEEKLY_WORKOUTS },
    workoutHistory: [],
    caloriesBurned: [],
    completed: [],
    workoutResetVersion: WORKOUT_RESET_VERSION,
  }
}

function AccountForm({ recovery, onRecovered }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event) {
    event.preventDefault()
    setMessage('')

    if (recovery && password !== confirm) {
      setMessage('Passwords must match.')
      return
    }

    setBusy(true)

    try {
      const redirectTo =
        window.location.origin + window.location.pathname

      let result

      if (recovery) {
        result = await supabase.auth.updateUser({ password })
      } else if (mode === 'reset') {
        result = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo,
        })
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password,
        })
      }

      if (result.error) {
        throw result.error
      }

      setPassword('')
      setConfirm('')

      if (recovery) {
        onRecovered()
      } else {
        setMessage(
          mode === 'reset'
            ? 'If an account exists for this email, a reset link will arrive shortly.'
            : ''
        )
      }
    } catch (error) {
      setMessage(
        mode === 'login' && !recovery
          ? 'Unable to sign in. Check your email and password.'
          : error.message
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <h2>
        {recovery
          ? 'Choose a new password'
          : mode === 'reset'
              ? 'Reset your password'
              : 'Sign in to your account'}
      </h2>

      <p className="profile-intro">
        Workouts, food logs, and progress.
      </p>

      <form className="profile-form" onSubmit={submit}>
        {!recovery && (
          <>
            <label htmlFor="account-email">Email</label>

            <input
              id="account-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </>
        )}

        {(mode !== 'reset' || recovery) && (
          <>
            <label htmlFor="account-password">Password</label>

            <input
              id="account-password"
              type="password"
              autoComplete={
                recovery
                  ? 'new-password'
                  : 'current-password'
              }
              minLength={recovery ? 12 : 1}
              required
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />
          </>
        )}

        {recovery && (
          <>
            <p className="small-text">
              Use at least 12 characters.
            </p>

            <label htmlFor="confirm-password">
              Confirm password
            </label>

            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              value={confirm}
              onChange={(event) =>
                setConfirm(event.target.value)
              }
            />
          </>
        )}

        <button
          className="main-button"
          disabled={busy}
          type="submit"
        >
          {busy
            ? 'Please wait…'
            : recovery
              ? 'Save password'
              : mode === 'reset'
                  ? 'Send reset link'
                  : 'Sign in'}
        </button>
      </form>

      {message && (
        <p role="status" className="save-status">
          {message}
        </p>
      )}

      {!recovery && (
        <div className="account-actions">
          {mode === 'reset' && <button type="button" className="secondary-button" disabled={busy} onClick={() => { setMode('login'); setMessage(''); setPassword('') }}>Back to sign in</button>}
          {mode === 'login' && (
            <button
              type="button"
              className="secondary-button"
              disabled={busy}
              onClick={() => {
                setMode('reset')
                setPassword('')
                setMessage('')
              }}
            >
              Forgot password?
            </button>
          )}
        </div>
      )}
      {!recovery && mode === 'login' && (
        <p className="invite-only-note">
          New accounts are invite-only. Contact <a href="mailto:Andrewpitman46@outlook.com">You're With Us Fitness</a> for access.
        </p>
      )}
    </>
  )
}

function Member({ user, onSignOut, theme, onToggleTheme }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
  const hasAcceptedCurrentTerms =
    user.user_metadata?.terms_version === LEGAL_VERSION &&
    user.user_metadata?.privacy_version === LEGAL_VERSION
  const [legalAccepted, setLegalAccepted] = useState(hasAcceptedCurrentTerms)

  useEffect(() => {
    let active = true

    supabase
      .from('member_profiles')
      .select('data')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (!active) {
          return
        }

        setError(
          error
            ? 'Unable to load your account. Try again or contact the site owner.'
            : ''
        )

        if (data) {
          const saved = data.data
          const needsWorkoutReset = saved.workoutResetVersion !== WORKOUT_RESET_VERSION
          const nextProfile = cleanWorkoutProfile(needsWorkoutReset ? resetWorkoutData(saved) : saved)

          if (needsWorkoutReset || JSON.stringify(nextProfile) !== JSON.stringify(saved)) {
            const { error: resetError } = await supabase
              .from('member_profiles')
              .update({ data: nextProfile })
              .eq('user_id', user.id)

            if (resetError) {
              setError(
                'Unable to update your workout data. Please retry.'
              )
              setLoading(false)
              return
            }
          }

          setProfile({
            ...nextProfile,
            id: user.id,

            weeklyWorkouts:
              nextProfile.weeklyWorkouts || EMPTY_WEEKLY_WORKOUTS,

            workoutHistory:
              nextProfile.workoutHistory || [],
          })
        } else {
          setProfile(null)
        }

        setLoading(false)
      })
      .catch(() => {
        if (active) {
          setError(
            'Unable to connect. Please retry.'
          )
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [user.id, retry])

  async function createProfile(details) {
    if (!legalAccepted) {
      return 'Accept the Terms of Use and Privacy Policy to continue.'
    }

    const { error: legalError } = await supabase.auth.updateUser({
      data: {
        legal_accepted_at: hasAcceptedCurrentTerms
          ? user.user_metadata.legal_accepted_at
          : new Date().toISOString(),
        terms_version: LEGAL_VERSION,
        privacy_version: LEGAL_VERSION,
      },
    })

    if (legalError) {
      return 'Could not save your agreement. Please retry.'
    }

    const next = {
      ...details,
      id: user.id,

      weeklyWorkouts: {
        ...EMPTY_WEEKLY_WORKOUTS,
      },

      workoutHistory: [],
      caloriesBurned: [],
      completed: [],
      rewardMonth: new Date().toISOString().slice(0, 7),
      monthlyWorkoutDates: [],
      completedWeeks: [],
      rewardPoints: 0,
      sessions: 0,
      nutrition: '',
      workoutResetVersion: WORKOUT_RESET_VERSION,
    }

    const { error } = await supabase
      .from('member_profiles')
      .insert({
        user_id: user.id,
        data: next,
      })

    if (error) {
      return 'Could not create your profile. Please retry.'
    }

    setProfile(next)

    return ''
  }

  if (profile && !error) {
    return (
      <App
        key={user.id}
        initialProfile={profile}
        onSignOut={onSignOut}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />
    )
  }

  return (
    <section className="login-card account-card">
      {loading ? (
        <p role="status">
          Loading your private account…
        </p>
      ) : error ? (
        <>
          <p role="alert">{error}</p>

          <button
            className="main-button"
            type="button"
            onClick={() => {
              setLoading(true)
              setRetry((current) => current + 1)
            }}
          >
            Retry
          </button>
        </>
      ) : (
        <>
          <h2>Make it yours</h2>

          <label className="legal-consent">
            <input
              type="checkbox"
              required
              checked={legalAccepted}
              onChange={event => setLegalAccepted(event.target.checked)}
            />
            <span>
              I agree to the{' '}
              <a href="?legal=terms" target="_blank" rel="noreferrer">Terms of Use / EULA</a>
              {' '}and{' '}
              <a href="?legal=privacy" target="_blank" rel="noreferrer">Privacy Policy</a>.
            </span>
          </label>
          <ProfileForm onSave={createProfile} />

          <p className="demo-note">
            Your profile is saved to your account.
            Previous shared browser profiles are not
            automatically imported.
          </p>
        </>
      )}

      <button
        className="secondary-button"
        type="button"
        onClick={onSignOut}
      >
        Sign out
      </button>
    </section>
  )
}

export default function AccountGate() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [recovery, setRecovery] = useState(false)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState(() => {
    try {
      return window.localStorage.getItem('glass-ceiling-fitness.theme') === 'dark' ? 'dark' : 'light'
    } catch {
      return 'light'
    }
  })

  const requestedLegalPage = new URLSearchParams(window.location.search).get('legal')

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#160d0f' : '#ffffff')
    try {
      window.localStorage.setItem('glass-ceiling-fitness.theme', theme)
    } catch {
      // Keep the selected theme for this page even when storage is unavailable.
    }
  }, [theme])

  function toggleTheme() {
    setTheme(current => current === 'dark' ? 'light' : 'dark')
  }

  useEffect(() => {
    if (!supabase) {
      return
    }

    let mounted = true

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted) {
          return
        }

        if (error) {
          setError(
            'Unable to check your account session.'
          )
        }

        setSession(data.session)
        setLoading(false)
      })
      .catch(() => {
        if (mounted) {
          setError(
            'Unable to connect to the account service.'
          )
          setLoading(false)
        }
      })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, nextSession) => {
        setSession(nextSession)
        setLoading(false)

        if (event === 'PASSWORD_RECOVERY') {
          setRecovery(true)
        }

        if (event === 'SIGNED_OUT') {
          setRecovery(false)
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (LEGAL_PAGE_KEYS.includes(requestedLegalPage)) {
    return (
      <Suspense fallback={<main className="legal-shell">Loading legal page…</main>}>
        <LegalPage page={requestedLegalPage} />
      </Suspense>
    )
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut({
      scope: 'local',
    })

    if (error) {
      setError(
        'Sign out failed. Please try again.'
      )
      return
    }

    setSession(null)
    setRecovery(false)
    setError('')
  }

  return (
    <>
      {error && (
        <p
          className="storage-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {session && !recovery ? (
        <Member
          key={session.user.id}
          user={session.user}
          onSignOut={signOut}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      ) : (
        <main className="account-shell">
          <div className="account-header">
            <Brand />
            <button className="theme-toggle secondary-button" type="button" onClick={toggleTheme}>
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
          </div>

          <section className="login-card account-card">
            {!supabase ? (
              <>
                <h2>
                  Private accounts are being set up
                </h2>

                <p className="profile-intro">
                  Sign-in will be available once the
                  site's account service is connected.
                  Shared browser profiles are no longer
                  accessible through this app.
                </p>
              </>
            ) : loading ? (
              <p role="status">
                Checking your session…
              </p>
            ) : (
              <AccountForm
                recovery={recovery}
                onRecovered={() =>
                  setRecovery(false)
                }
              />
            )}
          </section>

          <p className="small-text">
            You're With Us Fitness
          </p>
          <nav className="account-legal-links" aria-label="Legal pages">
            {LEGAL_PAGE_KEYS.map(page => <a key={page} href={`?legal=${page}`} target="_blank" rel="noreferrer">{page === 'terms' ? 'Terms / EULA' : page === 'privacy' ? 'Privacy' : page === 'disclaimer' ? 'Health Disclaimer' : page === 'community' ? 'Community Rules' : 'Contact'}</a>)}
          </nav>
        </main>
      )}
    </>
  )
}
