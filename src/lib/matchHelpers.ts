import type { Match } from './types'

export const OL_NAMES = new Set(['Lyon', 'Olympique Lyonnais'])

export function isHome(m: Match) {
  return OL_NAMES.has(m.home)
}
export function opponent(m: Match) {
  return isHome(m) ? m.away : m.home
}
export function olScore(m: Match) {
  return isHome(m) ? m.homeScore : m.awayScore
}
export function oppScore(m: Match) {
  return isHome(m) ? m.awayScore : m.homeScore
}
export function result(m: Match): 'V' | 'N' | 'D' {
  const gs = olScore(m)
  const ga = oppScore(m)
  if (gs > ga) return 'V'
  if (gs === ga) return 'N'
  return 'D'
}
export function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
export function yearsAgo(iso: string) {
  const then = new Date(iso + 'T12:00:00')
  const now = new Date()
  let years = now.getFullYear() - then.getFullYear()
  const anniversaryPassed =
    now.getMonth() > then.getMonth() ||
    (now.getMonth() === then.getMonth() && now.getDate() >= then.getDate())
  if (!anniversaryPassed) years -= 1
  return years
}
