import { seedMatches } from '../../data/seed-matches'
import type { Match } from '../../lib/types'
import { hasLineup } from './lineups'

/** Matches the community can actually act on, newest first. */
export const ratableMatches: Match[] = seedMatches
  .filter((m) => hasLineup(m.id))
  .sort((a, b) => (a.date < b.date ? 1 : -1))

/** All matches newest first, for history and data views. */
export const allMatches: Match[] = [...seedMatches].sort((a, b) => (a.date < b.date ? 1 : -1))

export const latestMatch: Match | undefined = ratableMatches[0]

export function matchById(id: string): Match | undefined {
  return seedMatches.find((m) => m.id === id)
}

export function isLatest(id: string): boolean {
  return latestMatch?.id === id
}

/** The next fixture to predict: we're past the dataset, so the "upcoming"
 * slate is the set of matches that follow the newest rated one. */
export function upcomingMatches(limit = 8): Match[] {
  return ratableMatches.slice(0, limit)
}

export function formatLongDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatShortDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  })
}
