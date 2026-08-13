import type { Match } from '../lib/types'
import matchesRealRaw from './matches-real.json'

// Hand-verified matches sourced directly from the user's original app footage
// (match reports pulled from FBref) — kept as-is since they were confirmed
// on screen, not reconstructed from memory.
const fromOriginalFootage: Match[] = [
  {
    id: 'footage-strasbourg-2023',
    date: '2023-08-13',
    season: '2023-24',
    competition: 'Ligue 1',
    round: 'Matchweek 1',
    home: 'R. Strasbourg',
    away: 'Lyon',
    homeScore: 2,
    awayScore: 1,
    scorers: [
      { team: 'home', minute: 63, player: 'Jean-Ricardo Bellegarde' },
      { team: 'home', minute: 75, player: 'Lebo Mothiba', assist: 'Jean-Ricardo Bellegarde' },
      { team: 'away', minute: 88, player: 'Nicolás Tagliafico', assist: 'Maxence Caqueret' },
    ],
    referee: 'Jérôme Brisard',
    attendance: 25410,
    venue: 'Stade de la Meinau',
    formationHome: '3-5-2',
    formationAway: '4-2-3-1',
  },
  {
    id: 'footage-ajaccio-2011',
    date: '2011-08-13',
    season: '2011-12',
    competition: 'Ligue 1',
    round: 'Matchweek 2',
    home: 'Lyon',
    away: 'AC Ajaccio',
    homeScore: 1,
    awayScore: 1,
    scorers: [
      { team: 'home', minute: 59, player: 'Frédéric Sammaritano' },
      { team: 'away', minute: 83, player: 'Lisandro López' },
    ],
    referee: 'Hervé Piccirillo',
    venue: 'Stade de Gerland',
  },
]

interface RawMatch {
  id?: string
  date: string
  season: string
  competition: string
  round?: string
  home: string
  away: string
  homeScore: number
  awayScore: number
  scorers: { team: 'home' | 'away'; minute?: number; player: string; assist?: string | null }[]
  referee?: string
  attendance?: number
  venue?: string
  notes?: string
  olPosition?: number
}

const researched: Match[] = (matchesRealRaw as { matches: RawMatch[] }).matches.map((m, i) => ({
  // keep the source match id when we have one: Lugdun'Home joins lineups,
  // ratings and votes on it, so a synthetic index would break those links.
  id: m.id ?? `research-${i}`,
  date: m.date,
  season: m.season,
  competition: m.competition,
  round: m.round,
  home: m.home,
  away: m.away,
  homeScore: m.homeScore,
  awayScore: m.awayScore,
  scorers: m.scorers,
  referee: m.referee,
  attendance: m.attendance,
  venue: m.venue,
  olPosition: m.olPosition,
}))

function dedupeKey(m: Match) {
  return `${m.date}|${m.home}|${m.away}`
}

const seen = new Set(fromOriginalFootage.map(dedupeKey))
const merged = [...fromOriginalFootage, ...researched.filter((m) => !seen.has(dedupeKey(m)))]

export const seedMatches: Match[] = merged
