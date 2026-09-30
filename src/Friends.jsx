import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'
import FriendPhoto from './FriendPhoto'
import { friendError, sendFriendRequest } from './friendRequests'

const bucket = 'friend-photos'

const types = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export default function Friends({ userId }) {
  const [links, setLinks] = useState([])
  const [posts, setPosts] = useState([])
  const [directory, setDirectory] = useState({})
  const [searchName, setSearchName] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [recipient, setRecipient] = useState('')
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const input = useRef(null)

  const other = link =>
    link.requester === userId
      ? link.recipient
      : link.requester

  const friends = links.filter(
    link => link.status === 'accepted'
  )

  function nameFor(id) {
    const person = directory[id]

    if (!person) {
      return 'Member'
    }

    return `${person.first_name} ${person.last_name}`.trim()
  }

  async function loadDirectory(ids) {
    const uniqueIds = [...new Set(ids.filter(Boolean))]

    if (!uniqueIds.length) {
      return
    }

    const result = await supabase
      .from('member_directory')
      .select('user_id, first_name, last_name')
      .in('user_id', uniqueIds)

    if (result.error) {
      throw new Error(
        'Could not load member names. Please retry.'
      )
    }

    const names = {}

    for (const person of result.data || []) {
      names[person.user_id] = person
    }

    setDirectory(current => ({
      ...current,
      ...names,
    }))
  }

  async function syncOwnDirectoryEntry() {
    const profileResult = await supabase
      .from('member_profiles')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle()

    if (profileResult.error || !profileResult.data) {
      return
    }

    const profile = profileResult.data.data || {}

    const fullName =
      typeof profile.name === 'string'
        ? profile.name.trim()
        : ''

    if (!fullName) {
      return
    }

    const pieces = fullName
      .split(/\s+/)
      .filter(Boolean)

    if (pieces.length < 2) {
      return
    }

    const firstName = pieces[0]
    const lastName = pieces.slice(1).join(' ')

    const result = await supabase
      .from('member_directory')
      .upsert(
        {
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )

    if (result.error) {
      throw new Error(
        'Could not add your name to the friend directory.'
      )
    }
  }

  async function refresh() {
    const [relationships, photos] =
      await Promise.all([
        supabase
          .from('friendships')
          .select('*')
          .order('created_at', {
            ascending: false,
          }),

        supabase
          .from('friend_posts')
          .select('*')
          .order('created_at', {
            ascending: false,
          })
          .limit(50),
      ])

    if (
      relationships.error ||
      photos.error
    ) {
      throw new Error(
        friendError(
          relationships.error ||
            photos.error
        )
      )
    }

    const relationshipsData =
      relationships.data || []

    const photosData =
      photos.data || []

    setLinks(relationshipsData)
    setPosts(photosData)

    const ids = [
      userId,
      ...relationshipsData.flatMap(link => [
        link.requester,
        link.recipient,
      ]),
      ...photosData.flatMap(post => [
        post.author,
        post.recipient,
      ]),
    ]

    await loadDirectory(ids)
  }

  useEffect(() => {
    let active = true

    async function load() {
      try {
        await syncOwnDirectoryEntry()

        if (!active) return

        await refresh()
      } catch (err) {
        if (active) {
          setError(
            err.message ||
              'Unable to load friends.'
          )
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      active = false
    }
  }, [userId])

  async function act(action) {
    setBusy(true)
    setError('')
    setMessage('')

    try {
      await action()
      await refresh()
    } catch (err) {
      setError(
        err.message ||
          'Something went wrong. Please retry.'
      )
    } finally {
      setBusy(false)
      setLoading(false)
    }
  }

  async function searchMembers(event) {
    event.preventDefault()

    setError('')
    setMessage('')
    setSearchResults([])

    const cleaned = searchName
      .trim()
      .replace(/\s+/g, ' ')

    const parts = cleaned.split(' ')

    if (parts.length < 2) {
      setError(
        'Enter both a first and last name.'
      )
      return
    }

    const firstName = parts[0]
    const lastName =
      parts.slice(1).join(' ')

    setBusy(true)

    try {
      const result = await supabase
        .from('member_directory')
        .select(
          'user_id, first_name, last_name'
        )
        .ilike(
          'first_name',
          `%${firstName}%`
        )
        .ilike(
          'last_name',
          `%${lastName}%`
        )
        .neq('user_id', userId)
        .limit(10)

      if (result.error) {
        throw new Error(
          'Could not search members.'
        )
      }

      const people = result.data || []

      setSearchResults(people)

      const names = {}

      for (const person of people) {
        names[person.user_id] = person
      }

      setDirectory(current => ({
        ...current,
        ...names,
      }))

      if (!people.length) {
        setMessage(
          'No members found with that name.'
        )
      }
    } catch (err) {
      setError(
        err.message ||
          'Could not search members.'
      )
    } finally {
      setBusy(false)
    }
  }

  function requestPerson(person) {
    act(async () => {
      const result =
        await sendFriendRequest(
          supabase,
          userId,
          person.user_id
        )

      setSearchName('')
      setSearchResults([])
      setMessage(result)
    })
  }

  function changeFriend(link, accept) {
    act(async () => {
      const result = accept
        ? await supabase
            .from('friendships')
            .update({
              status: 'accepted',
            })
            .eq('id', link.id)
            .select('id')
            .single()
        : await supabase
            .from('friendships')
            .delete()
            .eq('id', link.id)
            .select('id')
            .single()

      if (result.error) {
        throw new Error(
          'Could not update friendship. Please retry.'
        )
      }

      if (!accept) {
        setRecipient('')
      }

      setMessage(
        accept
          ? 'Friend request accepted.'
          : 'Connection removed.'
      )
    })
  }

  function publish(event) {
    event.preventDefault()

    act(async () => {
      if (
        !friends.some(
          link =>
            other(link) === recipient
        )
      ) {
        throw new Error(
          'Select an accepted friend.'
        )
      }

      if (
        !file ||
        !types[file.type] ||
        !file.size ||
        file.size >
          5 * 1024 * 1024
      ) {
        throw new Error(
          'Choose a JPEG, PNG, or WebP photo up to 5 MB.'
        )
      }

      const id = crypto.randomUUID()

      const path =
        `${userId}/${id}.${types[file.type]}`

      const upload =
        await supabase.storage
          .from(bucket)
          .upload(path, file, {
            contentType: file.type,
            upsert: false,
          })

      if (upload.error) {
        throw new Error(
          'Photo upload failed. Please retry.'
        )
      }

      const result = await supabase
        .from('friend_posts')
        .insert({
          id,
          author: userId,
          recipient,
          object_path: path,
          caption: caption.trim(),
        })

      if (result.error) {
        await supabase.storage
          .from(bucket)
          .remove([path])

        throw new Error(
          'Could not post photo. Confirm you are still friends and retry.'
        )
      }

      setFile(null)
      setCaption('')

      if (input.current) {
        input.current.value = ''
      }

      setMessage(
        'Photo posted to your friend.'
      )
    })
  }

  function removePost(post) {
    act(async () => {
      const result = await supabase
        .from('friend_posts')
        .delete()
        .eq('id', post.id)
        .select('id')
        .single()

      if (result.error) {
        throw new Error(
          'Could not remove photo post.'
        )
      }

      const cleanup =
        await supabase.storage
          .from(bucket)
          .remove([
            post.object_path,
          ])

      setMessage(
        cleanup.error
          ? 'Post removed. The stored file could not be cleaned up, but is no longer shared.'
          : 'Photo post removed.'
      )
    })
  }

  return (
    <section className="workout-card friends-panel">
      <h2>Friends &amp; photos</h2>

      <p>
        Search for another member by
        their first and last name,
        connect, and privately share
        photos.
      </p>

      <form
        className="profile-form"
        onSubmit={searchMembers}
      >
        <label htmlFor="friend-name">
          Find a friend
        </label>

        <input
          id="friend-name"
          type="text"
          placeholder="First and last name"
          required
          value={searchName}
          onChange={event =>
            setSearchName(
              event.target.value
            )
          }
        />

        <button
          className="main-button"
          disabled={busy || loading}
        >
          Search members
        </button>
      </form>

      {searchResults.length > 0 && (
        <div className="friend-search-results">
          <h3>Search results</h3>

          {searchResults.map(person => (
            <div
              className="friend-connection"
              key={person.user_id}
            >
              <strong>
                {person.first_name}{' '}
                {person.last_name}
              </strong>

              <button
                type="button"
                className="main-button"
                disabled={busy}
                onClick={() =>
                  requestPerson(person)
                }
              >
                Add friend
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p
          className="form-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {message && (
        <p role="status">
          {message}
        </p>
      )}

      <button
        type="button"
        className="secondary-button"
        disabled={busy || loading}
        onClick={() =>
          act(async () => {
            setMessage(
              'Friends and photos refreshed.'
            )
          })
        }
      >
        {busy
          ? 'Please wait...'
          : 'Refresh friends & photos'}
      </button>

      {loading ? (
        <p role="status">
          Loading friends...
        </p>
      ) : (
        <>
          <h3>Your connections</h3>

          {!links.length && (
            <p>
              No friends yet. Search by
              first and last name to get
              started.
            </p>
          )}

          {links.map(link => (
            <div
              className="friend-connection"
              key={link.id}
            >
              <strong>
                {nameFor(other(link))}
              </strong>

              <p>
                {link.status ===
                'accepted'
                  ? 'Friend'
                  : link.requester ===
                      userId
                    ? 'Request sent'
                    : 'Incoming request'}
              </p>

              {link.status ===
                'pending' &&
                link.recipient ===
                  userId && (
                  <button
                    disabled={busy}
                    className="main-button"
                    onClick={() =>
                      changeFriend(
                        link,
                        true
                      )
                    }
                  >
                    Accept
                  </button>
                )}

              <button
                disabled={busy}
                className="secondary-button"
                onClick={() =>
                  changeFriend(
                    link,
                    false
                  )
                }
              >
                {link.status ===
                'accepted'
                  ? 'Unfriend'
                  : link.requester ===
                      userId
                    ? 'Cancel request'
                    : 'Decline'}
              </button>
            </div>
          ))}

          <h3>
            Post a photo to a friend
          </h3>

          {!friends.length ? (
            <p>
              Accept a friend request
              before sharing photos.
            </p>
          ) : (
            <form
              className="profile-form"
              onSubmit={publish}
            >
              <label htmlFor="photo-friend">
                Friend
              </label>

              <select
                id="photo-friend"
                required
                value={recipient}
                onChange={event =>
                  setRecipient(
                    event.target.value
                  )
                }
              >
                <option value="">
                  Choose a friend
                </option>

                {friends.map(link => {
                  const friendId =
                    other(link)

                  return (
                    <option
                      key={link.id}
                      value={friendId}
                    >
                      {nameFor(friendId)}
                    </option>
                  )
                })}
              </select>

              <label htmlFor="friend-photo">
                Photo (JPEG, PNG, or
                WebP; maximum 5 MB)
              </label>

              <input
                id="friend-photo"
                ref={input}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                required
                onChange={event =>
                  setFile(
                    event.target
                      .files[0] || null
                  )
                }
              />

              <label htmlFor="photo-caption">
                Caption (optional)
              </label>

              <textarea
                id="photo-caption"
                maxLength={500}
                value={caption}
                onChange={event =>
                  setCaption(
                    event.target.value
                  )
                }
              />

              <button
                className="main-button"
                disabled={busy}
              >
                {busy
                  ? 'Please wait...'
                  : 'Post photo'}
              </button>
            </form>
          )}

          <h3>Shared photos</h3>

          <p className="small-text">
            Your latest 50 posts, sent
            and received. Unfriending
            removes your access to each
            other’s posts.
          </p>

          {!posts.length && (
            <p>
              No shared photos yet.
            </p>
          )}

          <div className="friend-photo-grid">
            {posts.map(post => {
              const personId =
                post.author === userId
                  ? post.recipient
                  : post.author

              return (
                <article
                  className="friend-post"
                  key={post.id}
                >
                  <p>
                    {post.author ===
                    userId
                      ? 'To'
                      : 'From'}{' '}
                    <strong>
                      {nameFor(personId)}
                    </strong>
                  </p>

                  <FriendPhoto
                    post={post}
                  />

                  {post.caption && (
                    <p>
                      {post.caption}
                    </p>
                  )}

                  <time
                    dateTime={
                      post.created_at
                    }
                  >
                    {new Date(
                      post.created_at
                    ).toLocaleString()}
                  </time>

                  <button
                    className="secondary-button"
                    disabled={busy}
                    onClick={() =>
                      removePost(post)
                    }
                  >
                    Remove post
                  </button>
                </article>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}