import raw from '../data/mercato.json'

export type DealKind = 'transfert' | 'prêt' | 'fin de prêt' | 'libre' | 'indéterminé'

export interface Deal {
  name: string
  nationality: string
  position: string
  club: string
  league: string
  direction: 'arrivee' | 'depart'
  season: string
  window: 'été' | 'hiver'
  kind: DealKind
  /** en millions d'euros ; null quand le montant n'a pas été communiqué */
  fee: number | null
  raw: string
  age: number | null
}

const file = raw as { updatedAt: string; seasons: string[]; deals: Deal[] }

export const mercatoSeasons = file.seasons
export const mercatoUpdatedAt = file.updatedAt
export const deals = file.deals

export function dealsFor(season: string): Deal[] {
  return deals.filter((d) => d.season === season)
}

/** Bilan financier d'une saison : ce qui est sorti, ce qui est rentré.
 *  Les montants non communiqués sont ignorés — les compter à zéro
 *  laisserait croire à un transfert gratuit. */
export function balanceFor(season: string) {
  let spent = 0
  let earned = 0
  let unknown = 0
  for (const d of dealsFor(season)) {
    if (d.fee == null) {
      if (d.kind === 'transfert') unknown += 1
      continue
    }
    if (d.direction === 'arrivee') spent += d.fee
    else earned += d.fee
  }
  return { spent, earned, net: earned - spent, unknown }
}

const KIND_STYLE: Record<DealKind, { label: string; tone: 'red' | 'gold' | 'green' | 'neutral' }> = {
  transfert: { label: 'Transfert', tone: 'gold' },
  prêt: { label: 'Prêt', tone: 'neutral' },
  'fin de prêt': { label: 'Fin de prêt', tone: 'neutral' },
  libre: { label: 'Libre', tone: 'green' },
  indéterminé: { label: 'Non communiqué', tone: 'neutral' },
}

export function kindStyle(kind: DealKind) {
  return KIND_STYLE[kind] ?? KIND_STYLE.indéterminé
}

/** « 12 M€ », « 800 k€ », ou un tiret. */
export function formatFee(fee: number | null): string {
  if (fee == null) return '—'
  if (fee < 1) return `${Math.round(fee * 1000)} k€`
  return `${fee.toFixed(fee % 1 === 0 ? 0 : 1).replace('.', ',')} M€`
}

const POSTE_ICON: Record<string, string> = {
  gardien: '🧤',
  défenseur: '🛡️',
  latéral: '🛡️',
  milieu: '⚙️',
  attaquant: '⚡',
  ailier: '⚡',
  avant: '⚡',
}

export function positionIcon(position: string): string {
  const low = position.toLowerCase()
  for (const [key, icon] of Object.entries(POSTE_ICON)) {
    if (low.includes(key)) return icon
  }
  return '👤'
}

/* Le drapeau se déduit du nom du pays : recopier une table de 200 entrées
   serait inutile, seuls les pays réellement présents comptent. */
const FLAGS: Record<string, string> = {
  France: '🇫🇷', Angleterre: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', Brésil: '🇧🇷', Espagne: '🇪🇸', Portugal: '🇵🇹',
  Italie: '🇮🇹', Allemagne: '🇩🇪', 'Pays-Bas': '🇳🇱', Belgique: '🇧🇪', Suisse: '🇨🇭',
  'États-Unis': '🇺🇸', Argentine: '🇦🇷', "Côte d'Ivoire": '🇨🇮', Sénégal: '🇸🇳',
  Mali: '🇲🇱', Algérie: '🇩🇿', Maroc: '🇲🇦', Tunisie: '🇹🇳', Cameroun: '🇨🇲',
  Ghana: '🇬🇭', Nigeria: '🇳🇬', 'RD Congo': '🇨🇩', Congo: '🇨🇬', Irlande: '🇮🇪',
  Écosse: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', Tchéquie: '🇨🇿', Slovaquie: '🇸🇰', Pologne: '🇵🇱', Croatie: '🇭🇷',
  Serbie: '🇷🇸', Géorgie: '🇬🇪', Ukraine: '🇺🇦', Turquie: '🇹🇷', Danemark: '🇩🇰',
  Suède: '🇸🇪', Norvège: '🇳🇴', Autriche: '🇦🇹', Japon: '🇯🇵', 'Corée du Sud': '🇰🇷',
  Australie: '🇦🇺', Canada: '🇨🇦', Mexique: '🇲🇽', Colombie: '🇨🇴', Uruguay: '🇺🇾',
  Chili: '🇨🇱', Paraguay: '🇵🇾', Guinée: '🇬🇳', 'Burkina Faso': '🇧🇫', Gabon: '🇬🇦',
  Comores: '🇰🇲', Madagascar: '🇲🇬', Haïti: '🇭🇹', Israël: '🇮🇱', Angola: '🇦🇴',
}

export function flagOf(nationality: string): string {
  return FLAGS[nationality] ?? '🌍'
}
