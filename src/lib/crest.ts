// Blasons stylisés : couleurs curées pour les clubs connus, couleurs
// déterministes dérivées du nom pour les autres.
//
// C'est la seule représentation de club du projet, et c'est un choix
// juridique autant que graphique : les logos officiels sont des œuvres
// protégées (l'audit a montré que 267 des 273 récupérés étaient des imports
// sous exception, celui de l'OL compris). Une couleur et des initiales ne
// sont protégeables ni l'une ni l'autre.

export type CrestPattern = 'plain' | 'stripes' | 'hoops' | 'sash' | 'halves'

interface CrestStyle {
  bg: string
  fg: string
  abbr: string
  /** Motif du maillot : rayures verticales, cerclé, écharpe, mi-partie.
   *  C'est ce qui rend un blason reconnaissable au premier coup d'œil sans
   *  reproduire le logo officiel — un maillot n'est pas une œuvre protégée,
   *  une combinaison de couleurs et de bandes non plus. */
  pattern?: CrestPattern
}

const CURATED: Record<string, CrestStyle> = {
  Lyon: { bg: '#e3082a', fg: '#0a2472', abbr: 'OL', pattern: 'sash' },
  'Olympique Lyonnais': { bg: '#e3082a', fg: '#0a2472', abbr: 'OL', pattern: 'sash' },
  PSG: { bg: '#04154b', fg: '#e30613', abbr: 'PSG', pattern: 'sash' },
  'Paris Saint-Germain': { bg: '#04154b', fg: '#e30613', abbr: 'PSG', pattern: 'sash' },
  Marseille: { bg: '#2fa8e0', fg: '#ffffff', abbr: 'OM', pattern: 'plain' },
  Lille: { bg: '#c8102e', fg: '#003c7d', abbr: 'LOSC', pattern: 'halves' },
  Rennes: { bg: '#e2001a', fg: '#000000', abbr: 'SRFC', pattern: 'halves' },
  Monaco: { bg: '#e2001a', fg: '#ffffff', abbr: 'ASM', pattern: 'halves' },
  Nice: { bg: '#c8102e', fg: '#000000', abbr: 'OGCN', pattern: 'halves' },
  Bordeaux: { bg: '#132257', fg: '#c8102e', abbr: 'FCGB', pattern: 'plain' },
  Toulouse: { bg: '#552583', fg: '#ffffff', abbr: 'TFC', pattern: 'plain' },
  Nantes: { bg: '#fcd116', fg: '#00843d', abbr: 'FCN', pattern: 'stripes' },
  'Saint-Étienne': { bg: '#00843d', fg: '#ffffff', abbr: 'ASSE', pattern: 'plain' },
  Montpellier: { bg: '#0072ce', fg: '#e2001a', abbr: 'MHSC', pattern: 'halves' },
  Strasbourg: { bg: '#1b3f8b', fg: '#ffffff', abbr: 'RCSA', pattern: 'stripes' },
  Reims: { bg: '#e2001a', fg: '#ffffff', abbr: 'SDR', pattern: 'stripes' },
  Angers: { bg: '#000000', fg: '#ffffff', abbr: 'SCO', pattern: 'stripes' },
  Troyes: { bg: '#0072ce', fg: '#e2001a', abbr: 'ESTAC', pattern: 'stripes' },
  Clermont: { bg: '#8b1538', fg: '#ffffff', abbr: 'CF63', pattern: 'plain' },
  'Clermont Foot': { bg: '#8b1538', fg: '#ffffff', abbr: 'CF63', pattern: 'plain' },
  'Le Havre': { bg: '#0072ce', fg: '#ffffff', abbr: 'HAC', pattern: 'stripes' },
  Metz: { bg: '#8b1538', fg: '#fcd116', abbr: 'FCM', pattern: 'plain' },
  Brest: { bg: '#e2001a', fg: '#ffffff', abbr: 'SB29', pattern: 'plain' },
  Lorient: { bg: '#e2001a', fg: '#ff7f00', abbr: 'FCL', pattern: 'plain' },
  Auxerre: { bg: '#003c7d', fg: '#ffffff', abbr: 'AJA', pattern: 'stripes' },
  'Paris FC': { bg: '#00478a', fg: '#e2001a', abbr: 'PFC', pattern: 'plain' },
  Lens: { bg: '#ffd100', fg: '#c8102e', abbr: 'RCL', pattern: 'stripes' },
  Ajaccio: { bg: '#e2001a', fg: '#ffffff', abbr: 'ACA', pattern: 'stripes' },
  Arsenal: { bg: '#ef0107', fg: '#023474', abbr: 'ARS', pattern: 'plain' },
  'Real Madrid': { bg: '#ffffff', fg: '#febe10', abbr: 'RMA', pattern: 'plain' },
  Barcelona: { bg: '#a50044', fg: '#004d98', abbr: 'FCB', pattern: 'stripes' },
  'Bayern Munich': { bg: '#dc052d', fg: '#0066b2', abbr: 'FCB', pattern: 'plain' },
  'Manchester United': { bg: '#da291c', fg: '#fbe122', abbr: 'MUN', pattern: 'plain' },
  Chelsea: { bg: '#034694', fg: '#ffffff', abbr: 'CHE', pattern: 'plain' },
  Liverpool: { bg: '#c8102e', fg: '#00b2a9', abbr: 'LFC', pattern: 'plain' },
  Juventus: { bg: '#000000', fg: '#ffffff', abbr: 'JUV', pattern: 'stripes' },
  Roma: { bg: '#8e1f2f', fg: '#f0bc42', abbr: 'ROM', pattern: 'plain' },
  Milan: { bg: '#fb090b', fg: '#000000', abbr: 'ACM', pattern: 'stripes' },
  Inter: { bg: '#0068a8', fg: '#000000', abbr: 'INT', pattern: 'stripes' },
  Fenerbahçe: { bg: '#fdc90b', fg: '#00296b', abbr: 'FB', pattern: 'stripes' },
  Olympiacos: { bg: '#c8102e', fg: '#ffffff', abbr: 'OLY', pattern: 'stripes' },
  'Real Betis': { bg: '#00954c', fg: '#ffffff', abbr: 'BET', pattern: 'stripes' },
  Nordsjælland: { bg: '#e2001a', fg: '#ffe600', abbr: 'FCN', pattern: 'plain' },
  Salernitana: { bg: '#7b1e3a', fg: '#a58e56', abbr: 'SAL', pattern: 'hoops' },
  RWDM: { bg: '#7bb02f', fg: '#000000', abbr: 'RWDM', pattern: 'plain' },
  'Heracles Almelo': { bg: '#000000', fg: '#fcd116', abbr: 'HER', pattern: 'hoops' },
}

