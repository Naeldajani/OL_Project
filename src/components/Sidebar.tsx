import { NavLink } from 'react-router-dom'

const NAV = [
  { to: '/momentum', label: 'Momentum par saison', icon: '📈' },
  { to: '/meilleur-xi', label: 'Meilleur XI', icon: '🌟' },
  { to: '/pronostics', label: 'Pronostics 2026-27', icon: '🧑‍🎤' },
  { to: '/devine-le-gone', label: 'Devine le Gone', icon: '🎮' },
  { to: '/matchs', label: 'Matchs & résultats', icon: '🌍' },
]

export default function Sidebar() {
  return (
    <aside className="w-[280px] shrink-0 border-r border-white/5 px-6 pt-8 pb-6 flex flex-col">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-11 h-11 rounded-xl bg-ink-800 ring-1 ring-white/10 flex items-center justify-center text-xl">
          📊
        </div>
        <div className="leading-tight">
          <div className="font-extrabold tracking-tight text-white text-lg">
            GONES
          </div>
          <div className="font-extrabold tracking-tight text-ol-red text-lg -mt-1">
            ANALYTICS
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-400 mb-8 ml-[3.5rem] -mt-1">
        Olympique Lyonnais, 2000-2026
      </div>

      <nav className="flex flex-col gap-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                isActive
                  ? 'bg-ink-800 text-white ring-1 ring-ol-red/50'
                  : 'text-slate-300 hover:bg-ink-800/60 hover:text-white'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
