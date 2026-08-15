import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { isShared } from '../lib/backend'
import { useAuth } from '../hooks/useAuth'

/* Les cinq premiers onglets tiennent dans la barre du bas sans défilement :
   au-delà, le pouce ne les atteint plus. Data et Classements, consultés
   plus rarement, passent dans le menu du profil. */
const NAV = [
  { to: '/', label: 'Accueil', icon: '🏠', end: true },
  { to: '/infol', label: "Inf'OL", icon: '📰' },
  { to: '/matchs', label: 'Matchs', icon: '⚽' },
  { to: '/pronos', label: 'Pronos', icon: '🔮' },
  { to: '/mercato', label: "Mercat'OL", icon: '🔁' },
]

const SECONDARY: typeof NAV = [
  { to: '/debats', label: 'Débats', icon: '🗣️' },
  { to: '/data', label: 'Data', icon: '📊' },
  { to: '/classements', label: 'Classements', icon: '🏆' },
]

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-lh-red shadow-lg shadow-lh-red/25">
        <span className="lh-display text-lg text-white">L</span>
        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-lh-gold" />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="lh-display block text-lg tracking-tight">
            LUGDUN<span className="text-lh-red">’</span>HOME
          </span>
          <span className="mt-0.5 block text-[9.5px] font-semibold uppercase tracking-[0.16em] text-lh-muted">
            La maison des supporters
          </span>
        </span>
      )}
    </div>
  )
}

export default function Layout({ children }: { children: ReactNode }) {
  const { session } = useAuth()

  return (
    <div className="min-h-screen pb-24 lg:pb-0">
      {/* top bar */}
      <header className="sticky top-0 z-40 border-b border-lh-line/70 bg-lh-void/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <NavLink to="/" className="shrink-0">
            <Wordmark />
          </NavLink>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {[...NAV, ...SECONDARY].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'bg-lh-red/15 text-lh-redSoft'
                      : 'text-lh-muted hover:bg-white/5 hover:text-lh-text'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <NavLink
            to="/profil"
            className="ml-auto flex items-center gap-2 rounded-full border border-lh-line bg-lh-raised px-2 py-1 lg:ml-2"
            title={session ? `Connecté : ${session.pseudo}` : 'Mon compte'}
          >
            <span className="text-base leading-none">{session?.avatar ?? '👤'}</span>
            <span className="hidden max-w-24 truncate text-xs font-bold sm:inline">
              {session?.pseudo ?? 'Compte'}
            </span>
          </NavLink>

          <span
            className="lg:ml-0"
            title={
              isShared
                ? 'Les votes sont partagés entre tous les supporters'
                : 'Mode local : tes votes sont enregistrés sur cet appareil'
            }
          >
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
                isShared
                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                  : 'border-lh-line bg-lh-raised text-lh-muted'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${isShared ? 'bg-emerald-400' : 'bg-lh-muted'}`}
              />
              {isShared ? 'Communauté' : 'Local'}
            </span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-4">
        <div className="lh-rule mb-4" />
        <p className="text-xs leading-relaxed text-lh-muted">
          Lugdun’Home — plateforme communautaire non officielle, sans lien avec l’Olympique
          Lyonnais. Résultats et compositions compilés depuis Wikipédia et Wikidata ; portraits
          sous licence libre Wikimedia Commons.{' '}
          <Link to="/mentions-legales" className="font-semibold underline underline-offset-2">
            Mentions légales et crédits
          </Link>
        </p>
      </footer>

      {/* mobile tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-lh-line bg-lh-night/95 backdrop-blur-xl lg:hidden">
        <div className="lh-rail flex overflow-x-auto px-1 pb-[env(safe-area-inset-bottom)]">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-w-[4.4rem] flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-bold transition-colors ${
                  isActive ? 'text-lh-redSoft' : 'text-lh-muted'
                }`
              }
            >
              <span className="text-lg leading-none">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
