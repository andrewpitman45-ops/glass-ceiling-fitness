import { useState } from 'react'

export default function Nutrition({ profile, onSave }) {
  const [plan, setPlan] = useState(profile.nutrition || '')
  const [saved, setSaved] = useState(false)
  return (
    <section className="workout-card">
      <p className="small-text">Your nutrition planning space</p>
      <h3>A routine that fits your life</h3>
      <p className="profile-intro">Keep your meal ideas, daily routines, and agreed nutrition plan together. This space starts blank so you can add a plan that reflects your preferences.</p>
      {profile.clientType === 'youre-with-us' && <p className="profile-intro">You decide what to include, such as foods you enjoy, textures you prefer, and any support you would like with meal preparation.</p>}
      <form onSubmit={event => { event.preventDefault(); onSave(plan.trim()); setSaved(true) }} className="profile-form">
        <label htmlFor="nutrition-plan">My nutrition plan and notes</label>
        <textarea id="nutrition-plan" rows={10} maxLength={10000} value={plan} placeholder="Add meal ideas, a weekly routine, or notes from your nutrition plan…" onChange={event => { setPlan(event.target.value); setSaved(false) }} />
        <p className="demo-note">Saved to your account. These notes are not automatically shared with a trainer.</p>
        <button className="main-button" type="submit">Save nutrition plan</button>
        {saved && <p role="status" className="save-status">Nutrition plan updated in this view. Account save progress appears above.</p>}
      </form>
    </section>
  )
}
