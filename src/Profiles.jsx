import { useState } from 'react'

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
      <section className="login-card">
        <div className="logo-mark" aria-hidden="true">GC</div>
        <h1>Glass Ceiling Fitness</h1>
        <p className="tagline">Break barriers. Build strength.</p>
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
    </main>
  )
}
