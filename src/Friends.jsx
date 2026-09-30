import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import FriendPhoto from './FriendPhoto'
import { friendError, sendFriendRequest } from './friendRequests'

const bucket = 'friend-photos'
const types = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

export default function Friends({ userId }) {
  const [links, setLinks] = useState([])
  const [posts, setPosts] = useState([])
  const [code, setCode] = useState('')
  const [recipient, setRecipient] = useState('')
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const input = useRef(null)
  const other = link => link.requester === userId ? link.recipient : link.requester
  const friends = links.filter(link => link.status === 'accepted')

  async function refresh() {
    const [relationships, photos] = await Promise.all([
      supabase.from('friendships').select('*').order('created_at', { ascending: false }),
      supabase.from('friend_posts').select('*').order('created_at', { ascending: false }).limit(50),
    ])
    if (relationships.error || photos.error) throw new Error(friendError(relationships.error || photos.error))
    setLinks(relationships.data)
    setPosts(photos.data)
  }

  useEffect(() => {
    let active = true
    Promise.all([
      supabase.from('friendships').select('*').order('created_at', { ascending: false }),
      supabase.from('friend_posts').select('*').order('created_at', { ascending: false }).limit(50),
    ]).then(([relationships, photos]) => {
      if (!active) return
      if (relationships.error || photos.error) throw new Error(friendError(relationships.error || photos.error))
      setLinks(relationships.data); setPosts(photos.data)
    }).catch(err => { if (active) setError(err.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [userId])

  async function act(action) {
    setBusy(true); setError(''); setMessage('')
    try { await action(); await refresh() }
    catch (err) { setError(err.message || 'Something went wrong. Please retry.') }
    finally { setBusy(false); setLoading(false) }
  }

  function request(event) {
    event.preventDefault()
    act(async () => {
      const result = await sendFriendRequest(supabase, userId, code)
      setCode(''); setMessage(result)
    })
  }

  function changeFriend(link, accept) {
    act(async () => {
      const result = accept
        ? await supabase.from('friendships').update({ status: 'accepted' }).eq('id', link.id).select('id').single()
        : await supabase.from('friendships').delete().eq('id', link.id).select('id').single()
      if (result.error) throw new Error('Could not update friendship. Please retry.')
      if (!accept) setRecipient('')
      setMessage(accept ? 'Friend request accepted.' : 'Connection removed.')
    })
  }

  function publish(event) {
    event.preventDefault()
    act(async () => {
      if (!friends.some(link => other(link) === recipient)) throw new Error('Select an accepted friend.')
      if (!file || !types[file.type] || !file.size || file.size > 5 * 1024 * 1024) throw new Error('Choose a JPEG, PNG, or WebP photo up to 5 MB.')
      const id = crypto.randomUUID()
      const path = `${userId}/${id}.${types[file.type]}`
      const upload = await supabase.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false })
      if (upload.error) throw new Error('Photo upload failed. Please retry.')
      const result = await supabase.from('friend_posts').insert({ id, author: userId, recipient, object_path: path, caption: caption.trim() })
      if (result.error) {
        await supabase.storage.from(bucket).remove([path])
        throw new Error('Could not post photo. Confirm you are still friends and retry.')
      }
      setFile(null); setCaption(''); input.current.value = ''; setMessage('Photo posted to your friend.')
    })
  }

  function removePost(post) {
    act(async () => {
      const result = await supabase.from('friend_posts').delete().eq('id', post.id).select('id').single()
      if (result.error) throw new Error('Could not remove photo post.')
      const cleanup = await supabase.storage.from(bucket).remove([post.object_path])
      setMessage(cleanup.error ? 'Post removed. The stored file could not be cleaned up, but is no longer shared.' : 'Photo post removed.')
    })
  }

  return <section className="workout-card friends-panel">
    <h2>Friends &amp; photos</h2>
    <p>Exchange friend codes, accept a request, then post pictures to each other. Photos are private to you and the selected friend.</p>
    <label htmlFor="my-friend-code">Your friend code</label>
    <input id="my-friend-code" readOnly value={userId} onFocus={event => event.target.select()} />
    <form className="profile-form" onSubmit={request}>
      <label htmlFor="friend-code">Add a friend by their code</label>
      <input id="friend-code" required value={code} onChange={event => setCode(event.target.value)} />
      <button className="main-button" disabled={busy || loading}>Send friend request</button>
    </form>
    {error && <p className="form-error" role="alert">{error}</p>}
    {message && <p role="status">{message}</p>}
    <button className="secondary-button" disabled={busy || loading} onClick={() => act(async () => { setMessage('Friends and photos refreshed.') })}>{busy ? 'Please wait...' : 'Refresh friends & photos'}</button>
    {loading ? <p role="status">Loading friends...</p> : <>
      <h3>Your connections</h3>
      {!links.length && <p>No friends yet. Share your code to get started.</p>}
      {links.map(link => <div className="friend-connection" key={link.id}>
        <code>{other(link)}</code>
        <p>{link.status === 'accepted' ? 'Friend' : link.requester === userId ? 'Request sent' : 'Incoming request'}</p>
        {link.status === 'pending' && link.recipient === userId && <button disabled={busy} className="main-button" onClick={() => changeFriend(link, true)}>Accept</button>}
        <button disabled={busy} className="secondary-button" onClick={() => changeFriend(link, false)}>{link.status === 'accepted' ? 'Unfriend' : link.requester === userId ? 'Cancel request' : 'Decline'}</button>
      </div>)}
      <h3>Post a photo to a friend</h3>
      {!friends.length ? <p>Accept a friend request before sharing photos.</p> : <form className="profile-form" onSubmit={publish}>
        <label htmlFor="photo-friend">Friend</label>
        <select id="photo-friend" required value={recipient} onChange={event => setRecipient(event.target.value)}>
          <option value="">Choose a friend</option>
          {friends.map(link => <option key={link.id} value={other(link)}>{other(link)}</option>)}
        </select>
        <label htmlFor="friend-photo">Photo (JPEG, PNG, or WebP; maximum 5 MB)</label>
        <input id="friend-photo" ref={input} type="file" accept="image/jpeg,image/png,image/webp" required onChange={event => setFile(event.target.files[0] || null)} />
        <label htmlFor="photo-caption">Caption (optional)</label>
        <textarea id="photo-caption" maxLength={500} value={caption} onChange={event => setCaption(event.target.value)} />
        <button className="main-button" disabled={busy}>{busy ? 'Please wait...' : 'Post photo'}</button>
      </form>}
      <h3>Shared photos</h3>
      <p className="small-text">Your latest 50 posts, sent and received. Unfriending removes your access to each other’s posts.</p>
      {!posts.length && <p>No shared photos yet.</p>}
      <div className="friend-photo-grid">{posts.map(post => <article className="friend-post" key={post.id}>
        <p>{post.author === userId ? 'To' : 'From'} <code>{post.author === userId ? post.recipient : post.author}</code></p>
        <FriendPhoto post={post} />
        {post.caption && <p>{post.caption}</p>}
        <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleString()}</time>
        <button className="secondary-button" disabled={busy} onClick={() => removePost(post)}>Remove post</button>
      </article>)}</div>
    </>}
  </section>
}
