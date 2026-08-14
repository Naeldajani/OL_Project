import { crestGradient, getCrestStyle } from '../lib/crest'

interface Props {
  club: string
  size?: number
  className?: string
}

/** Blason maison : couleurs du club et initiales.
 *
 * Aucun logo officiel n'est diffusé. L'audit des licences
 * (scraping/audit_licences.py) a montré que 267 des 273 logos récupérés
 * étaient des imports sous exception au droit d'auteur — celui de l'OL
 * compris — donc inutilisables sur un site public. */
export default function ClubCrest({ club, size = 44, className = '' }: Props) {
  const { bg, fg, abbr } = getCrestStyle(club)
  const fontSize = size * (abbr.length > 3 ? 0.235 : abbr.length > 2 ? 0.3 : 0.38)

  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-[28%] ring-1 ring-white/10 ${className}`}
      style={{ width: size, height: size, background: crestGradient(bg) }}
      title={club}
      aria-label={club}
    >
      <span className="font-extrabold tracking-tight leading-none" style={{ color: fg, fontSize }}>
        {abbr}
      </span>
    </div>
  )
}
