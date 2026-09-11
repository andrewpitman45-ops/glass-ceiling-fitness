import { useState } from 'react'
import Brand from './Brand'

const goals = ['Build strength', 'Improve endurance', 'Stay consistent', 'Improve mobility']

export function ProfileForm({ profile, onSave, onCancel }) {
  const [name, setName] = useState(profile?.name || '')
  const [goal, setGoal] = useState(profile?.goal || goals[0])
  const [clientType, setClientType] = useState(profile?.clientType || 'independent')
  const [bodyWeight, setBodyWeight] = useState(profile?.bodyWeight || '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Enter a name for your profile.')
      return
    }
    setBusy(true)
    try { setError(await onSave({ name: name.trim(), goal, clientType, bodyWeight }) || '') }
    catch { setError('Could not save your profile. Please try again.') }
    finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="profile-form">
      <label htmlFor="profile-name">Your name</label>
      <input id="profile-name" autoComplete="given-name" maxLength={40} required value={name} onChange={event => setName(event.target.value)} />
      <fieldset className="client-options">
        <legend>How are you joining us?</legend>
        <label><input type="radio" name="client-type" value="independent" checked={clientType === 'independent'} onChange={event => setClientType(event.target.value)} /><span>I'm joining independently<small>Fitness and nutrition planning around my goals.</small></span></label>
        <label><input type="radio" name="client-type" value="youre-with-us" checked={clientType === 'youre-with-us'} onChange={event => setClientType(event.target.value)} /><span>I'm joining through You're With Us<small>Personalized fitness for people with disabilities, with support shaped around me.</small></span></label>
      </fieldset>
      <p className="small-text">Tell us how you're joining. Your preferences, accessibility needs, and choices matter in either option.</p>
      <label htmlFor="profile-goal">Fitness goal</label>
      <select id="profile-goal" value={goal} onChange={event => setGoal(event.target.value)}>
        {goals.map(item => <option key={item}>{item}</option>)}
      </select>
      <label htmlFor="profile-body-weight">Body weight (lb, optional)</label>
      <input id="profile-body-weight" type="number" min="1" max="1000" value={bodyWeight} onChange={event => setBodyWeight(event.target.value)} />
      <p className="small-text">Used to personalize calorie estimates. A default of 150 lb is used when this is blank.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="main-button" disabled={busy} type="submit">{busy ? 'Saving…' : profile ? 'Save profile' : 'Create profile & continue'}</button>
      {onCancel && <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>}
    </form>
  )
}

export default function Profiles({ profiles, onSelect, onCreate }) {
  const [creating, setCreating] = useState(false)
  return (
    <main className="app-shell">
      <div className="entry-brand"><Brand /><span className="brand-caption">FITNESS THAT FITS YOU</span></div>
      <section className="entry-hero" aria-labelledby="hero-title">
        <p className="hero-kicker"><span /> YOU COME FIRST.</p>
        <h1 id="hero-title">Your goals.<br /><em>Your way.</em></h1>
        <p className="hero-copy">Personalized fitness for people with disabilities. Your plan starts with you: your goals, preferences, accessibility needs, and everyday life. Choose how you move and progress at your own pace.</p>
        <p className="trainer-credentials">Licensed &amp; insured NASM personal trainer</p>
        <div className="hero-rule" />
        <div className="hero-pillars"><span><b>01</b> Customized fitness</span><span><b>02</b> Nutrition planning</span><span><b>03</b> Individual support</span></div>
      </section>
      <section className="login-card">
        <p className="card-kicker">YOUR PERSONAL TRAINING SPACE</p>
        <h2>{creating || profiles.length === 0 ? 'Create your profile' : 'Welcome back'}</h2>
        <p className="profile-intro">{creating || profiles.length === 0 ? "Join independently or through You're With Us. Start with what matters to you." : 'Choose your profile to return to your fitness and nutrition plans.'}</p>
        {creating || profiles.length === 0 ? (
          <ProfileForm onSave={onCreate} onCancel={profiles.length ? () => setCreating(false) : undefined} />
        ) : (
          <>
            <div className="profile-list">
              {profiles.map(profile => (
                <button className="profile-choice" key={profile.id} onClick={() => onSelect(profile.id)}>
                  <span className="avatar" aria-hidden="true">{profile.name.slice(0, 1).toUpperCase()}</span>
                  <span><strong>{profile.name}</strong><small>{profile.goal}</small></span>
                  <span aria-hidden="true">→</span>
                </button>
              ))}
            </div>
            <button className="secondary-button" onClick={() => setCreating(true)}>+ Create a profile</button>
          </>
        )}
        <p className="demo-note">Profiles are saved on this browser. Anyone using this device can open them.</p>
      </section>
      <footer className="entry-footer"><span>GLASS CEILING FITNESS</span><span>Your goals. Your choices. Your pace.</span></footer>
    </main>
  )
}
