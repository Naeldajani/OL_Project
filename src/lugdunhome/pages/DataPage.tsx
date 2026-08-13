import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Crest, EmptyState, Face, Pill, ResultBar, SectionTitle, Stat } from '../components/ui'
import { backend } from '../lib/backend'
import { ratableMatches, formatShortDate } from '../lib/matches'
import type { MatchCommunity } from '../lib/types'
import { seedMatches } from '../../data/seed-matches'
import { olScore, oppScore, result } from '../../lib/matchHelpers'

interface PlayerAgg {
  player: string
  sum: number
  count: number
  matches: number
  best: { avg: number; matchId: string } | null
  worst: { avg: number; matchId: string } | null
  motm: number
}

const SCOPE = 40 // matches deep enough to be meaningful, light enough to stay instant

export default function DataPage() {
  const scope = useMemo(() => ratableMatches.slice(0, SCOPE), [])
  const [byMatch, setByMatch] = useState<Record<string, MatchCommunity>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
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

  const players = useMemo(() => {
    const map = new Map<string, PlayerAgg>()
    for (const m of scope) {
      const community = byMatch[m.id]
      if (!community) continue
      for (const [player, agg] of Object.entries(community.ratings)) {
        if (!agg.count) continue
        const avg = agg.sum / agg.count
        const cur =
          map.get(player) ??
          ({ player, sum: 0, count: 0, matches: 0, best: null, worst: null, motm: 0 } as PlayerAgg)
        cur.sum += avg
        cur.count += 1
        cur.matches += 1
        if (!cur.best || avg > cur.best.avg) cur.best = { avg, matchId: m.id }
        if (!cur.worst || avg < cur.worst.avg) cur.worst = { avg, matchId: m.id }
        map.set(player, cur)
      }
      const topMotm = Object.entries(community.motm).sort((a, b) => b[1] - a[1])[0]
      if (topMotm) {
        const cur = map.get(topMotm[0])
        if (cur) cur.motm += 1
      }
    }
    return [...map.values()].filter((p) => p.matches >= 3)
  }, [scope, byMatch])

  const ranked = useMemo(
    () => [...players].sort((a, b) => b.sum / b.count - a.sum / a.count),
    [players],
  )
  const mostMotm = useMemo(() => [...players].sort((a, b) => b.motm - a.motm).slice(0, 5), [players])

  const bestPerf = useMemo(() => {
    const rows: { player: string; avg: number; matchId: string }[] = []
    for (const p of players) if (p.best) rows.push({ player: p.player, ...p.best })
    return rows.sort((a, b) => b.avg - a.avg).slice(0, 5)
  }, [players])

  const worstPerf = useMemo(() => {
    const rows: { player: string; avg: number; matchId: string }[] = []
    for (const p of players) if (p.worst) rows.push({ player: p.player, ...p.worst })
    return rows.sort((a, b) => a.avg - b.avg).slice(0, 5)
  }, [players])

  const clubStats = useMemo(() => {
    let gf = 0
    let ga = 0
    let v = 0
    let n = 0
    let d = 0
    for (const m of seedMatches) {
      gf += olScore(m)
      ga += oppScore(m)
      const r = result(m)
      if (r === 'V') v++
      else if (r === 'N') n++
      else d++
    }
    return { gf, ga, v, n, d, played: seedMatches.length }
  }, [])

  const totalVotes = useMemo(
    () =>
      Object.values(byMatch).reduce(
        (acc, c) =>
          acc +
          Object.values(c.ratings).reduce((a, b) => a + b.count, 0) +
          Object.values(c.motm).reduce((a, b) => a + b, 0),
        0,
      ),
    [byMatch],
  )

  if (loading) {
    return <EmptyState icon="⏳" title="Compilation des données…" hint="On agrège la mémoire de la communauté." />
  }

  return (
    <div className="flex flex-col gap-7">
      <SectionTitle eyebrow="📊 Data" title="La mémoire du Kop" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={clubStats.played.toLocaleString('fr-FR')} label="Matchs en base" accent />
        <Stat value={`${clubStats.v}-${clubStats.n}-${clubStats.d}`} label="V-N-D" />
        <Stat value={`${clubStats.gf}-${clubStats.ga}`} label="Buts pour/contre" />
        <Stat value={totalVotes.toLocaleString('fr-FR')} label="Votes communauté" />
      </div>
      <p className="-mt-4 text-xs text-lh-muted">
        Les classements de notes portent sur les {scope.length} derniers matchs notables (joueurs
        avec au moins 3 matchs notés).
      </p>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="lh-eyebrow mb-3">⭐ Meilleures moyennes</div>
          <RankList
            rows={ranked.slice(0, 8).map((p) => ({
              player: p.player,
              value: (p.sum / p.count).toFixed(2),
              sub: `${p.matches} matchs`,
              pct: ((p.sum / p.count) / 10) * 100,
            }))}
            color="gold"
          />
        </Card>

        <Card className="p-4">
          <div className="lh-eyebrow mb-3">📉 Moyennes les plus basses</div>
          <RankList
            rows={ranked
              .slice(-8)
              .reverse()
              .map((p) => ({
                player: p.player,
                value: (p.sum / p.count).toFixed(2),
                sub: `${p.matches} matchs`,
                pct: ((p.sum / p.count) / 10) * 100,
              }))}
            color="red"
          />
        </Card>

        <Card className="p-4">
          <div className="lh-eyebrow mb-3">🏆 Plus d’Hommes du Match</div>
          <RankList
            rows={mostMotm.map((p) => ({
              player: p.player,
              value: String(p.motm),
              sub: 'titres',
              pct: mostMotm[0]?.motm ? (p.motm / mostMotm[0].motm) * 100 : 0,
            }))}
            color="gold"
          />
        </Card>

        <Card className="p-4">
          <div className="lh-eyebrow mb-3">🔥 Meilleures performances</div>
          <div className="flex flex-col gap-2.5">
            {bestPerf.map((row) => (
              <PerfRow key={row.player + row.matchId} {...row} tone="text-emerald-400" />
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="lh-eyebrow mb-3">🥶 Soirées à oublier</div>
          <div className="flex flex-col gap-2.5">
            {worstPerf.map((row) => (
              <PerfRow key={row.player + row.matchId} {...row} tone="text-lh-redSoft" />
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="lh-eyebrow mb-3">👥 Matchs les plus suivis</div>
          <div className="flex flex-col gap-2.5">
            {scope
              .map((m) => ({ m, participants: byMatch[m.id]?.participants ?? 0 }))
              .sort((a, b) => b.participants - a.participants)
              .slice(0, 5)
              .map(({ m, participants }) => (
                <Link
                  key={m.id}
                  to={`/matchs/${m.id}`}
                  className="flex items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-white/5"
                >
                  <Crest club={m.home} size={22} />
                  <Crest club={m.away} size={22} />
                  <span className="min-w-0 flex-1 truncate text-xs font-bold">
                    {m.home} {m.homeScore}–{m.awayScore} {m.away}
                  </span>
                  <Pill tone="gold">{participants.toLocaleString('fr-FR')}</Pill>
                </Link>
              ))}
          </div>
        </Card>
      </section>
    </div>
  )
}

function RankList({
  rows,
  color,
}: {
  rows: { player: string; value: string; sub: string; pct: number }[]
  color: 'gold' | 'red'
}) {
  if (!rows.length) return <p className="text-sm text-lh-muted">Pas encore de données.</p>
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r, i) => (
        <div key={r.player} className="flex items-center gap-2.5">
          <span className="w-4 shrink-0 text-xs font-black text-lh-muted">{i + 1}</span>
          <Face name={r.player} size={28} />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="truncate text-xs font-bold">{r.player}</span>
              <span className="lh-tabnum shrink-0 text-xs font-black">{r.value}</span>
            </div>
            <ResultBar pct={r.pct} color={color} delay={i * 50} />
          </div>
        </div>
      ))}
    </div>
  )
}

function PerfRow({
  player,
  avg,
  matchId,
  tone,
}: {
  player: string
  avg: number
  matchId: string
  tone: string
}) {
  const match = ratableMatches.find((m) => m.id === matchId)
  return (
    <Link
      to={`/matchs/${matchId}`}
      className="flex items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-white/5"
    >
      <Face name={player} size={28} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-xs font-bold">{player}</div>
        {match && (
          <div className="truncate text-[10px] text-lh-muted">
            vs {match.home === 'Lyon' ? match.away : match.home} · {formatShortDate(match.date)}
          </div>
        )}
      </div>
      <span className={`lh-display lh-tabnum shrink-0 text-lg ${tone}`}>{avg.toFixed(1)}</span>
    </Link>
  )
}
