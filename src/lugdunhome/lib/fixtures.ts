import { fixtures202627, type Fixture } from '../../data/fixtures-2026-27'

export interface UpcomingMatch extends Fixture {
  id: string
  kickoff: number
}

/** Fixtures carry a date only; Ligue 1 kickoffs sit in the evening, which is
 * accurate enough for a "temps avant le coup d'envoi" countdown. */
function kickoffOf(date: string): number {
  return new Date(`${date}T20:45:00`).getTime()
}

export const upcoming: UpcomingMatch[] = fixtures202627
  .map((f) => ({
    ...f,
    id: `fixture-2627-j${f.matchweek}`,
    kickoff: kickoffOf(f.date),
  }))
  .sort((a, b) => a.kickoff - b.kickoff)

/** Fixtures whose kickoff hasn't happened yet — the ones still predictable. */
export function openFixtures(now = Date.now()): UpcomingMatch[] {
  return upcoming.filter((f) => f.kickoff > now)
}

export function nextFixture(now = Date.now()): UpcomingMatch | undefined {
  return openFixtures(now)[0]
}

export function fixtureById(id: string): UpcomingMatch | undefined {
  return upcoming.find((f) => f.id === id)
}

export function isFixtureId(id: string): boolean {
  return id.startsWith('fixture-')
}

/** Coarse countdown for a kickoff that may be weeks away. */
export function untilKickoff(ms: number): string {
  if (ms <= 0) return 'Coup d’envoi imminent'
  const days = Math.floor(ms / 86400000)
  const hours = Math.floor((ms % 86400000) / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  if (days > 0) return `${days} j ${hours} h`
  if (hours > 0) return `${hours} h ${minutes} min`
  return `${minutes} min`
}
