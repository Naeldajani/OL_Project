import type { Player } from './types'
import { seedPlayers } from '../data/seed-players'

export interface Role {
  id: string
  label: string
  x: number
  y: number
  postes: string[]
  fallback: string[]
}

export interface Formation {
  id: string
  label: string
  roles: Role[]
}

const GK = { id: 'gk', label: 'GK', x: 50, y: 92, postes: ['G'], fallback: [] }
const DD = { id: 'dd', label: 'DD', x: 80, y: 74, postes: ['DD'], fallback: ['DC'] }
const DG = { id: 'dg', label: 'DG', x: 20, y: 74, postes: ['DG'], fallback: ['DC'] }
const dc = (id: string, x: number, y = 80) => ({ id, label: 'DC', x, y, postes: ['DC'], fallback: [] })

export const FORMATIONS: Formation[] = [
  {
    id: '4-3-3',
    label: '4-3-3',
    roles: [
      GK, DD, dc('dc1', 60), dc('dc2', 40), DG,
      { id: 'mdc', label: 'MDC', x: 50, y: 58, postes: ['MDC'], fallback: ['MC'] },
      { id: 'mc1', label: 'MC', x: 32, y: 46, postes: ['MC'], fallback: ['MDC', 'MOC'] },
      { id: 'moc', label: 'MOC', x: 68, y: 46, postes: ['MOC'], fallback: ['MC'] },
      { id: 'ag', label: 'AG', x: 18, y: 20, postes: ['AG'], fallback: ['BU'] },
      { id: 'bu', label: 'BU', x: 50, y: 10, postes: ['BU'], fallback: ['AG', 'AD'] },
      { id: 'ad', label: 'AD', x: 82, y: 20, postes: ['AD'], fallback: ['BU'] },
    ],
  },
  {
    id: '4-4-2',
    label: '4-4-2',
    roles: [
      GK, DD, dc('dc1', 60), dc('dc2', 40), DG,
      { id: 'md', label: 'MD', x: 82, y: 46, postes: ['AD'], fallback: ['MC', 'MOC'] },
      { id: 'mc1', label: 'MC', x: 60, y: 50, postes: ['MC'], fallback: ['MDC', 'MOC'] },
      { id: 'mc2', label: 'MC', x: 40, y: 50, postes: ['MC'], fallback: ['MDC', 'MOC'] },
      { id: 'mg', label: 'MG', x: 18, y: 46, postes: ['AG'], fallback: ['MC', 'MOC'] },
      { id: 'bu1', label: 'BU', x: 62, y: 12, postes: ['BU'], fallback: ['AD', 'AG'] },
      { id: 'bu2', label: 'BU', x: 38, y: 12, postes: ['BU'], fallback: ['AG', 'AD'] },
    ],
  },
  {
    id: '4-2-3-1',
    label: '4-2-3-1',
    roles: [
      GK, DD, dc('dc1', 60), dc('dc2', 40), DG,
      { id: 'mdc1', label: 'MDC', x: 62, y: 60, postes: ['MDC'], fallback: ['MC'] },
      { id: 'mdc2', label: 'MDC', x: 38, y: 60, postes: ['MDC'], fallback: ['MC'] },
      { id: 'ag', label: 'AG', x: 18, y: 34, postes: ['AG'], fallback: ['BU'] },
      { id: 'moc', label: 'MOC', x: 50, y: 32, postes: ['MOC'], fallback: ['MC'] },
      { id: 'ad', label: 'AD', x: 82, y: 34, postes: ['AD'], fallback: ['BU'] },
      { id: 'bu', label: 'BU', x: 50, y: 10, postes: ['BU'], fallback: ['AG', 'AD'] },
    ],
  },
  {
    id: '3-4-3',
    label: '3-4-3',
    roles: [
      GK,
      dc('dc1', 70, 78), dc('dc2', 50, 80), dc('dc3', 30, 78),
      { id: 'mg', label: 'MG', x: 12, y: 56, postes: ['AG'], fallback: ['DG', 'MC'] },
      { id: 'mc1', label: 'MC', x: 40, y: 50, postes: ['MC'], fallback: ['MDC', 'MOC'] },
      { id: 'mc2', label: 'MC', x: 60, y: 50, postes: ['MC'], fallback: ['MDC', 'MOC'] },
      { id: 'md', label: 'MD', x: 88, y: 56, postes: ['AD'], fallback: ['DD', 'MC'] },
      { id: 'ag', label: 'AG', x: 18, y: 20, postes: ['AG'], fallback: ['BU'] },
      { id: 'bu', label: 'BU', x: 50, y: 10, postes: ['BU'], fallback: ['AG', 'AD'] },
      { id: 'ad', label: 'AD', x: 82, y: 20, postes: ['AD'], fallback: ['BU'] },
    ],
  },
]

// Recognizable names — the closest proxy we have to "famous enough to be
// guessable". Used both as a Best XI tie-break and to grade Devine le Gone
// difficulty (career length alone doesn't track how easy a player is to
// recognize).
export const NOTABLE = new Set([
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

function playersFor(postes: string[]): Player[] {
  return seedPlayers.filter((p) => p.posteFr && postes.includes(p.posteFr))
}

/** All eligible players for a role: the strict position code, then fallbacks if too few. */
export function eligiblePlayers(role: Role): Player[] {
  const strict = playersFor(role.postes)
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
