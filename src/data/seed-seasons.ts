import type { SeasonRecord } from '../lib/types'
import seasonsRaw from './seasons-real.json'

interface RawSeason {
  season: string
  competition: string
  position: number | null
  played: number | null
  wins: number | null
  draws: number | null
  losses: number | null
  gf: number | null
  ga: number | null
  points: number | null
  manager: string
  europeanCup?: string
  coupeDeFrance?: string
  coupeDeLaLigue?: string
  trophies: string[]
  notes?: string
}

function cleanManager(manager: string | undefined): string | undefined {
  if (!manager || manager.includes('Unknown')) return undefined
  // Strip parenthetical research caveats, keep the plain name(s).
  return manager.replace(/\s*\([^)]*\)/g, '').trim() || undefined
}

export const seedSeasons: SeasonRecord[] = (seasonsRaw as { seasons: RawSeason[] }).seasons.map(
  (s) => ({
    season: s.season,
    competition: s.competition,
    position: s.position ?? undefined,
    played: s.played ?? undefined,
    wins: s.wins ?? undefined,
    draws: s.draws ?? undefined,
    losses: s.losses ?? undefined,
    gf: s.gf ?? undefined,
    ga: s.ga ?? undefined,
    points: s.points ?? undefined,
    manager: cleanManager(s.manager),
    europeanCup: s.europeanCup,
    coupeDeFrance: s.coupeDeFrance,
    coupeDeLaLigue: s.coupeDeLaLigue,
    trophies: s.trophies,
  }),
)

export const clubInfo = (seasonsRaw as { club: { founded: number; stadiums: { name: string; from: string; to: string }[] } })
  .club
