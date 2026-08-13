import type { Player } from './types'
import { seedPlayers } from '../data/seed-players'

export interface Role {
  id: string
  label: string
  x: number
  y: number
  subPositions: string[]
  fallback: string[]
}

export interface Formation {
  id: string
  label: string
  roles: Role[]
}

export const FORMATIONS: Formation[] = [
  {
    id: '4-3-3',
    label: '4-3-3',
    roles: [
      { id: 'gk', label: 'Gardien', x: 50, y: 92, subPositions: ['Goalkeeper'], fallback: [] },
      { id: 'rb', label: 'Arrière droit', x: 80, y: 72, subPositions: ['Right-Back'], fallback: ['Full-Back'] },
      { id: 'cb1', label: 'Défenseur central', x: 60, y: 78, subPositions: ['Centre-Back'], fallback: [] },
      { id: 'cb2', label: 'Défenseur central', x: 40, y: 78, subPositions: ['Centre-Back'], fallback: [] },
      { id: 'lb', label: 'Arrière gauche', x: 20, y: 72, subPositions: ['Left-Back'], fallback: ['Full-Back'] },
      { id: 'dm', label: 'Milieu défensif', x: 50, y: 58, subPositions: ['Defensive Midfielder'], fallback: ['Central Midfielder'] },
      { id: 'cm', label: 'Milieu central', x: 32, y: 46, subPositions: ['Central Midfielder'], fallback: ['Defensive Midfielder'] },
      { id: 'am', label: 'Milieu offensif', x: 68, y: 46, subPositions: ['Attacking Midfielder'], fallback: ['Central Midfielder'] },
      { id: 'lw', label: 'Ailier gauche', x: 18, y: 20, subPositions: ['Left Winger'], fallback: ['Winger', 'Striker'] },
      { id: 'st', label: 'Avant-centre', x: 50, y: 10, subPositions: ['Striker'], fallback: ['Winger'] },
      { id: 'rw', label: 'Ailier droit', x: 82, y: 20, subPositions: ['Right Winger'], fallback: ['Winger', 'Striker'] },
    ],
  },
  {
    id: '4-4-2',
    label: '4-4-2',
    roles: [
      { id: 'gk', label: 'Gardien', x: 50, y: 92, subPositions: ['Goalkeeper'], fallback: [] },
      { id: 'rb', label: 'Arrière droit', x: 80, y: 72, subPositions: ['Right-Back'], fallback: ['Full-Back'] },
      { id: 'cb1', label: 'Défenseur central', x: 60, y: 78, subPositions: ['Centre-Back'], fallback: [] },
      { id: 'cb2', label: 'Défenseur central', x: 40, y: 78, subPositions: ['Centre-Back'], fallback: [] },
      { id: 'lb', label: 'Arrière gauche', x: 20, y: 72, subPositions: ['Left-Back'], fallback: ['Full-Back'] },
      { id: 'rm', label: 'Milieu droit', x: 82, y: 46, subPositions: ['Right Winger'], fallback: ['Winger', 'Central Midfielder'] },
      { id: 'cm1', label: 'Milieu central', x: 60, y: 50, subPositions: ['Central Midfielder'], fallback: ['Defensive Midfielder'] },
      { id: 'cm2', label: 'Milieu central', x: 40, y: 50, subPositions: ['Central Midfielder'], fallback: ['Defensive Midfielder'] },
      { id: 'lm', label: 'Milieu gauche', x: 18, y: 46, subPositions: ['Left Winger'], fallback: ['Winger', 'Central Midfielder'] },
      { id: 'st1', label: 'Attaquant', x: 62, y: 12, subPositions: ['Striker'], fallback: ['Winger'] },
      { id: 'st2', label: 'Attaquant', x: 38, y: 12, subPositions: ['Striker'], fallback: ['Winger'] },
    ],
  },
  {
    id: '4-2-3-1',
    label: '4-2-3-1',
    roles: [
      { id: 'gk', label: 'Gardien', x: 50, y: 92, subPositions: ['Goalkeeper'], fallback: [] },
      { id: 'rb', label: 'Arrière droit', x: 80, y: 74, subPositions: ['Right-Back'], fallback: ['Full-Back'] },
      { id: 'cb1', label: 'Défenseur central', x: 60, y: 80, subPositions: ['Centre-Back'], fallback: [] },
      { id: 'cb2', label: 'Défenseur central', x: 40, y: 80, subPositions: ['Centre-Back'], fallback: [] },
      { id: 'lb', label: 'Arrière gauche', x: 20, y: 74, subPositions: ['Left-Back'], fallback: ['Full-Back'] },
      { id: 'dm1', label: 'Milieu défensif', x: 62, y: 60, subPositions: ['Defensive Midfielder'], fallback: ['Central Midfielder'] },
      { id: 'dm2', label: 'Milieu défensif', x: 38, y: 60, subPositions: ['Defensive Midfielder'], fallback: ['Central Midfielder'] },
      { id: 'lw', label: 'Ailier gauche', x: 18, y: 34, subPositions: ['Left Winger'], fallback: ['Winger'] },
      { id: 'am', label: 'Milieu offensif', x: 50, y: 32, subPositions: ['Attacking Midfielder'], fallback: ['Central Midfielder'] },
      { id: 'rw', label: 'Ailier droit', x: 82, y: 34, subPositions: ['Right Winger'], fallback: ['Winger'] },
      { id: 'st', label: 'Avant-centre', x: 50, y: 10, subPositions: ['Striker'], fallback: ['Winger'] },
    ],
  },
  {
    id: '3-5-2',
    label: '3-5-2',
    roles: [
      { id: 'gk', label: 'Gardien', x: 50, y: 92, subPositions: ['Goalkeeper'], fallback: [] },
      { id: 'cb1', label: 'Défenseur central', x: 70, y: 78, subPositions: ['Centre-Back'], fallback: [] },
      { id: 'cb2', label: 'Défenseur central', x: 50, y: 80, subPositions: ['Centre-Back'], fallback: [] },
      { id: 'cb3', label: 'Défenseur central', x: 30, y: 78, subPositions: ['Centre-Back'], fallback: [] },
      { id: 'rwb', label: 'Piston droit', x: 88, y: 56, subPositions: ['Right-Back'], fallback: ['Full-Back'] },
      { id: 'dm', label: 'Milieu défensif', x: 50, y: 58, subPositions: ['Defensive Midfielder'], fallback: ['Central Midfielder'] },
      { id: 'cm', label: 'Milieu central', x: 68, y: 40, subPositions: ['Central Midfielder'], fallback: ['Defensive Midfielder'] },
      { id: 'am', label: 'Milieu offensif', x: 32, y: 40, subPositions: ['Attacking Midfielder'], fallback: ['Central Midfielder'] },
      { id: 'lwb', label: 'Piston gauche', x: 12, y: 56, subPositions: ['Left-Back'], fallback: ['Full-Back'] },
      { id: 'st1', label: 'Attaquant', x: 62, y: 12, subPositions: ['Striker'], fallback: ['Winger'] },
      { id: 'st2', label: 'Attaquant', x: 38, y: 12, subPositions: ['Striker'], fallback: ['Winger'] },
    ],
  },
]

