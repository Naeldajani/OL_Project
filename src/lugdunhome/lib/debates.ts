import type { Match } from '../../lib/types'
import { olScore, oppScore, opponent, result } from '../../lib/matchHelpers'
import { rng } from './community'

export interface Debate {
  question: string
  options: { id: string; label: string }[]
}

const YES_NO = (question: string): Debate => ({
  question,
  options: [
    { id: 'oui', label: 'Oui' },
    { id: 'non', label: 'Non' },
    { id: 'mitige', label: 'Mitigé' },
  ],
})

/**
 * A debate question that actually fits what happened, rather than a
 * generic prompt bolted onto every match.
 */
export function debateFor(match: Match): Debate {
  const r = result(match)
  const gf = olScore(match)
  const ga = oppScore(match)
  const opp = opponent(match)
  const margin = gf - ga

  if (r === 'V' && margin >= 3) {
    return YES_NO(`Large succès contre ${opp} : est-ce le vrai visage de cette équipe ?`)
  }
  if (r === 'V' && margin === 1) {
    return YES_NO(`Victoire étriquée à ${gf}-${ga} : l'OL a-t-il maîtrisé son match ?`)
  }
  if (r === 'V') {
    return YES_NO(`L'OL a-t-il livré une prestation référence face à ${opp} ?`)
  }
  if (r === 'N') {
    return {
      question: `Nul ${gf}-${ga} contre ${opp} : quel est le vrai problème ?`,
      options: [
        { id: 'finition', label: 'Le manque de finition' },
        { id: 'milieu', label: 'Le milieu de terrain' },
        { id: 'defense', label: 'La fébrilité défensive' },
        { id: 'coaching', label: 'Les choix du coach' },
      ],
    }
  }
  if (margin <= -3) {
    return {
      question: `Défaite lourde ${gf}-${ga} face à ${opp} : à qui la faute ?`,
      options: [
        { id: 'joueurs', label: "L'attitude des joueurs" },
        { id: 'coach', label: 'Le coach' },
        { id: 'effectif', label: "La qualité de l'effectif" },
        { id: 'direction', label: 'La direction du club' },
      ],
    }
  }
  return YES_NO(`Défaite ${gf}-${ga} contre ${opp} : l'OL méritait-il mieux ?`)
}

/** Stable simulated split of the community's answers. */
export function simulatedDebate(match: Match, participants: number): Record<string, number> {
  const debate = debateFor(match)
  const r = rng(`debate-${match.id}`)
  const raw = debate.options.map(() => 0.15 + r())
  const total = raw.reduce((a, b) => a + b, 0)

  const out: Record<string, number> = {}
  let assigned = 0
  debate.options.forEach((opt, i) => {
    const v = Math.floor((raw[i] / total) * participants)
    out[opt.id] = v
    assigned += v
  })
  const first = debate.options[0].id
  out[first] += participants - assigned
  return out
}
