// Stylized club badges: curated colors for well-known clubs, deterministic
// hash-based colors for everything else. No external logos are hotlinked.

interface CrestStyle {
  bg: string
  fg: string
  abbr: string
}

const CURATED: Record<string, CrestStyle> = {
  Lyon: { bg: '#e3082a', fg: '#0a2472', abbr: 'OL' },
  'Olympique Lyonnais': { bg: '#e3082a', fg: '#0a2472', abbr: 'OL' },
  PSG: { bg: '#04154b', fg: '#e30613', abbr: 'PSG' },
  'Paris Saint-Germain': { bg: '#04154b', fg: '#e30613', abbr: 'PSG' },
  Marseille: { bg: '#2fa8e0', fg: '#ffffff', abbr: 'OM' },
  Lille: { bg: '#c8102e', fg: '#003c7d', abbr: 'LOSC' },
  Rennes: { bg: '#e2001a', fg: '#000000', abbr: 'SRFC' },
  Monaco: { bg: '#e2001a', fg: '#ffffff', abbr: 'ASM' },
  Nice: { bg: '#c8102e', fg: '#000000', abbr: 'OGCN' },
  Bordeaux: { bg: '#132257', fg: '#c8102e', abbr: 'FCGB' },
  Toulouse: { bg: '#552583', fg: '#ffffff', abbr: 'TFC' },
  Nantes: { bg: '#fcd116', fg: '#00843d', abbr: 'FCN' },
  'Saint-Étienne': { bg: '#00843d', fg: '#ffffff', abbr: 'ASSE' },
  Montpellier: { bg: '#0072ce', fg: '#e2001a', abbr: 'MHSC' },
  Strasbourg: { bg: '#1b3f8b', fg: '#ffffff', abbr: 'RCSA' },
  Reims: { bg: '#e2001a', fg: '#ffffff', abbr: 'SDR' },
  Angers: { bg: '#000000', fg: '#ffffff', abbr: 'SCO' },
  Troyes: { bg: '#0072ce', fg: '#e2001a', abbr: 'ESTAC' },
  Clermont: { bg: '#8b1538', fg: '#ffffff', abbr: 'CF63' },
  'Clermont Foot': { bg: '#8b1538', fg: '#ffffff', abbr: 'CF63' },
  'Le Havre': { bg: '#0072ce', fg: '#ffffff', abbr: 'HAC' },
  Metz: { bg: '#8b1538', fg: '#fcd116', abbr: 'FCM' },
  Brest: { bg: '#e2001a', fg: '#ffffff', abbr: 'SB29' },
  Lorient: { bg: '#e2001a', fg: '#ff7f00', abbr: 'FCL' },
  Auxerre: { bg: '#003c7d', fg: '#ffffff', abbr: 'AJA' },
  'Paris FC': { bg: '#00478a', fg: '#e2001a', abbr: 'PFC' },
  Lens: { bg: '#ffd100', fg: '#c8102e', abbr: 'RCL' },
  Ajaccio: { bg: '#e2001a', fg: '#ffffff', abbr: 'ACA' },
  Arsenal: { bg: '#ef0107', fg: '#023474', abbr: 'ARS' },
  'Real Madrid': { bg: '#ffffff', fg: '#febe10', abbr: 'RMA' },
  Barcelona: { bg: '#a50044', fg: '#004d98', abbr: 'FCB' },
  'Bayern Munich': { bg: '#dc052d', fg: '#0066b2', abbr: 'FCB' },
  'Manchester United': { bg: '#da291c', fg: '#fbe122', abbr: 'MUN' },
  Chelsea: { bg: '#034694', fg: '#ffffff', abbr: 'CHE' },
  Liverpool: { bg: '#c8102e', fg: '#00b2a9', abbr: 'LFC' },
  Juventus: { bg: '#000000', fg: '#ffffff', abbr: 'JUV' },
  Roma: { bg: '#8e1f2f', fg: '#f0bc42', abbr: 'ROM' },
  Milan: { bg: '#fb090b', fg: '#000000', abbr: 'ACM' },
  Inter: { bg: '#0068a8', fg: '#000000', abbr: 'INT' },
  Fenerbahçe: { bg: '#fdc90b', fg: '#00296b', abbr: 'FB' },
  Olympiacos: { bg: '#c8102e', fg: '#ffffff', abbr: 'OLY' },
  'Real Betis': { bg: '#00954c', fg: '#ffffff', abbr: 'BET' },
  Nordsjælland: { bg: '#e2001a', fg: '#ffe600', abbr: 'FCN' },
  Salernitana: { bg: '#7b1e3a', fg: '#a58e56', abbr: 'SAL' },
  RWDM: { bg: '#7bb02f', fg: '#000000', abbr: 'RWDM' },
  'Heracles Almelo': { bg: '#000000', fg: '#fcd116', abbr: 'HER' },
}

function hashHue(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % 360
}

function abbreviate(name: string): string {
  const cleaned = name.replace(/[^\p{L}\s]/gu, '')
  const words = cleaned.split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase()
  return words
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function getCrestStyle(clubName: string): CrestStyle {
  if (CURATED[clubName]) return CURATED[clubName]
  const hue = hashHue(clubName)
  return {
    bg: `hsl(${hue}, 55%, 32%)`,
    fg: `hsl(${(hue + 150) % 360}, 70%, 75%)`,
    abbr: abbreviate(clubName),
  }
}
