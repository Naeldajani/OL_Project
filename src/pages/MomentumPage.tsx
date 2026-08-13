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
import { opponent, result } from '../lib/matchHelpers'
import type { Match } from '../lib/types'

const RESULT_COLOR = { V: '#10b981', N: '#64748b', D: '#e3082a' } as const
const RESULT_POINTS = { V: 3, N: 1, D: 0 } as const

interface Step {
  idx: number
  points: number
  form: number
  position: number | null
  result: 'V' | 'N' | 'D'
  match: Match
  bestStreak: number | null
}

export default function MomentumPage() {
  const seasons = [...seedSeasons].sort((a, b) => (a.season < b.season ? -1 : 1))
  const [selectedSeason, setSelectedSeason] = useState(seasons[seasons.length - 1]?.season ?? '')
  const [activeMatch, setActiveMatch] = useState<Match | null>(null)

  const seasonMatches = useMemo(
    () =>
      seedMatches
        .filter((m) => m.season === selectedSeason && m.competition === 'Ligue 1')
        .sort((a, b) => (a.date < b.date ? -1 : 1)),
    [selectedSeason],
  )

  const { steps, pointsPerMatch, bestUnbeaten, bestWinStreak } = useMemo(() => {
    let points = 0
    let unbeaten = 0
    let bestUnbeatenLocal = 0
    let winStreak = 0
    let bestWinLen = 0
    let bestWinEnd = -1
    const results: ('V' | 'N' | 'D')[] = []

    seasonMatches.forEach((m) => {
      const r = result(m)
      results.push(r)
      points += RESULT_POINTS[r]
      if (r === 'D') unbeaten = 0
      else unbeaten += 1
      bestUnbeatenLocal = Math.max(bestUnbeatenLocal, unbeaten)
      if (r === 'V') {
        winStreak += 1
        if (winStreak > bestWinLen) {
          bestWinLen = winStreak
          bestWinEnd = results.length - 1
        }
      } else {
        winStreak = 0
      }
    })
    const bestWinStart = bestWinEnd - bestWinLen + 1

    let cum = 0
    const built: Step[] = seasonMatches.map((m, i) => {
      const r = result(m)
      cum += RESULT_POINTS[r]
      const windowStart = Math.max(0, i - 4)
      const windowMatches = seasonMatches.slice(windowStart, i + 1)
      const windowPoints = windowMatches.reduce((acc, wm) => acc + RESULT_POINTS[result(wm)], 0)
      const form = windowPoints / windowMatches.length
      return {
        idx: i + 1,
        points: cum,
        form: Math.round(form * 100) / 100,
        position: m.olPosition ?? null,
        result: r,
        match: m,
        bestStreak: bestWinLen >= 2 && i >= bestWinStart && i <= bestWinEnd ? cum : null,
      }
    })

    return {
      steps: built,
      pointsPerMatch: seasonMatches.length ? Math.round((points / seasonMatches.length) * 100) / 100 : 0,
      bestUnbeaten: bestUnbeatenLocal,
      bestWinStreak: bestWinLen,
    }
  }, [seasonMatches])

  const hasPositions = steps.some((s) => s.position != null)

  return (
    <div>
      <PageHeader
        icon="📈"
        titleFirst
        eyebrow="Ligue 1 — données réelles"
        title="Détail de la saison"
        description="Trajectoire cumulée de points et forme glissante sur 5 matchs, saison par saison (Ligue 1 uniquement — la notion de points ne s'applique pas aux coupes)."
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

      {steps.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">
            Aucun match de Ligue 1 documenté pour {selectedSeason} dans notre base actuelle.
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card>
              <div className="text-2xl font-extrabold text-ol-red">{pointsPerMatch}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">Points / match</div>
            </Card>
            <Card>
              <div className="text-2xl font-extrabold text-white">{bestUnbeaten} matchs</div>
              <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">
                Meilleure série sans défaite
              </div>
            </Card>
            <Card>
              <div className="text-2xl font-extrabold text-white">{bestWinStreak} victoires</div>
              <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">
                Meilleure série de victoires
              </div>
            </Card>
            <Card>
              <div className="text-2xl font-extrabold text-white">{steps.length}</div>
              <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">Matchs joués</div>
            </Card>
          </div>

          <Card className="mb-6">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-1">
              Trajectoire cumulée <span className="text-slate-500 font-medium">— points sur la saison</span>{' '}
              {bestWinStreak >= 2 && (
                <span className="text-ol-gold font-medium">— meilleure série de victoires</span>
              )}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Clique un point pour ouvrir le détail du match.</p>
            <div style={{ width: '100%', height: 240 }}>
              <ResponsiveContainer>
                <LineChart data={steps} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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
                    formatter={((_v: number, _n: unknown, ctx: { payload: Step }) => {
                      const s = ctx.payload
                      const lines = [
                        `J${s.idx} · vs ${opponent(s.match)}`,
                        `${s.points} pts cumulés`,
                        s.position != null ? `${s.position}ᵉ au classement` : null,
                        `Forme (5 matchs) ${s.form}/3`,
                      ].filter(Boolean)
                      return [lines.join(' · '), '']
                    }) as never}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="points"
                    stroke="#e3082a"
                    strokeWidth={2}
                    dot={((props: { cx?: number; cy?: number; payload?: Step }) => {
                      const { cx, cy, payload } = props
                      if (cx == null || cy == null || !payload) return <g key={Math.random()} />
                      return (
                        <circle
                          key={payload.idx}
                          cx={cx}
                          cy={cy}
                          r={4.5}
                          fill={RESULT_COLOR[payload.result]}
                          stroke="#0a1128"
                          strokeWidth={1.5}
                          className="cursor-pointer"
                          onClick={() => setActiveMatch(payload.match)}
                        />
                      )
                    }) as never}
                  />
                  <Line
                    type="stepAfter"
                    dataKey="bestStreak"
                    stroke="#f5b73d"
                    strokeWidth={3}
                    dot={false}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="mb-6">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-4">
              Forme glissante <span className="text-slate-500 font-medium">— moyenne sur les 5 derniers matchs</span>
            </h3>
            <div style={{ width: '100%', height: 160 }}>
              <ResponsiveContainer>
                <LineChart data={steps} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid stroke="#1b2d59" strokeDasharray="3 3" />
                  <XAxis dataKey="idx" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis domain={[0, 3]} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: '#111d3d',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 12,
                      color: 'white',
                    }}
                    labelFormatter={() => ''}
                    formatter={((v: number) => [`${v}/3`, 'Forme (5 matchs)']) as never}
                  />
                  <Line type="monotone" dataKey="form" stroke="#a78bfa" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="mb-6">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-4">
              Résultat <span className="text-slate-500 font-medium">— match par match</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {steps.map((s) => {
                const styles =
                  s.result === 'V'
                    ? 'bg-emerald-500/80 hover:bg-emerald-400'
                    : s.result === 'D'
                      ? 'bg-ol-red/80 hover:bg-ol-red'
                      : 'bg-slate-500/70 hover:bg-slate-400'
                return (
                  <button
                    key={s.idx}
                    onClick={() => setActiveMatch(s.match)}
                    title={`J${s.idx} vs ${opponent(s.match)} (${s.match.homeScore}-${s.match.awayScore})`}
                    className={`w-9 h-9 rounded-md ${styles} flex items-center justify-center text-[11px] font-black text-white transition-colors`}
                  >
                    {s.result}
                  </button>
                )
              })}
            </div>
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
            </div>
          </Card>

          {hasPositions && (
            <Card>
              <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-4">
                Classement <span className="text-slate-500 font-medium">— position au classement après chaque match</span>
              </h3>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                  <LineChart data={steps} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid stroke="#1b2d59" strokeDasharray="3 3" />
                    <XAxis dataKey="idx" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis
                      reversed
                      domain={[1, 20]}
                      tick={{ fill: '#94a3b8', fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: '#111d3d',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 12,
                        color: 'white',
                      }}
                      labelFormatter={() => ''}
                      formatter={((v: number) => [`${v}ᵉ`, 'Classement']) as never}
                    />
                    <Line
                      type="monotone"
                      dataKey="position"
                      stroke="#5b8fe0"
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}
        </>
      )}

      {activeMatch && <MatchModal match={activeMatch} onClose={() => setActiveMatch(null)} />}
    </div>
  )
}
