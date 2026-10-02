export function friendError(error, fallback = 'Could not load friends and photos.') {
  if (error?.message?.includes('Friend request limit reached')) return 'Friend request limit reached. Try again later.'
  if (error?.message?.includes('Photo post limit reached')) return 'Photo post limit reached. Try again later.'
  const code = error?.code
  if (['42P01', 'PGRST205'].includes(code)) return 'Friends and photos setup is missing. The site administrator needs to apply the friends-and-photos database migration.'
  if (code === '23503') return 'No account matches that friend code. Ask your friend to copy their code from Friends & photos.'
  if (code === '23505') return 'A request or friendship already exists. Refresh your connections to see it.'
  if (['42501', 'PGRST301', 'PGRST302', 'PGRST303'].includes(code)) return 'Your account could not access friends. Sign in again and retry. If this continues, the site administrator needs to check database permissions.'
  return `${fallback} Please retry.${code ? ` Error code: ${code}.` : ''}`
}

export async function sendFriendRequest(client, userId, value) {
  const target = value.trim().toLowerCase()
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(target)) throw new Error('Enter the complete friend code copied from your friend’s account.')
  if (target === userId.toLowerCase()) throw new Error('That is your own code. Ask your friend for their code from Friends & photos.')

  async function findConnection() {
    const { data, error } = await client.from('friendships').select('*')
      .or(`and(requester.eq.${userId},recipient.eq.${target}),and(requester.eq.${target},recipient.eq.${userId})`)
      .maybeSingle()
    if (error) throw new Error(friendError(error, 'Could not check your connections.'))
    return data
  }
  function existingMessage(link) {
    if (link.status === 'accepted') return 'You are already friends. Select this friend below to share a photo.'
    return link.requester === userId
      ? 'Your request is already sent. Your friend needs to accept it from their account.'
      : 'This friend has already sent you a request. Select Accept under Your connections.'
  }

  const existing = await findConnection()
  if (existing) return existingMessage(existing)
  const { error } = await client.from('friendships').insert({ requester: userId, recipient: target })
  if (error?.code === '23505') {
    const connection = await findConnection()
    if (connection) return existingMessage(connection)
  }
  if (error) throw new Error(friendError(error, 'Could not send your friend request.'))
  return 'Friend request sent. Your friend can accept it from their account.'
}
