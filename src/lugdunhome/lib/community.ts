import type { Match } from '../../lib/types'
import { olScore, oppScore, result } from '../../lib/matchHelpers'
import { lineupFor } from './lineups'

/** Deterministic hash -> 32-bit int. Same input always gives the same
 * community, so numbers never jump around between reloads. */
function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** Seeded [0,1) generator. */
export function rng(seed: string): () => number {
  let s = hash(seed) || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    s >>>= 0
    return s / 4294967296
  }
}

export function randInt(seed: string, min: number, max: number): number {
  return min + Math.floor(rng(seed)() * (max - min + 1))
}

const FIRST_NAMES = [
  'Thomas', 'Julien', 'Maxime', 'Antoine', 'Lucas', 'Hugo', 'Nicolas', 'Kevin',
  'Romain', 'Alexandre', 'Mathieu', 'Quentin', 'Florian', 'Damien', 'Sofiane',
  'Karim', 'Yanis', 'Rayan', 'Mehdi', 'Enzo', 'Léa', 'Manon', 'Camille',
  'Sarah', 'Chloé', 'Inès', 'Jade', 'Emma', 'Louise', 'Nina',
]
const HANDLES = [
  'Gone', 'Lyonnais', 'Rhone', 'Fourviere', 'Gerland', 'Decines', 'OL', 'Lugdunum',
  'Bellecour', 'Croix Rousse', 'Presqu ile', 'Part Dieu', 'Confluence', 'Vaise',
  'Guillotiere', 'Saone', 'Tete d Or', 'Villeurbanne', 'Monplaisir', 'Terreaux',
]
const AVATARS = ['🦁', '⚽', '🔴', '🔵', '🏟️', '🥇', '🎯', '🔥', '💪', '👑', '🧤', '⭐', '🎽', '📣', '🇫🇷']

export interface SimUser {
  id: string
  pseudo: string
  avatar: string
}

/** A stable, believable pool of fellow supporters. */
export function communityPool(size = 180): SimUser[] {
  const out: SimUser[] = []
  for (let i = 0; i < size; i++) {
    const r = rng(`user-${i}`)
    const first = FIRST_NAMES[Math.floor(r() * FIRST_NAMES.length)]
    const handle = HANDLES[Math.floor(r() * HANDLES.length)].replace(/\s/g, '')
    const avatar = AVATARS[Math.floor(r() * AVATARS.length)]
    const suffix = Math.floor(r() * 99)
    out.push({ id: `sim-${i}`, pseudo: `${first}${handle}${suffix}`, avatar })
  }
  return out
}

/** How many supporters engaged with a given match. Bigger games draw more. */
export function participantsFor(match: Match): number {
  const base = randInt(`participants-${match.id}`, 320, 1450)
  const big = /Champions|Europa|Coupe de France|Trophée/i.test(match.competition) ? 1.6 : 1
  const derby = /Marseille|PSG|Paris|Saint-Étienne|Saint-Etienne/i.test(
    match.home === 'Lyon' ? match.away : match.home,
  )
    ? 1.9
    : 1
  return Math.round(base * big * derby)
}

/**
 * Simulated community rating for one player in one match.
 * Anchored on reality: the team's result and whether the player scored
 * drive the average, so the numbers read as plausible football opinion.
 */
export function simulatedRating(match: Match, playerName: string): { avg: number; count: number } {
  const r = result(match)
  const gf = olScore(match)
  const ga = oppScore(match)

  let base = 5.4
  if (r === 'V') base += 0.9
  else if (r === 'D') base -= 0.7
  base += Math.max(-0.8, Math.min(0.8, (gf - ga) * 0.22))

  const scored = match.scorers.filter(
    (s) => s.team === (match.home === 'Lyon' ? 'home' : 'away') && s.player === playerName,
  ).length
  const assisted = match.scorers.filter(
    (s) => s.team === (match.home === 'Lyon' ? 'home' : 'away') && s.assist === playerName,
  ).length
  base += scored * 1.15 + assisted * 0.55

  // stable per-player-per-match spread
  const jitter = (rng(`rate-${match.id}-${playerName}`)() - 0.5) * 1.7
  const avg = Math.max(2.2, Math.min(9.6, base + jitter))

  const participants = participantsFor(match)
  const count = Math.round(participants * (0.55 + rng(`rc-${match.id}-${playerName}`)() * 0.35))
  return { avg: Math.round(avg * 10) / 10, count }
}

/** Community man-of-the-match distribution, weighted by simulated ratings. */
export function simulatedMotm(match: Match): Record<string, number> {
  const squad = lineupFor(match.id).filter((p) => p.role === 'titulaire')
  const names = squad.length ? squad.map((p) => p.player) : []
  if (!names.length) return {}

  const weights = names.map((n) => {
    const { avg } = simulatedRating(match, n)
    return Math.pow(Math.max(0.2, avg - 4), 2.4)
  })
  const total = weights.reduce((a, b) => a + b, 0) || 1
  const participants = participantsFor(match)

  const out: Record<string, number> = {}
  let assigned = 0
  names.forEach((n, i) => {
    const votes = Math.floor((weights[i] / total) * participants)
    if (votes > 0) out[n] = votes
    assigned += votes
  })
  // hand the rounding remainder to the current leader
  const leader = Object.entries(out).sort((a, b) => b[1] - a[1])[0]
  if (leader && participants - assigned > 0) out[leader[0]] += participants - assigned
  return out
}
