import type { ReactNode } from 'react'

export default function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`bg-ink-800/70 rounded-2xl ring-1 ring-white/5 shadow-card p-6 ${className}`}
    >
      {children}
    </div>
  )
}

export function PageHeader({
  icon,
  eyebrow,
  title,
  description,
  right,
}: {
  icon: string
  eyebrow: string
  title: string
  description?: string
  right?: ReactNode
}) {
  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-2 pb-4 mb-1 border-b border-white/10">
        <span className="text-2xl mr-1">{icon}</span>
        <span className="text-2xl font-bold text-slate-400">{eyebrow}</span>
        <span className="text-2xl font-bold text-white">{title}</span>
        {right && <span className="ml-auto">{right}</span>}
      </div>
      {description && (
        <p className="text-blue-300/80 mt-4 leading-relaxed">{description}</p>
      )}
    </div>
  )
}
