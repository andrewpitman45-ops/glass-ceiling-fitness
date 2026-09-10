import { useState } from 'react'
import Brand from './Brand'

const goals = ['Build strength', 'Improve endurance', 'Stay consistent', 'Improve mobility']

export function ProfileForm({ profile, onSave, onCancel }) {
  const [name, setName] = useState(profile?.name || '')
  const [goal, setGoal] = useState(profile?.goal || goals[0])
  const [error, setError] = useState('')

  function submit(event) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Enter a name for your profile.')
      return
    }
    setError(onSave({ name: name.trim(), goal }) || '')
  }

  return (
    <form onSubmit={submit} className="profile-form">
      <label htmlFor="profile-name">Your name</label>
      <input id="profile-name" autoComplete="given-name" maxLength={40} required value={name} onChange={event => setName(event.target.value)} />
      <label htmlFor="profile-goal">Fitness goal</label>
      <select id="profile-goal" value={goal} onChange={event => setGoal(event.target.value)}>
        {goals.map(item => <option key={item}>{item}</option>)}
      </select>
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="main-button" type="submit">{profile ? 'Save profile' : 'Create profile & continue'}</button>
      {onCancel && <button className="secondary-button" type="button" onClick={onCancel}>Cancel</button>}
    </form>
  )
}

export default function Profiles({ profiles, onSelect, onCreate }) {
  const [creating, setCreating] = useState(false)
  return (
    <main className="app-shell">
      <div className="entry-brand"><Brand /><span className="brand-caption">BUILT TO BREAK THROUGH</span></div>
      <section className="entry-hero" aria-labelledby="hero-title">
        <p className="hero-kicker"><span /> YOUR NEXT LEVEL STARTS HERE</p>
        <h1 id="hero-title">No limits.<br />Just <em>breakthroughs.</em></h1>
        <p className="hero-copy">The ceiling is only the beginning. Build strength, find your rhythm, and turn every workout into a step beyond.</p>
        <div className="hero-rule" />
        <div className="hero-pillars"><span><b>01</b> Find your strength</span><span><b>02</b> Own your progress</span><span><b>03</b> Break your ceiling</span></div>
      </section>
      <section className="login-card">
        <p className="card-kicker">YOUR PERSONAL TRAINING SPACE</p>
        <h2>{creating || profiles.length === 0 ? 'Create your profile' : 'Welcome back'}</h2>
        <p className="profile-intro">{creating || profiles.length === 0 ? 'Make space for your goals and your next workout.' : 'Choose your profile to continue your journey.'}</p>
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
      <footer className="entry-footer"><span>GLASS CEILING FITNESS</span><span>Break barriers. Build strength.</span></footer>
    </main>
  )
}
