export interface LhUser {
  id: string
  pseudo: string
  avatar: string
  createdAt: string
}

export interface PlayerRating {
  matchId: string
  playerId: string
  userId: string
  rating: number // 1..10
}

export interface MotmVote {
  matchId: string
  playerId: string
  userId: string
}

export interface DebateVote {
  matchId: string
  optionId: string
  userId: string
}

export interface Prediction {
  matchId: string
  userId: string
  homeScore: number
  awayScore: number
  scorerId?: string | null
  /** filled in once the match is played and scored */
  points?: number
}

/** Aggregated community numbers for one match, whatever the backend. */
export interface MatchCommunity {
  participants: number
  ratings: Record<string, { sum: number; count: number }>
  motm: Record<string, number>
  debate: Record<string, number>
}

export interface LeaderboardRow {
  userId: string
  pseudo: string
  avatar: string
  points: number
  predictions: number
  correct: number
  accuracy: number
  ratedMatches: number
  votes: number
}

/** Everything a page needs, regardless of local vs remote backend. */
export interface Backend {
  readonly kind: 'local' | 'supabase'
  getUser(): Promise<LhUser>
  updateUser(patch: Partial<Pick<LhUser, 'pseudo' | 'avatar'>>): Promise<LhUser>

  getCommunity(matchId: string): Promise<MatchCommunity>
  getMyRatings(matchId: string): Promise<Record<string, number>>
  ratePlayer(matchId: string, playerId: string, rating: number): Promise<void>

  getMyMotm(matchId: string): Promise<string | null>
  voteMotm(matchId: string, playerId: string): Promise<void>

  getMyDebateVote(matchId: string): Promise<string | null>
  voteDebate(matchId: string, optionId: string): Promise<void>

  getMyPrediction(matchId: string): Promise<Prediction | null>
  savePrediction(p: Omit<Prediction, 'userId'>): Promise<void>
  getMyPredictions(): Promise<Prediction[]>

  getLeaderboard(): Promise<LeaderboardRow[]>
}
