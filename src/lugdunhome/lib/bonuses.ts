import type { Match } from '../../lib/types'
import { OL_NAMES } from '../../lib/matchHelpers'
import { seedMatches } from '../../data/seed-matches'
import { lineupFor } from './lineups'

/**
 * La question bonus du pronostic.
 *
 * Règle qui a tout redéfini : le bonus ne doit rien partager avec le score.
 * Un « combien de buts au total ? » ou « quel écart ? » est déjà répondu dès
 * qu'on annonce 2-1 — la question ne demande aucune connaissance de plus et
 * ne récompense rien. Ne restent donc que des questions sur *qui* et
 * *comment*, invisibles depuis le tableau d'affichage :
 *
 *   - qui marque, qui ouvre le score, qui délivre la passe décisive ;
 *   - un but de la tête, un penalty, un but contre son camp.
 *
 * Le buteur est toujours proposé quand la composition est connue, et chaque
 * joueur vaut un nombre de points différent : trouver le défenseur qui
 * marque une fois par saison ne peut pas valoir autant que l'avant-centre.
 */
export type BonusKind = 'scorer' | 'firstScorer' | 'assist' | 'header' | 'penalty' | 'ownGoal'

export interface BonusOption {
  id: string
  label: string
  /** nom du joueur, pour afficher un visage plutôt qu'une pastille */
  player?: string
  /** points propres à cette option — un buteur rare rapporte davantage */
  points?: number
}

export interface Bonus {
  kind: BonusKind
  question: string
  hint: string
  /** points par défaut, quand les options n'en portent pas */
  points: number
  options: BonusOption[]
  faces?: boolean
}

/* ---------- fréquence de but par joueur, sur tout l'historique ---------- */

const goalsByPlayer = new Map<string, number>()

for (const match of seedMatches) {
  const olHome = OL_NAMES.has(match.home)
  for (const goal of match.scorers ?? []) {
    if ((goal.team === 'home') !== olHome) continue
    goalsByPlayer.set(goal.player, (goalsByPlayer.get(goal.player) ?? 0) + 1)
  }
}

/**
 * Cote d'un buteur, façon paris sportifs : de 3 points pour un attaquant qui
 * marque tous les trois matchs à 10 pour un joueur qui n'a jamais marqué.
 * On borne haut ET bas — sans plancher, un buteur prolifique ne rapporterait
 * rien et personne ne le choisirait.
 */
export function scorerPoints(player: string, poste?: string): number {
  const goals = goalsByPlayer.get(player) ?? 0
  if (goals >= 40) return 3
  if (goals >= 15) return 4
  if (goals >= 5) return 5
  if (goals >= 1) return 7
  // jamais vu marquer : la cote dépend alors du poste
  if (poste === 'G') return 12
  if (poste && ['DC', 'DD', 'DG'].includes(poste)) return 10
  return 8
}

/* ---------------------------- catalogue ---------------------------- */

const YES_NO = (yes: string, no: string): BonusOption[] => [
  { id: 'oui', label: yes },
  { id: 'non', label: no },
]

const CATALOGUE: Record<Exclude<BonusKind, 'scorer' | 'firstScorer' | 'assist'>, Omit<Bonus, 'kind'>> = {
  header: {
    question: 'Un but sera-t-il marqué de la tête ?',
    hint: 'Par n’importe quelle équipe, sur l’ensemble du match.',
    points: 4,
    options: YES_NO('🎯 Oui, une tête', '❌ Aucune tête'),
  },
  penalty: {
    question: 'Y aura-t-il un penalty transformé ?',
    hint: 'Un penalty marqué, dans un camp ou dans l’autre.',
    points: 5,
    options: YES_NO('⚽ Oui, penalty', '❌ Aucun penalty'),
  },
  ownGoal: {
    question: 'Y aura-t-il un but contre son camp ?',
    hint: 'Rare — donc bien payé.',
    points: 8,
    options: YES_NO('🙈 Oui, un csc', '❌ Aucun csc'),
  },
}

/** Le buteur domine la rotation : c'est la question que les supporters
 *  veulent, les autres viennent l'aérer. */
const ROTATION: BonusKind[] = [
  'scorer',
  'scorer',
  'firstScorer',
  'scorer',
  'header',
  'scorer',
  'assist',
  'scorer',
  'penalty',
  'scorer',
  'firstScorer',
  'ownGoal',
]

function hash(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

export function bonusFor(matchId: string): Bonus {
  const squad = lineupFor(matchId).filter((p) => p.role === 'titulaire')
  let kind = ROTATION[hash(matchId) % ROTATION.length]
  // sans composition (match à venir), pas de question sur un joueur
  if (['scorer', 'firstScorer', 'assist'].includes(kind) && squad.length < 4) {
    kind = ROTATION[hash(`${matchId}-repli`) % 3 === 0 ? 4 : 8]
  }

  if (kind === 'scorer' || kind === 'firstScorer' || kind === 'assist') {
    const options = squad.map((p) => ({
      id: p.player,
      label: p.player,
      player: p.player,
      points: scorerPoints(p.player, p.position),
    }))
    if (kind === 'assist') {
      return {
        kind,
        question: 'Qui délivre une passe décisive ?',
        hint: 'Une seule passe décisive suffit, à n’importe quel moment.',
        points: 5,
        faces: true,
        options: options.map((o) => ({ ...o, points: Math.min(10, (o.points ?? 5) + 1) })),
      }
    }
    if (kind === 'firstScorer') {
      return {
        kind,
        question: 'Qui ouvre le score pour l’OL ?',
        hint: 'Il faut le tout premier buteur lyonnais du match.',
        points: 6,
        faces: true,
        options: options.map((o) => ({ ...o, points: Math.min(14, (o.points ?? 5) + 3) })),
      }
    }
    return {
      kind,
      question: 'Qui marque pour l’OL ?',
      hint: 'Un but de ce joueur suffit, à n’importe quel moment.',
      points: 5,
      faces: true,
      options,
    }
  }

  return { kind, ...CATALOGUE[kind] }
}

/** Points que rapporte l'option choisie. */
export function pointsFor(bonus: Bonus, choice: string): number {
  return bonus.options.find((o) => o.id === choice)?.points ?? bonus.points
}

/** Le pronostic bonus est-il gagnant ? */
export function bonusCorrect(bonus: Bonus, choice: string, match: Match): boolean {
  if (!choice) return false
  const olHome = OL_NAMES.has(match.home)
  const olGoals = match.scorers.filter((s) => (s.team === 'home') === olHome)

  switch (bonus.kind) {
    case 'scorer':
      // un but contre son camp est porté au nom de celui qui le marque :
      // il ne compte donc pas comme un but « pour l'OL »
      return olGoals.some((s) => s.player === choice && s.how !== 'csc')
    case 'firstScorer': {
      const first = olGoals.find((s) => s.how !== 'csc')
      return first?.player === choice
    }
    case 'assist':
      return match.scorers.some((s) => s.assist === choice)
    case 'header':
      return (match.scorers.some((s) => s.how === 'tete') ? 'oui' : 'non') === choice
    case 'penalty':
      return (match.scorers.some((s) => s.how === 'penalty') ? 'oui' : 'non') === choice
    case 'ownGoal':
      return (match.scorers.some((s) => s.how === 'csc') ? 'oui' : 'non') === choice
  }
}

export function labelOf(bonus: Bonus, id: string): string {
  return bonus.options.find((o) => o.id === id)?.label ?? id
}

/** Nombre de buts inscrits sous le maillot de l'OL, pour l'affichage. */
export function goalsOf(player: string): number {
  return goalsByPlayer.get(player) ?? 0
}
