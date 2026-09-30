import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import FriendPhoto from './FriendPhoto'

export default function HomePhotos({ userId, onManageFriends }) {
  const [feed, setFeed] = useState({ posts: [], loading: true, error: '' })
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    let active = true
    supabase.from('friend_posts')
      .select('id, author, object_path, caption, created_at')
      .eq('recipient', userId)
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data, error }) => {
        if (!active) return
        if (error) throw error
        setFeed({ posts: data || [], loading: false, error: '' })
      })
      .catch(() => {
        if (active) setFeed({ posts: [], loading: false, error: 'Could not load your photos. Please try again.' })
      })
    return () => { active = false }
  }, [userId, refresh])

  function reload() {
    setFeed({ posts: [], loading: true, error: '' })
    setRefresh(value => value + 1)
  }

  return <section className="workout-card home-photos" aria-labelledby="home-photos-title">
    <div className="home-photos-header">
      <div>
        <h3 id="home-photos-title">Photos from friends</h3>
        <p className="small-text">The latest moments friends have shared with you.</p>
      </div>
      <div className="home-photos-actions">
        <button className="secondary-button" disabled={feed.loading} onClick={reload}>Refresh photos</button>
        <button className="secondary-button" onClick={onManageFriends}>Friends &amp; all photos</button>
      </div>
    </div>
    {feed.loading ? <p role="status">Loading your photos...</p> : feed.error ?
      <p className="form-error" role="alert">{feed.error}</p> : feed.posts.length === 0 ?
        <p>No photos received yet. Connect with friends and the photos they send you will appear here.</p> :
        <div className="friend-photo-grid">{feed.posts.map(post => <article className="friend-post" key={post.id}>
          <FriendPhoto post={post} />
          {post.caption && <p>{post.caption}</p>}
          <p className="small-text">From <code>{post.author}</code></p>
          <time dateTime={post.created_at}>{new Date(post.created_at).toLocaleString()}</time>
        </article>)}</div>}
  </section>
}