/* Les données nomment les clubs comme Wikipédia (« Stade Rennais »,
   « G. Bordeaux », « LOSC Lille »), pas comme la table ci-dessus. Sans ces
   renvois, la moitié des clubs de Ligue 1 tombait dans la couleur générée
   au hasard et affichait des initiales absurdes (« SR », « GB »). */
const ALIASES: Record<string, string> = {
  'LOSC Lille': 'Lille',
  'Stade Rennais': 'Rennes',
  'OGC Nice': 'Nice',
  'G. Bordeaux': 'Bordeaux',
  'FC Nantes': 'Nantes',
  'RC Lens': 'Lens',
  'FC Lorient': 'Lorient',
  'R. Strasbourg': 'Strasbourg',
  'FC Metz': 'Metz',
  'AJ Auxerre': 'Auxerre',
  'Stade de Reims': 'Reims',
  'Stade Brestois': 'Brest',
  'Angers SCO': 'Angers',
  'AC Ajaccio': 'Ajaccio',
  'Le Havre AC': 'Le Havre',
  'AS Saint-Étienne': 'Saint-Étienne',
  'Paris Saint Germain': 'PSG',
  'Manchester Utd.': 'Manchester United',
  Barcelone: 'Barcelona',
  Bayern: 'Bayern Munich',
  'Inter Milan': 'Inter',
  'AC Milan': 'Milan',
}

/* Sigles usuels des clubs français que la table curée ne couvre pas :
   « FC Sochaux » donnerait « FS », personne ne les appelle comme ça. */
const KNOWN_ABBR: Record<string, string> = {
  'FC Sochaux': 'FCSM',
  'SM Caen': 'SMC',
  'SC Bastia': 'SCB',
  'EA Guingamp': 'EAG',
  'AS Nancy': 'ASNL',
  'Valenciennes FC': 'VAFC',
  'Le Mans UC 72': 'LMFC',
  'CS Sedan': 'CSSA',
  'Amiens SC': 'ASC',
  'FC Évian': 'ETG',
  Dijon: 'DFCO',
  Guingamp: 'EAG',
}

function hashHue(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % 360
}

// Mots qui ne portent pas l'identité du club : les garder produit des
// initiales interchangeables (« FC Nantes » et « FC Metz » donneraient tous
// deux un F en tête).
const FILLER = new Set([
  'fc',
  'ac',
  'as',
  'aj',
  'sc',
  'sm',
  'us',
  'es',
  'ea',
  'rc',
  'cs',
  'uc',
  'sco',
  'ogc',
  'losc',
  'stade',
  'club',
  'football',
  'olympique',
  'racing',
  'sporting',
  'de',
  'du',
  'la',
  'le',
  'les',
])

function abbreviate(name: string): string {
  const cleaned = name.replace(/[^\p{L}\s]/gu, ' ')
  const words = cleaned.split(/\s+/).filter(Boolean)
  const core = words.filter((w) => !FILLER.has(w.toLowerCase()))
  const kept = core.length ? core : words
  if (kept.length === 1) return kept[0].slice(0, 3).toUpperCase()
  return kept
    .slice(0, 3)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

export function getCrestStyle(clubName: string): CrestStyle {
  const canonical = ALIASES[clubName] ?? clubName
  const curated = CURATED[canonical]
  if (curated) return curated

  const hue = hashHue(canonical)
  const patterns: CrestPattern[] = ['plain', 'stripes', 'hoops', 'sash', 'halves']
  return {
    bg: `hsl(${hue}, 55%, 32%)`,
    fg: `hsl(${(hue + 150) % 360}, 70%, 75%)`,
    abbr: KNOWN_ABBR[clubName] ?? KNOWN_ABBR[canonical] ?? abbreviate(canonical),
    // motif stable pour un club donné : deux clubs voisins dans la liste ne
    // doivent pas se ressembler, mais un même club ne doit jamais changer
    pattern: patterns[hashHue(`${canonical}-motif`) % patterns.length],
  }
}

/** Dégradé du blason : la teinte curée, assombrie vers le bas. Passer par
 *  color-mix évite de reparser les formats hétérogènes (#hex et hsl()). */
export function crestGradient(bg: string): string {
  return `linear-gradient(150deg, ${bg}, color-mix(in srgb, ${bg} 62%, #04060a))`
}
