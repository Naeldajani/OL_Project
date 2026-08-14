import type { Backend, LhUser, LeaderboardRow, MatchCommunity, Prediction } from './types'
import { seedMatches } from '../../data/seed-matches'
import { scorePrediction } from './scoring'
import { accessToken, currentSession } from './auth'

/**
 * Real multi-user backend, talking to Supabase's PostgREST endpoint over
 * plain fetch (no SDK dependency). Enabled by setting both
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY; see supabase-schema.sql
 * for the tables and row-level-security policies this expects.
 *
 * L'identité vient du compte connecté (lib/auth). Un supporter qui a choisi
 * « continuer sans compte » garde un identifiant d'appareil : il vote
 * toujours, mais ses lignes ne sont rattachées à aucun profil et
 * n'apparaissent pas au classement.
 */
const URL_BASE = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export function supabaseConfigured(): boolean {
  return Boolean(URL_BASE && ANON_KEY)
}

const DEVICE_KEY = 'lh:device-id'

/** Identifiant qui signe les votes : celui du compte connecté, sinon celui
 *  de l'appareil. Les politiques RLS n'acceptent d'écrire que sur ses
 *  propres lignes, donc les deux cas restent cloisonnés. */
function deviceId(): string {
  const session = currentSession()
  if (session?.userId) return session.userId
  let id = localStorage.getItem(DEVICE_KEY)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

async function rest<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Le jeton du compte remplace la clé anonyme : c'est lui que PostgREST
  // lit pour peupler auth.uid() et appliquer les politiques RLS.
  const token = (await accessToken()) ?? ANON_KEY!
  const res = await fetch(`${URL_BASE}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: ANON_KEY!,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation,resolution=merge-duplicates',
      ...(init.headers ?? {}),
    },
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

const matchById = new Map(seedMatches.map((m) => [m.id, m]))

export const supabaseBackend: Backend = {
  kind: 'supabase',

  async getUser(): Promise<LhUser> {
    const id = deviceId()
    const rows = await rest<LhUser[]>(`profiles?id=eq.${id}&select=*`)
    if (rows.length) return rows[0]
    const session = currentSession()
    const created = {
      id,
      pseudo: session?.pseudo || 'Gone anonyme',
      avatar: session?.avatar || '🦁',
      createdAt: new Date().toISOString(),
    }
    await rest('profiles', { method: 'POST', body: JSON.stringify(created) })
    return created
  },

  async updateUser(patch) {
    const id = deviceId()
    const rows = await rest<LhUser[]>(`profiles?id=eq.${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    })
    return rows[0]
  },

  async getCommunity(matchId: string): Promise<MatchCommunity> {
    const [ratingRows, motmRows, debateRows] = await Promise.all([
      rest<{ player_id: string; rating: number }[]>(
        `player_ratings?match_id=eq.${matchId}&select=player_id,rating`,
      ),
      rest<{ player_id: string }[]>(`motm_votes?match_id=eq.${matchId}&select=player_id`),
      rest<{ option_id: string }[]>(`debate_votes?match_id=eq.${matchId}&select=option_id`),
    ])

    const ratings: MatchCommunity['ratings'] = {}
    const distribution: MatchCommunity['distribution'] = {}
    for (const r of ratingRows) {
      const cur = ratings[r.player_id] ?? { sum: 0, count: 0 }
      ratings[r.player_id] = { sum: cur.sum + r.rating, count: cur.count + 1 }
      const bucket = distribution[r.player_id] ?? new Array(10).fill(0)
      bucket[r.rating - 1] += 1
      distribution[r.player_id] = bucket
    }
    const motm: Record<string, number> = {}
    for (const r of motmRows) motm[r.player_id] = (motm[r.player_id] ?? 0) + 1
    const debate: Record<string, number> = {}
    for (const r of debateRows) debate[r.option_id] = (debate[r.option_id] ?? 0) + 1

    const participants = new Set([
      ...motmRows.map(() => 1),
      ...debateRows.map(() => 1),
    ]).size
    return {
      participants: Math.max(motmRows.length, debateRows.length, participants),
      ratings,
      distribution,
      motm,
      debate,
    }
  },

  async getMyRatings(matchId) {
    const rows = await rest<{ player_id: string; rating: number }[]>(
      `player_ratings?match_id=eq.${matchId}&user_id=eq.${deviceId()}&select=player_id,rating`,
    )
    return Object.fromEntries(rows.map((r) => [r.player_id, r.rating]))
  },

  async ratePlayer(matchId, playerId, rating) {
    await rest('player_ratings', {
      method: 'POST',
      body: JSON.stringify({
        match_id: matchId,
        player_id: playerId,
        user_id: deviceId(),
        rating,
      }),
    })
  },

  async getMyMotm(matchId) {
    const rows = await rest<{ player_id: string }[]>(
      `motm_votes?match_id=eq.${matchId}&user_id=eq.${deviceId()}&select=player_id`,
    )
    return rows[0]?.player_id ?? null
  },

  async voteMotm(matchId, playerId) {
    await rest('motm_votes', {
      method: 'POST',
      body: JSON.stringify({ match_id: matchId, player_id: playerId, user_id: deviceId() }),
    })
  },

  async getMyDebateVote(matchId) {
    const rows = await rest<{ option_id: string }[]>(
      `debate_votes?match_id=eq.${matchId}&user_id=eq.${deviceId()}&select=option_id`,
    )
    return rows[0]?.option_id ?? null
  },

  async voteDebate(matchId, optionId) {
    await rest('debate_votes', {
      method: 'POST',
      body: JSON.stringify({ match_id: matchId, option_id: optionId, user_id: deviceId() }),
    })
  },

  async getMyPrediction(matchId) {
    const rows = await rest<Prediction[]>(
      `predictions?match_id=eq.${matchId}&user_id=eq.${deviceId()}&select=*`,
    )
    return rows[0] ?? null
  },

  async savePrediction(p) {
    await rest('predictions', {
      method: 'POST',
      body: JSON.stringify({
        match_id: p.matchId,
        user_id: deviceId(),
        home_score: p.homeScore,
        away_score: p.awayScore,
        bonus_choice: p.bonusChoice ?? null,
      }),
    })
  },

  async getMyPredictions() {
    const rows = await rest<
      { match_id: string; home_score: number; away_score: number; bonus_choice: string | null }[]
    >(`predictions?user_id=eq.${deviceId()}&select=*`)
    return rows.map((r) => ({
      matchId: r.match_id,
      userId: deviceId(),
      homeScore: r.home_score,
      awayScore: r.away_score,
      bonusChoice: r.bonus_choice,
    }))
  },

  async getLeaderboard(): Promise<LeaderboardRow[]> {
    const [profiles, predictions, ratings, motm, debate] = await Promise.all([
      rest<LhUser[]>('profiles?select=*'),
      rest<
        { user_id: string; match_id: string; home_score: number; away_score: number; bonus_choice: string | null }[]
      >('predictions?select=*'),
      rest<{ user_id: string; match_id: string }[]>('player_ratings?select=user_id,match_id'),
      rest<{ user_id: string }[]>('motm_votes?select=user_id'),
      rest<{ user_id: string }[]>('debate_votes?select=user_id'),
    ])

    const byUser = new Map<string, LeaderboardRow>()
    for (const p of profiles) {
      byUser.set(p.id, {
        userId: p.id,
        pseudo: p.pseudo,
        avatar: p.avatar,
        points: 0,
        predictions: 0,
        correct: 0,
        accuracy: 0,
        ratedMatches: 0,
        votes: 0,
      })
    }
    for (const pred of predictions) {
      const row = byUser.get(pred.user_id)
      const match = matchById.get(pred.match_id)
      if (!row || !match) continue
      const pts = scorePrediction(
        {
          matchId: pred.match_id,
          userId: pred.user_id,
          homeScore: pred.home_score,
          awayScore: pred.away_score,
          bonusChoice: pred.bonus_choice,
        },
        match,
      )
      row.predictions += 1
      row.points += pts
      if (pts > 0) row.correct += 1
    }
    const ratedByUser = new Map<string, Set<string>>()
    for (const r of ratings) {
      if (!ratedByUser.has(r.user_id)) ratedByUser.set(r.user_id, new Set())
      ratedByUser.get(r.user_id)!.add(r.match_id)
    }
    for (const [uid, set] of ratedByUser) {
      const row = byUser.get(uid)
      if (row) row.ratedMatches = set.size
    }
    for (const v of [...motm, ...debate]) {
      const row = byUser.get(v.user_id)
      if (row) row.votes += 1
    }
    for (const row of byUser.values()) {
      row.accuracy = row.predictions ? row.correct / row.predictions : 0
    }
    return [...byUser.values()].sort((a, b) => b.points - a.points)
  },
}
