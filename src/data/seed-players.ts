import type { Player, Position } from '../lib/types'
import playersRaw from './players-real.json'

interface RawPlayer {
  name: string
  position: string
  subPosition?: string
  nationality: string
  yearsAtOL: string
  shirtNumber?: number
  career: { club: string; years: string }[]
}

const POSITION_MAP: Record<string, Position> = {
  Goalkeeper: 'Gardien',
  Defender: 'Défenseur',
  Midfielder: 'Milieu',
  Forward: 'Attaquant',
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export const seedPlayers: Player[] = (playersRaw as { players: RawPlayer[] }).players.map((p) => ({
  id: slugify(p.name),
  name: p.name,
  position: POSITION_MAP[p.position] ?? 'Milieu',
  subPosition: p.subPosition,
  nationality: p.nationality,
  yearsAtOL: p.yearsAtOL,
  number: p.shirtNumber,
  career: p.career,
}))
