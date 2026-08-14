import type { Match } from '../../lib/types'
import { OL_NAMES } from '../../lib/matchHelpers'
import { lineupFor } from './lineups'

/**
 * Le bonus du pronostic — la question en plus du score, différente d'un
 * match à l'autre comme sur un site de paris.
 *
 * Contrainte qui a dicté la liste : un bonus doit pouvoir être *tranché*
 * avec les données du projet, c'est-à-dire le score final et la liste
 * ordonnée des buteurs. Les tirs, corners et cartons ne sont nulle part
 * dans les sources, donc pas de question dessus : elle ne rapporterait
 * jamais de points, ce qui serait pire que de ne pas la poser.
 */
export type BonusKind =
  | 'scorer'
  | 'firstGoal'
  | 'btts'
  | 'totalGoals'
  | 'cleanSheet'
  | 'margin'
  | 'olGoals'
  | 'halfTime'

export interface BonusOption {
  id: string
  label: string
  /** nom du joueur, pour afficher un visage plutôt qu'une pastille */
  player?: string
}

export interface Bonus {
  kind: BonusKind
  question: string
  hint: string
  points: number
  options: BonusOption[]
  /** Affichage en grille de visages plutôt qu'en pastilles. */
  faces?: boolean
}

/** Catalogue, hors « buteur » qui dépend de la composition. */
const CATALOGUE: Record<Exclude<BonusKind, 'scorer'>, Omit<Bonus, 'kind'>> = {
  firstGoal: {
    question: 'Qui ouvre le score ?',
    hint: 'La première équipe à marquer, quel que soit le résultat final.',
    points: 3,
    options: [
      { id: 'ol', label: "🦁 L'OL" },
      { id: 'adv', label: "🛡️ L'adversaire" },
      { id: 'none', label: '🚫 Aucun but' },
    ],
  },
  btts: {
    question: 'Les deux équipes marquent ?',
    hint: 'Il faut au moins un but de chaque côté.',
    points: 2,
    options: [
      { id: 'oui', label: '✅ Oui' },
      { id: 'non', label: '❌ Non' },
    ],
  },
  totalGoals: {
    question: 'Combien de buts dans le match ?',
    hint: 'Total des deux équipes.',
    points: 3,
    options: [
      { id: '0-1', label: '0 ou 1 but' },
      { id: '2-3', label: '2 ou 3 buts' },
      { id: '4+', label: '4 buts ou plus' },
    ],
  },
  cleanSheet: {
    question: "L'OL garde sa cage inviolée ?",
    hint: 'Aucun but encaissé sur les 90 minutes.',
    points: 3,
    options: [
      { id: 'oui', label: '🧤 Oui, clean sheet' },
      { id: 'non', label: '💧 Non, il encaisse' },
    ],
  },
  margin: {
    question: "Quel écart à l'arrivée ?",
    hint: "Différence de buts, peu importe qui l'emporte.",
    points: 3,
    options: [
      { id: '0', label: '🤝 Match nul' },
      { id: '1', label: '1 but' },
      { id: '2', label: '2 buts' },
      { id: '3+', label: '3 buts ou plus' },
    ],
  },
  olGoals: {
    question: "Combien de buts pour l'OL ?",
    hint: 'Le nombre exact.',
    points: 3,
    options: [
      { id: '0', label: '0' },
      { id: '1', label: '1' },
      { id: '2', label: '2' },
      { id: '3+', label: '3 ou plus' },
    ],
  },
  halfTime: {
    question: 'Le match sera-t-il serré ?',
    hint: "Serré = un but d'écart au maximum.",
    points: 2,
    options: [
      { id: 'serre', label: '😬 Serré' },
      { id: 'large', label: '💥 Large' },
    ],
  },
}

const ROTATION: BonusKind[] = [
  'scorer',
  'firstGoal',
  'totalGoals',
  'btts',
  'scorer',
  'margin',
  'cleanSheet',
  'olGoals',
  'firstGoal',
  'halfTime',
]

/** Hash stable : le bonus d'un match ne doit jamais changer entre deux
 *  visites, sinon un pronostic déjà posé porterait sur une autre question. */
function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/**
 * Le bonus attaché à un match. `squad` sert au bonus « buteur » : sans
 * composition connue (match à venir), on bascule sur une question qui n'en
 * a pas besoin plutôt que d'afficher une grille vide.
 */
export function bonusFor(matchId: string, squad?: string[]): Bonus {
  const players = squad ?? lineupFor(matchId).filter((p) => p.role === 'titulaire').map((p) => p.player)
  let kind = ROTATION[hash(matchId) % ROTATION.length]
  if (kind === 'scorer' && players.length < 4) kind = 'firstGoal'

  if (kind === 'scorer') {
    return {
      kind,
      question: 'Qui marque pour l’OL ?',
      hint: 'Un but de ce joueur suffit, à n’importe quel moment.',
      points: 4,
      faces: true,
      options: players.map((player) => ({ id: player, label: player, player })),
    }
  }
  return { kind, ...CATALOGUE[kind] }
}

/** L'option gagnante une fois le match joué, ou null si indécidable. */
export function resolveBonus(bonus: Bonus, match: Match): string | null {
  const olHome = OL_NAMES.has(match.home)
  const olScore = olHome ? match.homeScore : match.awayScore
  const advScore = olHome ? match.awayScore : match.homeScore
  const total = match.homeScore + match.awayScore
  const gap = Math.abs(match.homeScore - match.awayScore)

  switch (bonus.kind) {
    case 'scorer': {
      // le vainqueur est multiple : géré par bonusCorrect, pas ici
      return null
    }
    case 'firstGoal': {
      const first = match.scorers[0]
      if (!first) return 'none'
      const scoredByHome = first.team === 'home'
      return scoredByHome === olHome ? 'ol' : 'adv'
    }
    case 'btts':
      return match.homeScore > 0 && match.awayScore > 0 ? 'oui' : 'non'
    case 'totalGoals':
      return total <= 1 ? '0-1' : total <= 3 ? '2-3' : '4+'
    case 'cleanSheet':
      return advScore === 0 ? 'oui' : 'non'
    case 'margin':
      return gap === 0 ? '0' : gap === 1 ? '1' : gap === 2 ? '2' : '3+'
    case 'olGoals':
      return olScore >= 3 ? '3+' : String(olScore)
    case 'halfTime':
      return gap <= 1 ? 'serre' : 'large'
  }
}

/** Le pronostic bonus est-il gagnant ? */
export function bonusCorrect(bonus: Bonus, choice: string, match: Match): boolean {
  if (!choice) return false
  if (bonus.kind === 'scorer') {
    // un but contre son camp est crédité au joueur qui l'inscrit : on exige
    // donc que le but soit bien côté OL
    const olHome = OL_NAMES.has(match.home)
    return match.scorers.some(
      (s) => s.player === choice && (s.team === 'home') === olHome,
    )
  }
  return resolveBonus(bonus, match) === choice
}

/** Libellé de l'option retenue, pour le récapitulatif. */
export function labelOf(bonus: Bonus, id: string): string {
  return bonus.options.find((o) => o.id === id)?.label ?? id
}
