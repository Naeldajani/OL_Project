import { useCallback, useEffect, useState } from 'react'
import { backend } from '../lib/backend'
import type { MatchCommunity } from '../lib/types'

const EMPTY: MatchCommunity = {
  participants: 0,
  ratings: {},
  distribution: {},
  motm: {},
  debate: {},
}

/**
 * Loads everything one match page needs and re-reads after each vote, so the
 * aggregate the user sees always includes their own contribution.
 */
export function useMatchCommunity(matchId: string | undefined) {
  const [community, setCommunity] = useState<MatchCommunity>(EMPTY)
  const [myRatings, setMyRatings] = useState<Record<string, number>>({})
  const [myMotm, setMyMotm] = useState<string | null>(null)
  const [myDebate, setMyDebate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!matchId) return
    const [c, r, m, d] = await Promise.all([
      backend.getCommunity(matchId),
      backend.getMyRatings(matchId),
      backend.getMyMotm(matchId),
      backend.getMyDebateVote(matchId),
    ])
    setCommunity(c)
    setMyRatings(r)
    setMyMotm(m)
    setMyDebate(d)
    setLoading(false)
  }, [matchId])

  useEffect(() => {
    setLoading(true)
    refresh()
  }, [refresh])

  const ratePlayer = useCallback(
    async (player: string, rating: number) => {
      if (!matchId) return
      setMyRatings((prev) => ({ ...prev, [player]: rating })) // optimistic
      await backend.ratePlayer(matchId, player, rating)
      refresh()
    },
    [matchId, refresh],
  )

  const voteMotm = useCallback(
    async (player: string) => {
      if (!matchId) return
      setMyMotm(player)
      await backend.voteMotm(matchId, player)
      refresh()
    },
    [matchId, refresh],
  )

  const voteDebate = useCallback(
    async (optionId: string) => {
      if (!matchId) return
      setMyDebate(optionId)
      await backend.voteDebate(matchId, optionId)
      refresh()
    },
    [matchId, refresh],
  )

  return { community, myRatings, myMotm, myDebate, loading, ratePlayer, voteMotm, voteDebate, refresh }
}
