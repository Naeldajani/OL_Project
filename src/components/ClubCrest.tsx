import { getCrestStyle } from '../lib/crest'

interface Props {
  club: string
  size?: number
  className?: string
}

export default function ClubCrest({ club, size = 44, className = '' }: Props) {
  const { bg, fg, abbr } = getCrestStyle(club)
  const fontSize = abbr.length > 3 ? size * 0.26 : size * 0.32

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full ring-2 ring-white/10 shrink-0 ${className}`}
      style={{ width: size, height: size, background: bg }}
      title={club}
    >
      <span
        className="font-extrabold tracking-tight"
        style={{ color: fg, fontSize }}
      >
        {abbr}
      </span>
    </div>
  )
}
