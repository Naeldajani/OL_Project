import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

/* Un seul vocabulaire de boutons pour toute l'application : avant, chaque
   page redéclarait ses propres classes et deux actions de même importance
   n'avaient pas le même poids visuel d'un écran à l'autre. */
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-lh-red text-white shadow-lg shadow-lh-red/20 hover:bg-lh-red/90 active:shadow-none border-transparent',
  secondary: 'bg-lh-raised text-lh-text border-lh-line hover:border-lh-gold/45',
  ghost: 'bg-transparent text-lh-muted border-transparent hover:bg-white/5 hover:text-lh-text',
  danger: 'bg-transparent text-red-400 border-red-500/40 hover:bg-red-500/10',
}

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-5 py-3.5 text-base rounded-2xl gap-2.5',
}

function classes(variant: Variant, size: Size, full: boolean, extra: string) {
  return [
    'inline-flex items-center justify-center border font-black transition-all',
    'active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lh-gold',
    VARIANTS[variant],
    SIZES[size],
    full ? 'w-full' : '',
    extra,
  ].join(' ')
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  full?: boolean
  loading?: boolean
  icon?: ReactNode
}

export default function Button({
  variant = 'primary',
  size = 'md',
  full = false,
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: Props) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={classes(variant, size, full, className)}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  )
}

export function ButtonLink({
  to,
  variant = 'secondary',
  size = 'md',
  full = false,
  icon,
  children,
  className = '',
}: {
  to: string
  variant?: Variant
  size?: Size
  full?: boolean
  icon?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Link to={to} className={classes(variant, size, full, className)}>
      {icon}
      {children}
    </Link>
  )
}

/** Sélecteur segmenté : les trois pages qui filtrent une liste (Match,
 *  Pronos, Classements) redéclaraient chacune les mêmes classes. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className = '',
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  className?: string
}) {
  return (
    <div className={`lh-rail flex gap-1.5 overflow-x-auto ${className}`}>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-pressed={value === o.value}
          className={`shrink-0 rounded-xl border px-3.5 py-2 text-sm font-bold transition-colors ${
            value === o.value
              ? 'border-lh-red bg-lh-red/15 text-lh-redSoft'
              : 'border-lh-line text-lh-muted hover:text-lh-text'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Spinner() {
  return (
    <span
      className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  )
}
