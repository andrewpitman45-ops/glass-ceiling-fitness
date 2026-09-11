import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import App from './App'
import Brand from './Brand'
import { ProfileForm } from './Profiles'

function AccountForm({ recovery, onRecovered }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const creating = mode === 'signup'
  async function submit(event) {
    event.preventDefault()
    setMessage('')
    if ((creating || recovery) && password !== confirm) { setMessage('Passwords must match.'); return }
    setBusy(true)
    try {
      const redirectTo = window.location.origin + window.location.pathname
      let result
      if (recovery) result = await supabase.auth.updateUser({ password })
      else if (creating) result = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo } })
      else if (mode === 'reset') result = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
      else result = await supabase.auth.signInWithPassword({ email, password })
      if (result.error) throw result.error
      setPassword('')
      setConfirm('')
      if (recovery) onRecovered()
      else setMessage(creating ? 'Check your email to confirm your account before signing in.' : mode === 'reset' ? 'If an account exists for this email, a reset link will arrive shortly.' : '')
    } catch (error) {
      setMessage(mode === 'login' && !recovery ? 'Unable to sign in. Check your email and password, and confirm your email if you just signed up.' : error.message)
    } finally { setBusy(false) }
  }
  return <>
    <h2>{recovery ? 'Choose a new password' : creating ? 'Create a private account' : mode === 'reset' ? 'Reset your password' : 'Sign in to your account'}</h2>
    <p className="profile-intro">Your goals, fitness plan, and nutrition notes in your own account.</p>
    <form className="profile-form" onSubmit={submit}>
      {!recovery && <><label htmlFor="account-email">Email</label><input id="account-email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></>}
      {(mode !== 'reset' || recovery) && <><label htmlFor="account-password">Password</label><input id="account-password" type="password" autoComplete={creating || recovery ? 'new-password' : 'current-password'} minLength={creating || recovery ? 12 : 1} required value={password} onChange={event => setPassword(event.target.value)} /></>}
      {(creating || recovery) && <><p className="small-text">Use at least 12 characters.</p><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" type="password" autoComplete="new-password" required value={confirm} onChange={event => setConfirm(event.target.value)} /></>}
      <button className="main-button" disabled={busy} type="submit">{busy ? 'Please wait…' : recovery ? 'Save password' : creating ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in'}</button>
    </form>
    {message && <p role="status" className="save-status">{message}</p>}
    {!recovery && <div className="account-actions">
      <button className="secondary-button" disabled={busy} onClick={() => { setMode(creating || mode === 'reset' ? 'login' : 'signup'); setMessage(''); setPassword(''); setConfirm('') }}>{creating || mode === 'reset' ? 'Back to sign in' : 'Create an account'}</button>
      {mode === 'login' && <button className="secondary-button" disabled={busy} onClick={() => { setMode('reset'); setPassword(''); setMessage('') }}>Forgot password?</button>}
    </div>}
  </>
}

function Member({ user, onSignOut }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)
 useEffect(() => {
  let active = true

  supabase
    .from('member_profiles')
    .select('data')
    .eq('user_id', user.id)
    .maybeSingle()
    .then(({ data, error }) => {
      if (!active) return

      setError(
        error
          ? 'Unable to load your account. Try again or contact the site owner.'
          : ''
      )

      if (data) {
        const saved = data.data

        setProfile({
          ...saved,
          id: user.id,

          weeklyWorkouts: saved.weeklyWorkouts || {
            monday: [],
            tuesday: [],
            wednesday: [],
            thursday: [],
            friday: [],
            saturday: [],
            sunday: [],
          },

          workoutHistory: saved.workoutHistory || [],
        })
      } else {
        setProfile(null)
      }

      setLoading(false)
    })
    .catch(() => {
      if (active) {
        setError('Unable to connect. Please retry.')
        setLoading(false)
      }
    })

  return () => {
    active = false
  }
}, [user.id, retry])
  async function createProfile(details) {
  const next = {
    ...details,
    id: user.id,

    weeklyWorkouts: {
      monday: [],
      tuesday: [],
      wednesday: [],
      thursday: [],
      friday: [],
      saturday: [],
      sunday: [],
    },

    workoutHistory: [],

    completed: [],
    sessions: 0,
    nutrition: '',
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
}
  .detaiconst next =ls, id: user.id, workout: [], completed: [], sessions: 0, nutrition: '' }
    const { error } = await supabase.from('member_profiles').insert({ user_id: user.id, data: next })
    if (error) return 'Could not create your profile. Please retry.'
    setProfile(next)
  }
  if (profile && !error) return <App key={user.id} initialProfile={profile} onSignOut={onSignOut} />
  return <section className="login-card account-card">
    {loading ? <p role="status">Loading your private account…</p> : error ? <><p role="alert">{error}</p><button className="main-button" onClick={() => { setLoading(true); setRetry(retry + 1) }}>Retry</button></> : <><h2>Make it yours</h2><ProfileForm onSave={createProfile} /><p className="demo-note">Your profile is saved to your account. Previous shared browser profiles are not automatically imported.</p></>}
    <button className="secondary-button" onClick={onSignOut}>Sign out</button>
  </section>
}

export default function AccountGate() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(Boolean(supabase))
  const [recovery, setRecovery] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    if (!supabase) return
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      setLoading(false)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'SIGNED_OUT') setRecovery(false)
    })
    return () => subscription.unsubscribe()
  }, [])
  async function signOut() {
    const { error } = await supabase.auth.signOut({ scope: 'local' })
    if (error) setError('Sign out failed. Please try again.')
    else { setSession(null); setRecovery(false); setError('') }
  }
  return <>
    {error && <p className="storage-error" role="alert">{error}</p>}
    {session && !recovery ? <Member key={session.user.id} user={session.user} onSignOut={signOut} /> : <main className="account-shell">
      <Brand />
      <section className="login-card account-card">
        {!supabase ? <><h2>Private accounts are being set up</h2><p className="profile-intro">Sign-in will be available once the site's account service is connected. Shared browser profiles are no longer accessible through this app.</p></> : loading ? <p role="status">Checking your session…</p> : <AccountForm recovery={recovery} onRecovered={() => setRecovery(false)} />}
      </section>
      <p className="small-text">Personalized fitness for people with disabilities. Your goals. Your way.</p>
    </main>}
  </>
}
