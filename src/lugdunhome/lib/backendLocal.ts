import type { Backend, LhUser, LeaderboardRow, MatchCommunity, Prediction } from './types'
import { seedMatches } from '../../data/seed-matches'
import { communityPool, participantsFor, simulatedMotm, simulatedRating, rng } from './community'
import { simulatedDebate } from './debates'
import { lineupFor } from './lineups'
import { scorePrediction } from './scoring'

const K = {
  user: 'lh:user',
  ratings: 'lh:ratings',
  motm: 'lh:motm',
  debate: 'lh:debate',
  predictions: 'lh:predictions',
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* private mode */
  }
}

const matchById = new Map(seedMatches.map((m) => [m.id, m]))

/**
 * Local backend: your own actions persist in this browser and are blended
 * into a deterministic simulated community, so every screen shows real
 * aggregate behaviour instead of empty state.
 */
export const localBackend: Backend = {
  kind: 'local',

  async getUser(): Promise<LhUser> {
    const existing = read<LhUser | null>(K.user, null)
    if (existing) return existing
    const created: LhUser = {
      id: `me-${Math.random().toString(36).slice(2, 9)}`,
      pseudo: 'Gone anonyme',
      avatar: '🦁',
      createdAt: new Date().toISOString(),
    }
    write(K.user, created)
    return created
  },

  async updateUser(patch) {
    const user = await this.getUser()
    const next = { ...user, ...patch }
    write(K.user, next)
    return next
  },

  async getCommunity(matchId: string): Promise<MatchCommunity> {
    const match = matchById.get(matchId)
    if (!match) {
      return { participants: 0, ratings: {}, motm: {}, debate: {} }
    }
    const participants = participantsFor(match)

    const ratings: MatchCommunity['ratings'] = {}
    for (const entry of lineupFor(matchId)) {
      const { avg, count } = simulatedRating(match, entry.player)
      ratings[entry.player] = { sum: avg * count, count }
    }
    // fold in this browser's own votes
    const mine = read<Record<string, Record<string, number>>>(K.ratings, {})[matchId] ?? {}
    for (const [player, value] of Object.entries(mine)) {
      const cur = ratings[player] ?? { sum: 0, count: 0 }
      ratings[player] = { sum: cur.sum + value, count: cur.count + 1 }
    }

    const motm = simulatedMotm(match)
    const myMotm = read<Record<string, string>>(K.motm, {})[matchId]
    if (myMotm) motm[myMotm] = (motm[myMotm] ?? 0) + 1

    const debate = simulatedDebate(match, participants)
    const myDebate = read<Record<string, string>>(K.debate, {})[matchId]
    if (myDebate) debate[myDebate] = (debate[myDebate] ?? 0) + 1

    return { participants: participants + (myMotm || myDebate ? 1 : 0), ratings, motm, debate }
  },

  async getMyRatings(matchId: string) {
    return read<Record<string, Record<string, number>>>(K.ratings, {})[matchId] ?? {}
  },

  async ratePlayer(matchId, playerId, rating) {
    const all = read<Record<string, Record<string, number>>>(K.ratings, {})
    all[matchId] = { ...(all[matchId] ?? {}), [playerId]: rating }
    write(K.ratings, all)
  },

  async getMyMotm(matchId) {
    return read<Record<string, string>>(K.motm, {})[matchId] ?? null
  },

  async voteMotm(matchId, playerId) {
    const all = read<Record<string, string>>(K.motm, {})
    all[matchId] = playerId
    write(K.motm, all)
  },

  async getMyDebateVote(matchId) {
    return read<Record<string, string>>(K.debate, {})[matchId] ?? null
  },

  async voteDebate(matchId, optionId) {
    const all = read<Record<string, string>>(K.debate, {})
    all[matchId] = optionId
    write(K.debate, all)
  },

  async getMyPrediction(matchId) {
    const all = read<Record<string, Prediction>>(K.predictions, {})
    return all[matchId] ?? null
  },

  async savePrediction(p) {
    const user = await this.getUser()
    const all = read<Record<string, Prediction>>(K.predictions, {})
    all[p.matchId] = { ...p, userId: user.id }
    write(K.predictions, all)
  },

  async getMyPredictions() {
    return Object.values(read<Record<string, Prediction>>(K.predictions, {}))
  },

  async getLeaderboard(): Promise<LeaderboardRow[]> {
    const user = await this.getUser()
    const mine = await this.getMyPredictions()

    let myPoints = 0
    let myCorrect = 0
    for (const p of mine) {
      const match = matchById.get(p.matchId)
      if (!match) continue
      const pts = scorePrediction(p, match)
      myPoints += pts
      if (pts > 0) myCorrect += 1
    }
    const myRatings = read<Record<string, Record<string, number>>>(K.ratings, {})
    const myVotes =
      Object.keys(read<Record<string, string>>(K.motm, {})).length +
      Object.keys(read<Record<string, string>>(K.debate, {})).length

    const rows: LeaderboardRow[] = communityPool().map((u, i) => {
      const r = rng(`lb-${u.id}`)
      const predictions = 8 + Math.floor(r() * 90)
      const accuracy = 0.18 + r() * 0.42
      const correct = Math.round(predictions * accuracy)
      const points = correct * 3 + Math.round(r() * predictions * 2)
      return {
        userId: u.id,
        pseudo: u.pseudo,
        avatar: u.avatar,
        points,
        predictions,
        correct,
        accuracy: predictions ? correct / predictions : 0,
        ratedMatches: 3 + Math.floor(rng(`lbm-${i}`)() * 60),
        votes: 5 + Math.floor(rng(`lbv-${i}`)() * 120),
      }
    })

    rows.push({
      userId: user.id,
      pseudo: user.pseudo,
      avatar: user.avatar,
      points: myPoints,
      predictions: mine.length,
      correct: myCorrect,
      accuracy: mine.length ? myCorrect / mine.length : 0,
      ratedMatches: Object.keys(myRatings).length,
      votes: myVotes,
    })

    return rows.sort((a, b) => b.points - a.points)
  },
}
