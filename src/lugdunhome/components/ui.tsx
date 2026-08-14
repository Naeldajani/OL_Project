import type { ReactNode } from 'react'
import { CREST_MANIFEST } from '../../data/crest-manifest'
import { PHOTO_MANIFEST } from '../../data/photo-manifest'

export function Crest({ club, size = 32, className = '' }: { club: string; size?: number; className?: string }) {
  const src = CREST_MANIFEST[club]
  if (!src) {
    const abbr = club
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-lh-raised text-lh-muted font-black ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.36 }}
        title={club}
      >
        {abbr}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt={club}
      title={club}
      width={size}
      height={size}
      loading="lazy"
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

/** Lineup spellings and research spellings differ on accents often enough
 * ("Duje Caleta-Car" vs "Duje Ćaleta-Car") that an exact lookup drops real
 * photos, so fall back to an accent-insensitive index. */
const normalizeName = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

const PHOTOS_BY_NORM: Record<string, string> = {}
for (const [key, value] of Object.entries(PHOTO_MANIFEST)) {
  PHOTOS_BY_NORM[normalizeName(key)] = value
}

export function photoFor(name: string): string | undefined {
  return PHOTO_MANIFEST[name] ?? PHOTOS_BY_NORM[normalizeName(name)]
}

export function Face({
  name,
  size = 44,
  className = '',
}: {
  name: string
  size?: number
  className?: string
}) {
  const src = photoFor(name)
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
  if (!src) {
    return (
      <span
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lh-raised to-lh-surface ring-1 ring-lh-line font-black text-lh-muted ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.34 }}
        title={name}
      >
        {initials}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt={name}
      title={name}
      width={size}
      height={size}
      loading="lazy"
      className={`shrink-0 rounded-full object-cover ring-1 ring-lh-line ${className}`}
      style={{ width: size, height: size }}
    />
  )
}

export function Card({
  children,
  className = '',
  raised = false,
}: {
  children: ReactNode
  className?: string
  raised?: boolean
}) {
  return <div className={`${raised ? 'lh-card-raised' : 'lh-card'} ${className}`}>{children}</div>
}

export function SectionTitle({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string
  title: string
  action?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && <div className="lh-eyebrow mb-1.5">{eyebrow}</div>}
        <h2 className="lh-display text-2xl sm:text-3xl">{title}</h2>
      </div>
      {action}
    </div>
  )
}

export function Stat({
  value,
  label,
  accent = false,
}: {
  value: ReactNode
  label: string
  accent?: boolean
}) {
  return (
    <div className="lh-card px-4 py-3.5">
      <div
        className={`lh-display lh-tabnum text-2xl sm:text-3xl ${accent ? 'text-lh-red' : 'text-lh-text'}`}
      >
        {value}
      </div>
      <div className="mt-1 text-[10.5px] font-semibold uppercase tracking-wider text-lh-muted">
        {label}
      </div>
    </div>
  )
}

/** Horizontal proportion bar used for every community result. */
export function ResultBar({
  pct,
  color = 'red',
  delay = 0,
}: {
  pct: number
  color?: 'red' | 'gold' | 'blue' | 'muted'
  delay?: number
}) {
  const tone = {
    red: 'bg-lh-red',
    gold: 'bg-lh-gold',
    blue: 'bg-lh-blue',
    muted: 'bg-lh-muted',
  }[color]
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-lh-void/70">
      <div
        className={`animate-lh-grow h-full rounded-full ${tone}`}
        style={{ width: `${Math.max(1.5, pct)}%`, animationDelay: `${delay}ms` }}
      />
    </div>
  )
}

export function Pill({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode
  tone?: 'neutral' | 'red' | 'gold' | 'green' | 'live'
  className?: string
}) {
  const tones = {
    neutral: 'bg-lh-raised text-lh-muted border-lh-line',
    red: 'bg-lh-red/15 text-lh-redSoft border-lh-red/40',
    gold: 'bg-lh-gold/15 text-lh-goldSoft border-lh-gold/40',
    green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
    live: 'bg-lh-red text-white border-lh-red',
  }[tone]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${tones} ${className}`}
    >
      {children}
    </span>
  )
}

export function EmptyState({ icon, title, hint }: { icon: string; title: string; hint?: string }) {
  return (
    <div className="lh-card flex flex-col items-center gap-2 px-6 py-12 text-center">
      <span className="text-3xl">{icon}</span>
      <p className="font-bold">{title}</p>
      {hint && <p className="max-w-sm text-sm text-lh-muted">{hint}</p>}
    </div>
  )
}
