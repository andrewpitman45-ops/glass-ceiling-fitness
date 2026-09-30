import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const bucket = 'friend-photos'

export default function FriendPhoto({ post }) {
  const [url, setUrl] = useState('')
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let active = true
    let objectUrl
    supabase.storage.from(bucket).download(post.object_path).then(({ data, error }) => {
      if (!active) return
      if (error) { setFailed(true); return }
      objectUrl = URL.createObjectURL(data)
      setUrl(objectUrl)
    }).catch(() => { if (active) setFailed(true) })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [post.object_path])
  return url ? <img className="friend-photo" src={url} alt={post.caption || 'Photo shared with a friend'} /> : <p>{failed ? 'Photo unavailable. Refresh to retry.' : 'Loading photo...'}</p>
}

