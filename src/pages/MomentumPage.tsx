import { useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card, { PageHeader } from '../components/Card'
import Select from '../components/Select'
import MatchModal from '../components/MatchModal'
import { seedSeasons } from '../data/seed-seasons'
import { seedMatches } from '../data/seed-matches'
import { formatDate, opponent, result } from '../lib/matchHelpers'
import type { Match } from '../lib/types'

const RESULT_COLOR = { V: '#10b981', N: '#64748b', D: '#e3082a' } as const

export default function MomentumPage() {
  const seasons = [...seedSeasons].sort((a, b) => (a.season < b.season ? -1 : 1))
  const [selectedSeason, setSelectedSeason] = useState(seasons[seasons.length - 1]?.season ?? '')
  const [activeMatch, setActiveMatch] = useState<Match | null>(null)

  const seasonMatches = useMemo(
    () =>
      seedMatches
        .filter((m) => m.season === selectedSeason)
        .sort((a, b) => (a.date < b.date ? -1 : 1)),
    [selectedSeason],
  )

  const seasonInfo = seedSeasons.find((s) => s.season === selectedSeason)

  const progression = useMemo(() => {
    let points = 0
    return seasonMatches.map((m, i) => {
      const r = result(m)
      points += r === 'V' ? 3 : r === 'N' ? 1 : 0
      return {
        idx: i + 1,
        label: `${i + 1}. ${opponent(m)}`,
        points,
        result: r,
        match: m,
      }
    })
  }, [seasonMatches])

  return (
    <div>
      <PageHeader
        icon="📈"
        eyebrow="Stats"
        title="Momentum par saison"
        description="Le fil d'une saison OL, match après match : points cumulés et résultat de chaque rencontre."
        right={
          <Select value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)}>
            {seasons
              .slice()
              .reverse()
              .map((s) => (
                <option key={s.season} value={s.season}>
                  {s.season}
                </option>
              ))}
          </Select>
        }
      />

      <Card className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
            {selectedSeason}
            {seasonInfo?.manager ? ` — ${seasonInfo.manager}` : ''}
          </h3>
          {seasonInfo && (
            <div className="text-sm text-slate-400">
              {seasonInfo.position ? `Classement final : ${seasonInfo.position}ᵉ` : ''}
              {seasonInfo.points !== undefined ? ` (${seasonInfo.points} pts)` : ''}
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500 mb-4">
          Points cumulés par l'OL au fil de ses matchs documentés cette saison — pas le classement
          officiel journée par journée (il faudrait les résultats des 17 autres clubs, qu'on n'a
          pas encore).
        </p>

        {progression.length === 0 ? (
          <p className="text-sm text-slate-500">
            Aucun match documenté pour {selectedSeason} dans notre base actuelle.
          </p>
        ) : (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={progression} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#1b2d59" strokeDasharray="3 3" />
                <XAxis dataKey="idx" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: '#111d3d',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    color: 'white',
                  }}
                  labelFormatter={() => ''}
                  formatter={((value: number, _name: unknown, ctx: { payload: (typeof progression)[number] }) => [
                    `${value} pts — vs ${opponent(ctx.payload.match)}`,
                    'Cumulé',
                  ]) as never}
                />
                <Line
                  type="stepAfter"
                  dataKey="points"
                  stroke="#f5b73d"
                  strokeWidth={2}
                  dot={((props: { cx?: number; cy?: number; payload?: (typeof progression)[number] }) => {
                    const { cx, cy, payload } = props
                    if (cx == null || cy == null || !payload) return <g key={Math.random()} />
                    return (
                      <circle
                        key={payload.idx}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={RESULT_COLOR[payload.result]}
                        stroke="#0a1128"
                        strokeWidth={1.5}
                        className="cursor-pointer"
                        onClick={() => setActiveMatch(payload.match)}
                      />
                    )
                  }) as never}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">
            Victoire / Nul / Défaite — {selectedSeason}
          </h3>
        </div>

        {seasonMatches.length === 0 ? (
          <p className="text-sm text-slate-500">Rien à afficher pour cette saison.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {seasonMatches.map((m) => {
              const r = result(m)
              const styles =
                r === 'V'
                  ? 'bg-emerald-500/80 hover:bg-emerald-400'
                  : r === 'D'
                    ? 'bg-ol-red/80 hover:bg-ol-red'
                    : 'bg-slate-500/70 hover:bg-slate-400'
              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMatch(m)}
                  title={`${formatDate(m.date)} — vs ${opponent(m)} (${m.homeScore}-${m.awayScore})`}
                  className={`w-9 h-9 rounded-md ${styles} flex items-center justify-center text-[11px] font-black text-white transition-colors`}
                >
                  {r}
                </button>
              )
            })}
          </div>
        )}
        <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500/80 inline-block" /> Victoire
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-500/70 inline-block" /> Nul
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-ol-red/80 inline-block" /> Défaite
          </span>
          <span className="ml-auto">Clique un match (carré ou point du graphique) pour le détail</span>
        </div>
      </Card>

      {activeMatch && <MatchModal match={activeMatch} onClose={() => setActiveMatch(null)} />}
    </div>
  )
}
