import ClubCrest from './ClubCrest'
import { formatDate, result } from '../lib/matchHelpers'
import type { Match } from '../lib/types'

export function ResultBadge({ r }: { r: 'V' | 'N' | 'D' }) {
  const styles = {
    V: 'bg-emerald-500/15 text-emerald-400',
    N: 'bg-slate-500/15 text-slate-300',
    D: 'bg-ol-red/15 text-ol-red',
  }
  const labels = { V: 'Victoire', N: 'Nul', D: 'Défaite' }
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles[r]}`}>
      {labels[r]}
    </span>
  )
}

export default function MatchModal({ match, onClose }: { match: Match; onClose: () => void }) {
  const r = result(match)
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-start justify-center pt-24 z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-ink-800 rounded-2xl ring-1 ring-white/10 max-w-xl w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-ink-700/60 p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">
            {match.competition} · {match.season} · {formatDate(match.date)}
            {match.round ? ` · ${match.round}` : ''}
          </div>
          <h2 className="text-xl font-extrabold text-white mb-4">
            {match.home} vs {match.away}
          </h2>
          <div className="flex items-center gap-4">
            <ClubCrest club={match.home} size={32} />
            <span className="font-semibold text-white">{match.home}</span>
            <span className="text-3xl font-black text-white bg-ink-900/60 rounded-lg px-4 py-1">
              {match.homeScore} - {match.awayScore}
            </span>
            <span className="font-semibold text-white">{match.away}</span>
            <ClubCrest club={match.away} size={32} />
            <ResultBadge r={r} />
          </div>
        </div>
        <div className="p-6">
          {match.scorers.length > 0 && (
            <div className="mb-6 grid grid-cols-2 gap-x-6">
              {([match.home, match.away] as const).map((team) => {
                const side = team === match.home ? 'home' : 'away'
                const teamScorers = match.scorers.filter((s) => s.team === side)
                if (teamScorers.length === 0) return <div key={team} />
                return (
                  <div key={team}>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400 mb-2">
                      <ClubCrest club={team} size={18} />
                      <span>{team}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {teamScorers.map((s, i) => (
                        <div key={i} className="text-sm text-white">
                          ⚽ {s.minute != null ? `${s.minute}' ` : ''}
                          {s.player}
                          {s.assist ? <span className="text-slate-400"> ({s.assist})</span> : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
            {match.round && (
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  Journée / Tour
                </div>
                <div className="text-white font-medium">{match.round}</div>
              </div>
            )}
            {match.referee && (
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">Arbitre</div>
                <div className="text-white font-medium">{match.referee}</div>
              </div>
            )}
            {match.formationHome && (
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  Formation {match.home}
                </div>
                <div className="text-white font-medium">{match.formationHome}</div>
              </div>
            )}
            {match.formationAway && (
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  Formation {match.away}
                </div>
                <div className="text-white font-medium">{match.formationAway}</div>
              </div>
            )}
            {match.attendance && (
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">Affluence</div>
                <div className="text-white font-medium">{match.attendance.toLocaleString('fr-FR')}</div>
              </div>
            )}
            {match.venue && (
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">Stade</div>
                <div className="text-white font-medium">{match.venue}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