// Recognizable names — used only as a light tie-break, not a filter.
const NOTABLE = new Set([
  'Anthony Lopes', 'Grégory Coupet', 'Rémy Vercoutre',
  'Cris', 'Sébastien Squillaci', 'Anthony Réveillère', 'Nicolás Tagliafico',
  'Éric Abidal', 'Jérémy Morel', 'Samuel Umtiti', 'Mapou Yanga-Mbiwa',
  'Sinaly Diomandé', 'Duje Ćaleta-Car', 'Henri Saivet',
  'Jérémy Toulalan', 'Juninho Pernambucano', 'Yoann Gourcuff', 'Clément Grenier',
  'Corentin Tolisso', 'Tanguy Ndombele', 'Houssem Aouar', 'Maxence Caqueret',
  'Lucas Paquetá', 'Bruno Guimarães', 'Rayan Cherki',
  'Sidney Govou', 'Florent Malouda', 'Sylvain Wiltord', 'Karim Benzema',
  'Nabil Fekir', 'Alexandre Lacazette', 'Hatem Ben Arfa', 'Memphis Depay',
  'Moussa Dembélé', 'Maxwel Cornet', 'Bertrand Traoré', 'Bafétimbi Gomis',
  'Lisandro López', 'Michael Essien',
])

function playersFor(subPositions: string[]): Player[] {
  return seedPlayers.filter((p) => p.subPosition && subPositions.includes(p.subPosition))
}

/** All eligible players for a role: the strict sub-position tag, then fallbacks if too few. */
export function eligiblePlayers(role: Role): Player[] {
  const strict = playersFor(role.subPositions)
  if (strict.length >= 3) return strict
  const withFallback = [...strict, ...playersFor(role.fallback)]
  const seen = new Set<string>()
  return withFallback.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)))
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Draw `count` genuinely random candidates for a role (re-rolled on each open). */
export function randomShortlist(role: Role, count = 3, exclude: Set<string> = new Set()): Player[] {
  const pool = eligiblePlayers(role).filter((p) => !exclude.has(p.id))
  return shuffle(pool).slice(0, count)
}

/** A light default pick used only to preview a formation before it's picked (never pre-filled in-game). */
export function bestGuess(role: Role, exclude: Set<string> = new Set()): Player | undefined {
  const pool = eligiblePlayers(role).filter((p) => !exclude.has(p.id))
  return pool.find((p) => NOTABLE.has(p.name)) ?? pool[0]
}
