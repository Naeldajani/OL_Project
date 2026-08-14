// Blasons stylisés : couleurs curées pour les clubs connus, couleurs
// déterministes dérivées du nom pour les autres.
//
// C'est la seule représentation de club du projet, et c'est un choix
// juridique autant que graphique : les logos officiels sont des œuvres
// protégées (l'audit a montré que 267 des 273 récupérés étaient des imports
// sous exception, celui de l'OL compris). Une couleur et des initiales ne
// sont protégeables ni l'une ni l'autre.

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
  return {
    bg: `hsl(${hue}, 55%, 32%)`,
    fg: `hsl(${(hue + 150) % 360}, 70%, 75%)`,
    abbr: KNOWN_ABBR[clubName] ?? KNOWN_ABBR[canonical] ?? abbreviate(canonical),
  }
}

/** Dégradé du blason : la teinte curée, assombrie vers le bas. Passer par
 *  color-mix évite de reparser les formats hétérogènes (#hex et hsl()). */
export function crestGradient(bg: string): string {
  return `linear-gradient(150deg, ${bg}, color-mix(in srgb, ${bg} 62%, #04060a))`
}
