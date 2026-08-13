export interface CareerStep {
  club: string
  years: string
}

export type Position = 'Gardien' | 'Défenseur' | 'Milieu' | 'Attaquant'

export interface Player {
  id: string
  name: string
  position: Position
  subPosition?: string
  posteFr?: string
  birthDate?: string
  nationality: string
  yearsAtOL: string
  number?: number
  career: CareerStep[]
}

export interface Scorer {
  team: 'home' | 'away'
  minute?: number
  player: string
  assist?: string | null
}

export interface Match {
  id: string
  date: string
  season: string
  competition: string
  round?: string
  home: string
  away: string
  homeScore: number
  awayScore: number
  scorers: Scorer[]
  referee?: string
  attendance?: number
  venue?: string
  olPosition?: number
  formationHome?: string
  formationAway?: string
}

export interface SeasonRecord {
  season: string
  competition: string
  position?: number
  played?: number
  wins?: number
  draws?: number
  losses?: number
  gf?: number
  ga?: number
  points?: number
  manager?: string
  europeanCup?: string
  coupeDeFrance?: string
  coupeDeLaLigue?: string
  trophies: string[]
}
