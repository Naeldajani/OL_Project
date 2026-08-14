import { getCrestStyle } from '../lib/crest'

/**
 * Écusson de club, dessiné en SVG.
 *
 * Aucun logo officiel n'est reproduit : ce sont des œuvres protégées, et
 * l'audit des licences a montré que la quasi-totalité de ceux qui circulent
 * sur Wikipédia y sont hébergés sous exception. Ce qu'on dessine ici, ce
 * sont les couleurs et le motif de maillot du club — une combinaison de
 * bandes et de teintes n'est pas protégeable — dans une forme d'écusson
 * commune à tous les clubs. Le résultat est reconnaissable au premier coup
 * d'œil sans emprunter quoi que ce soit.
 */
export default function CrestBadge({
  club,
  size = 40,
  className = '',
}: {
  club: string
  size?: number
  className?: string
}) {
  const { bg, fg, abbr, pattern = 'plain' } = getCrestStyle(club)
  // identifiants uniques : deux <clipPath> homonymes dans la même page et
  // le navigateur applique le premier à tout le monde
  const uid = `crest-${slug(club)}`
  const fontSize = abbr.length > 3 ? 26 : abbr.length > 2 ? 32 : 40

  return (
    <svg
      viewBox="0 0 100 112"
      width={size}
      height={size * 1.12}
      role="img"
      aria-label={club}
      className={`shrink-0 ${className}`}
    >
      <title>{club}</title>
      <defs>
        <clipPath id={`${uid}-shape`}>
          <path d={SHIELD} />
        </clipPath>
        <linearGradient id={`${uid}-sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.28" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#${uid}-shape)`}>
        <rect width="100" height="112" fill={bg} />
        <Pattern pattern={pattern} fg={fg} />
        <rect width="100" height="112" fill={`url(#${uid}-sheen)`} />
      </g>

      <path d={SHIELD} fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="3" />

      <text
        x="50"
        y="58"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fontWeight="900"
        fill={fg}
        stroke="rgba(0,0,0,0.35)"
        strokeWidth="1"
        paintOrder="stroke"
        style={{ letterSpacing: '-0.04em' }}
      >
        {abbr}
      </text>
    </svg>
  )
}

/** Écusson classique : épaules droites, flancs incurvés, pointe en bas. */
const SHIELD = 'M6 6 H94 V62 Q94 92 50 108 Q6 92 6 62 Z'

function Pattern({ pattern, fg }: { pattern: string; fg: string }) {
  const soft = { fill: fg, opacity: 0.9 }
  switch (pattern) {
    case 'stripes':
      return (
        <>
          {[14, 42, 70].map((x) => (
            <rect key={x} x={x} y="0" width="16" height="112" {...soft} />
          ))}
        </>
      )
    case 'hoops':
      return (
        <>
          {[10, 42, 74].map((y) => (
            <rect key={y} x="0" y={y} width="100" height="18" {...soft} />
          ))}
        </>
      )
    case 'sash':
      return <path d="M-10 92 L72 -10 L104 8 L22 110 Z" {...soft} />
    case 'halves':
      return <rect x="50" y="0" width="50" height="112" {...soft} />
    default:
      return null
  }
}

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .toLowerCase()
