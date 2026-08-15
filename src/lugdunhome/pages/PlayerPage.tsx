import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, Crest, EmptyState, Face, Pill, ResultBar, SectionTitle, Stat } from '../components/ui'
import { backend } from '../lib/backend'
import { knownPlayer, lineupFor } from '../lib/lineups'
import { ratableMatches, formatShortDate } from '../lib/matches'
import { flagFor } from '../../lib/countryFlags'
import { opponent, result } from '../../lib/matchHelpers'
import type { MatchCommunity } from '../lib/types'

const SCOPE = 40

interface Appearance {
  matchId: string
  date: string
  avg: number
  role: string
  motmVotes: number
}

export default function PlayerPage() {
  const { name: rawName } = useParams()
  const name = rawName ? decodeURIComponent(rawName) : ''
  const [byMatch, setByMatch] = useState<Record<string, MatchCommunity>>({})
  const [loading, setLoading] = useState(true)

  const scope = useMemo(() => ratableMatches.slice(0, SCOPE), [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const entries = await Promise.all(
        scope.map(async (m) => [m.id, await backend.getCommunity(m.id)] as const),
      )
      if (cancelled) return
      setByMatch(Object.fromEntries(entries))
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [scope])

  const appearances = useMemo<Appearance[]>(() => {
    const out: Appearance[] = []
    for (const m of scope) {
      const community = byMatch[m.id]
      if (!community) continue
      const agg = community.ratings[name]
      if (!agg?.count) continue
      const entry = lineupFor(m.id).find((p) => p.player === name)
      out.push({
        matchId: m.id,
        date: m.date,
        avg: agg.sum / agg.count,
        role: entry?.role ?? 'titulaire',
        motmVotes: community.motm[name] ?? 0,
      })
    }
    return out.sort((a, b) => (a.date < b.date ? -1 : 1))
  }, [scope, byMatch, name])

  const known = knownPlayer(name)
  const lineupInfo = useMemo(() => {
    for (const m of scope) {
      const entry = lineupFor(m.id).find((p) => p.player === name)
      if (entry) return entry
    }
    return null
  }, [scope, name])

  if (loading) return <EmptyState icon="⏳" title="Chargement du joueur…" />
  if (!appearances.length) {
    return (
      <EmptyState
        icon="🔍"
        title={`Pas encore de notes pour ${name}`}
        hint="Ce joueur n’apparaît pas dans les matchs notés récemment."
      />
    )
  }

  const avg = appearances.reduce((a, b) => a + b.avg, 0) / appearances.length
  const best = [...appearances].sort((a, b) => b.avg - a.avg)[0]
  const worst = [...appearances].sort((a, b) => a.avg - b.avg)[0]
  const motmTitles = appearances.filter((a) => {
    const community = byMatch[a.matchId]
    if (!community) return false
    const top = Object.entries(community.motm).sort((x, y) => y[1] - x[1])[0]
    return top?.[0] === name
  }).length

  const chartData = appearances.map((a, i) => ({
    idx: i + 1,
    note: Math.round(a.avg * 10) / 10,
    matchId: a.matchId,
    date: a.date,
  }))

  return (
    <div className="flex flex-col gap-6">
      <Link to="/data" className="text-xs font-bold text-lh-muted hover:text-lh-text">
        ← Retour aux data
      </Link>

      {/* identity */}
      <Card className="relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-lh-red/15 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <Face name={name} size={84} className="ring-2 ring-lh-line" />
          <div className="min-w-0 flex-1">
            <h1 className="lh-display text-3xl sm:text-4xl">{name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {known?.posteFr && <Pill tone="red">{known.posteFr}</Pill>}
              {lineupInfo?.position && <Pill>{lineupInfo.position}</Pill>}
              {(known?.nationality || lineupInfo?.nationality) && (
                <Pill>
                  {flagFor(known?.nationality ?? lineupInfo!.nationality)}{' '}
                  {known?.nationality ?? lineupInfo?.nationality}
                </Pill>
              )}
              {known?.yearsAtOL && <Pill tone="gold">OL {known.yearsAtOL}</Pill>}
              {lineupInfo?.shirt && <Pill>#{lineupInfo.shirt}</Pill>}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={avg.toFixed(2)} label="Note moyenne" accent />
        <Stat value={appearances.length} label="Matchs notés" />
        <Stat value={best.avg.toFixed(1)} label="Meilleure note" />
        <Stat value={motmTitles} label="Hommes du match" />
      </div>

      {/* rating trajectory */}
      <section>
        <SectionTitle eyebrow="Évolution" title="Notes match après match" />
        <Card className="p-4">
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="lhNote" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c9a227" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#c9a227" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#252d42" strokeDasharray="3 3" />
                <XAxis dataKey="idx" tick={{ fill: '#8a94ac', fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fill: '#8a94ac', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    background: '#121724',
                    border: '1px solid #252d42',
                    borderRadius: 12,
                    color: '#eef1f8',
                  }}
                  separator=""
                  labelFormatter={() => ''}
                  formatter={
                    ((v: number, _n: unknown, ctx: { payload: (typeof chartData)[number] }) => {
                      const m = ratableMatches.find((x) => x.id === ctx.payload.matchId)
                      return [
                        `${v}/10 · ${m ? `vs ${opponent(m)}` : ''} ${
                          m ? formatShortDate(m.date) : ''
                        }`,
                        '',
                      ]
                    }) as never
                  }
                />
                <Area
                  type="monotone"
                  dataKey="note"
                  stroke="#e8c66a"
                  strokeWidth={2}
                  fill="url(#lhNote)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* best / worst */}
      <section className="grid gap-4 sm:grid-cols-2">
        <PerfCard title="🔥 Meilleure sortie" app={best} tone="text-emerald-400" />
        <PerfCard title="🥶 Soirée compliquée" app={worst} tone="text-lh-redSoft" />
      </section>

      {/* career, when we know the player */}
      {known && known.career.length > 1 && (
        <section>
          <SectionTitle eyebrow="Parcours" title="Carrière" />
          <Card className="p-4">
            <div className="flex flex-col gap-2.5">
              {known.career.map((step, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Crest club={step.club} size={28} />
                  <span className="min-w-0 flex-1 truncate text-sm font-bold">{step.club}</span>
                  <span className="lh-tabnum shrink-0 text-xs text-lh-muted">{step.years}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* match log */}
      <section>
        <SectionTitle eyebrow="Détail" title="Toutes ses notes" />
        <div className="flex flex-col gap-2">
          {[...appearances].reverse().map((a) => {
            const m = ratableMatches.find((x) => x.id === a.matchId)
            if (!m) return null
            const r = result(m)
            return (
              <Link
                key={a.matchId}
                to={`/matchs/${a.matchId}`}
                className="lh-card flex items-center gap-3 p-3 transition-colors hover:border-lh-gold/40"
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded text-[10px] font-black ${
                    r === 'V' ? 'bg-emerald-500/80' : r === 'D' ? 'bg-lh-red/80' : 'bg-lh-muted/60'
                  }`}
                >
                  {r}
                </span>
                <Crest club={m.home === 'Lyon' ? m.away : m.home} size={22} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-bold">
                    vs {opponent(m)} · {m.homeScore}–{m.awayScore}
                  </div>
                  <div className="text-[10px] text-lh-muted">
                    {formatShortDate(m.date)} · {m.competition}
                    {a.role === 'entre' && ' · entré en jeu'}
                    {a.role === 'banc' && ' · sur le banc'}
                  </div>
                </div>
                <div className="w-20 shrink-0">
                  <ResultBar pct={(a.avg / 10) * 100} color={a.avg >= 7 ? 'gold' : 'red'} />
                </div>
                <span className="lh-display lh-tabnum w-10 shrink-0 text-right text-lg">
                  {a.avg.toFixed(1)}
                </span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}

function PerfCard({ title, app, tone }: { title: string; app: Appearance; tone: string }) {
  const m = ratableMatches.find((x) => x.id === app.matchId)
  return (
    <Card className="p-4">
      <div className="lh-eyebrow mb-3">{title}</div>
      {m && (
        <Link to={`/matchs/${m.id}`} className="flex items-center gap-3">
          <Crest club={m.home === 'Lyon' ? m.away : m.home} size={34} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">
              vs {opponent(m)} · {m.homeScore}–{m.awayScore}
            </div>
            <div className="text-[11px] text-lh-muted">
              {formatShortDate(m.date)} · {m.competition}
            </div>
          </div>
          <span className={`lh-display lh-tabnum text-2xl ${tone}`}>{app.avg.toFixed(1)}</span>
        </Link>
      )}
    </Card>
  )
}
