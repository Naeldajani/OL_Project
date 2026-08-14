interface Props {
  name: string
  number?: number
  size?: number
  className?: string
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export default function PlayerAvatar({ name, number, size = 64, className = '' }: Props) {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-br from-ink-600 to-ink-800 ring-2 ring-white/10 shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <span
        className="font-black text-white/90"
        style={{ fontSize: size * 0.34 }}
      >
        {initials(name)}
      </span>
      {number !== undefined && (
        <span
          className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-ol-red text-white font-bold ring-2 ring-ink-900"
          style={{ width: size * 0.36, height: size * 0.36, fontSize: size * 0.18 }}
        >
          {number}
        </span>
      )}
    </div>
  )
}
