import lineupsRaw from '../data/lineups.json'
import { seedPlayers } from '../../data/seed-players'

export interface LineupEntry {
  player: string
  role: 'titulaire' | 'banc'
  shirt: string
  position: string
  nationality: string
}

interface RawLineup {
  ol: LineupEntry[]
  adv: LineupEntry[]
  coach: string
  advCoach: string
}

const LINEUPS = lineupsRaw as unknown as Record<string, RawLineup>

export function hasLineup(matchId: string): boolean {
  return Boolean(LINEUPS[matchId]?.ol?.length)
}

export function lineupFor(matchId: string): LineupEntry[] {
  return LINEUPS[matchId]?.ol ?? []
}

export function opponentLineupFor(matchId: string): LineupEntry[] {
  return LINEUPS[matchId]?.adv ?? []
}

export function coachFor(matchId: string): string {
  return LINEUPS[matchId]?.coach ?? ''
}

/** Match a lineup name to a documented OL player, for photos and profiles. */
const byName = new Map(seedPlayers.map((p) => [p.name.toLowerCase(), p]))
export function knownPlayer(name: string) {
  return byName.get(name.toLowerCase())
}

/** Every match id we can build a rating experience for, newest first. */
export function ratableMatchIds(): string[] {
  return Object.keys(LINEUPS).filter((id) => LINEUPS[id].ol.length > 0)
}
