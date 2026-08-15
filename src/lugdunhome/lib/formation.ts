import type { LineupEntry } from './lineups'

/**
 * Place les onze titulaires sur un terrain vu du dessus.
 *
 * Les compositions ne portent pas de coordonnées, seulement un poste écrit en
 * clair (« Défenseur central », « Milieu offensif »…). On classe donc chaque
 * poste en ligne (gardien, défense, milieu, attaque) et en couloir (gauche,
 * axe, droite), puis on répartit chaque ligne sur la largeur.
 *
 * Le couloir compte autant que la ligne : sans lui, un latéral droit se
 * retrouverait au centre et la composition affichée n'aurait plus rien à voir
 * avec celle qui a joué.
 */
export interface Spot {
  entry: LineupEntry
  /** pourcentages, origine en haut à gauche du terrain */
  x: number
  y: number
}

type Line = 'gk' | 'def' | 'mid' | 'att'
type Lane = 'left' | 'center' | 'right'

const LINE_Y: Record<Line, number> = { gk: 92, def: 73, mid: 48, att: 22 }

function classify(position: string): { line: Line; lane: Lane; depth: number } {
  const p = position.toLowerCase()
  const lane: Lane = /gauche/.test(p) ? 'left' : /droit/.test(p) ? 'right' : 'center'

  if (/gardien/.test(p)) return { line: 'gk', lane: 'center', depth: 0 }
  if (/arrière|latéral|défenseur|libéro/.test(p)) return { line: 'def', lane, depth: 0 }
  if (/ailier|avant|attaquant|buteur/.test(p)) return { line: 'att', lane, depth: 0 }
  if (/milieu/.test(p)) {
    // un milieu défensif recule, un offensif avance : sans cette nuance un
    // 4-2-3-1 s'affiche comme un 4-5-1 tout plat
    const depth = /défensif|récupérateur/.test(p) ? 1 : /offensif|relayeur/.test(p) ? -1 : 0
    return { line: 'mid', lane, depth }
  }
  return { line: 'mid', lane, depth: 0 }
}

const LANE_ORDER: Record<Lane, number> = { left: 0, center: 1, right: 2 }

export function placeOnPitch(starters: LineupEntry[]): Spot[] {
  const classified = starters.map((entry) => ({ entry, ...classify(entry.position) }))
  const spots: Spot[] = []

  for (const line of ['gk', 'def', 'mid', 'att'] as Line[]) {
    const group = classified
      .filter((c) => c.line === line)
      .sort((a, b) => LANE_ORDER[a.lane] - LANE_ORDER[b.lane])

    group.forEach((c, i) => {
      // réparti sur la largeur utile, jamais collé au bord
      const width = 78
      const step = group.length > 1 ? width / (group.length - 1) : 0
      const x = group.length === 1 ? 50 : 11 + i * step
      spots.push({ entry: c.entry, x, y: LINE_Y[line] + c.depth * 8 })
    })
  }
  return spots
}

/** « 4-2-3-1 » déduit du nombre de joueurs par ligne, pour l'afficher. */
export function formationLabel(starters: LineupEntry[]): string {
  const counts = { def: 0, midDeep: 0, midHigh: 0, att: 0 }
  for (const entry of starters) {
    const { line, depth } = classify(entry.position)
    if (line === 'def') counts.def += 1
    else if (line === 'mid') (depth > 0 ? counts.midDeep++ : counts.midHigh++)
    else if (line === 'att') counts.att += 1
  }
  return [counts.def, counts.midDeep, counts.midHigh, counts.att].filter(Boolean).join('-')
}
