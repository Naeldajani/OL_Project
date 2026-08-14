import type { ReactNode, SelectHTMLAttributes } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  children: ReactNode
}

export default function Select({ children, className = '', ...rest }: Props) {
  return (
    <select
      {...rest}
      className={`bg-ink-900/70 ring-1 ring-white/10 focus:ring-ol-gold rounded-lg px-3 py-2 text-sm text-white outline-none appearance-none cursor-pointer ${className}`}
    >
      {children}
    </select>
  )
}
