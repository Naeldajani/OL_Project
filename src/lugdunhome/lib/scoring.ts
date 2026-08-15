import type { Match } from '../../lib/types'
import type { Prediction } from './types'
import { bonusCorrect, bonusFor, labelOf, pointsFor } from './bonuses'

export const POINTS = {
  exactScore: 5,
  rightOutcome: 3,
  rightGoalDiff: 1,
} as const

/** Points earned by a prediction once the match is known. */
export function scorePrediction(p: Prediction, match: Match): number {
  let pts = 0
  const exact = p.homeScore === match.homeScore && p.awayScore === match.awayScore
  if (exact) {
    pts += POINTS.exactScore
  } else {
    const predOutcome =
      p.homeScore > p.awayScore ? 'home' : p.homeScore === p.awayScore ? 'draw' : 'away'
    const realOutcome =
      match.homeScore > match.awayScore
        ? 'home'
        : match.homeScore === match.awayScore
          ? 'draw'
          : 'away'
    if (predOutcome === realOutcome) pts += POINTS.rightOutcome
    if (p.homeScore - p.awayScore === match.homeScore - match.awayScore) pts += POINTS.rightGoalDiff
  }
  // Le bonus vaut ce que sa question annonce : une prédiction à trois
  // options ne peut pas rapporter autant qu'un buteur parmi onze.
  const choice = p.bonusChoice ?? p.scorerId
  if (choice) {
    const bonus = bonusFor(p.matchId)
    if (bonusCorrect(bonus, choice, match)) pts += pointsFor(bonus, choice)
  }
  return pts
}

/** Human-readable breakdown, used on the prediction cards. */
export function explainPrediction(p: Prediction, match: Match): string[] {
  const out: string[] = []
  if (p.homeScore === match.homeScore && p.awayScore === match.awayScore) {
    out.push(`Score exact +${POINTS.exactScore}`)
  } else {
    const predOutcome =
      p.homeScore > p.awayScore ? 'home' : p.homeScore === p.awayScore ? 'draw' : 'away'
    const realOutcome =
      match.homeScore > match.awayScore
        ? 'home'
        : match.homeScore === match.awayScore
          ? 'draw'
          : 'away'
    if (predOutcome === realOutcome) out.push(`Bon vainqueur +${POINTS.rightOutcome}`)
    if (p.homeScore - p.awayScore === match.homeScore - match.awayScore) {
      out.push(`Bon écart +${POINTS.rightGoalDiff}`)
    }
  }
  const choice = p.bonusChoice ?? p.scorerId
  if (choice) {
    const bonus = bonusFor(p.matchId)
    if (bonusCorrect(bonus, choice, match)) {
      out.push(`${labelOf(bonus, choice)} +${pointsFor(bonus, choice)}`)
    }
  }
  if (!out.length) out.push('Aucun point')
  return out
}

export interface Level {
  name: string
  min: number
  icon: string
}

export const LEVELS: Level[] = [
  { name: 'Nouveau Gone', min: 0, icon: '🌱' },
  { name: 'Habitué du Kop', min: 30, icon: '📣' },
  { name: 'Fidèle de Gerland', min: 90, icon: '🏟️' },
  { name: 'Voix de Lugdunum', min: 200, icon: '🦁' },
  { name: 'Légende des Gones', min: 400, icon: '👑' },
]

export function levelFor(points: number): { level: Level; next: Level | null; progress: number } {
  let idx = 0
  for (let i = 0; i < LEVELS.length; i++) if (points >= LEVELS[i].min) idx = i
  const level = LEVELS[idx]
  const next = LEVELS[idx + 1] ?? null
  const progress = next
    ? Math.min(1, (points - level.min) / (next.min - level.min))
    : 1
  return { level, next, progress }
}

export interface Badge {
  id: string
  label: string
  icon: string
  description: string
  earned: boolean
}

export function badgesFor(stats: {
  points: number
  predictions: number
  correct: number
  ratedMatches: number
  votes: number
  exactScores: number
}): Badge[] {
  return [
    {
      id: 'first-vote',
      label: 'Premier avis',
      icon: '🗳️',
      description: 'Participer pour la première fois',
      earned: stats.votes > 0 || stats.ratedMatches > 0,
    },
    {
      id: 'rater-10',
      label: 'Œil du Kop',
      icon: '⭐',
      description: 'Noter les joueurs sur 10 matchs',
      earned: stats.ratedMatches >= 10,
    },
    {
      id: 'prono-first',
      label: 'Devin du dimanche',
      icon: '🔮',
      description: 'Poser un premier pronostic',
      earned: stats.predictions > 0,
    },
    {
      id: 'exact-score',
      label: 'Dans le mille',
      icon: '🎯',
      description: 'Trouver un score exact',
      earned: stats.exactScores > 0,
    },
    {
      id: 'points-100',
      label: 'Centenaire',
      icon: '💯',
      description: 'Atteindre 100 points',
      earned: stats.points >= 100,
    },
    {
      id: 'legend',
      label: 'Légende',
      icon: '👑',
      description: 'Atteindre 400 points',
      earned: stats.points >= 400,
    },
  ]
}
