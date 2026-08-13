import { useMemo, useState } from 'react'
import type { Match } from '../../lib/types'
import type { MatchCommunity } from '../lib/types'
import { lineupFor, knownPlayer } from '../lib/lineups'
import { Card, Face, Pill, ResultBar } from './ui'

function toneFor(avg: number): string {
  if (avg >= 7.5) return 'text-emerald-400'
  if (avg >= 6) return 'text-lh-goldSoft'
  if (avg >= 4.5) return 'text-lh-muted'
  return 'text-lh-redSoft'
}

/** 1–10 selector. Big tap targets — this is a mobile-first product. */
function RatingPicker({
  value,
  onPick,
  disabled,
}: {
  value: number | undefined
  onPick: (n: number) => void
  disabled: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const active = value === n
        return (
          <button
            key={n}
            disabled={disabled}
            onClick={() => onPick(n)}
            aria-label={`Noter ${n} sur 10`}
            className={`h-8 w-8 rounded-lg text-xs font-black transition-all ${
              active
                ? 'scale-105 bg-lh-red text-white shadow-lg shadow-lh-red/30'
                : disabled
                  ? 'cursor-not-allowed bg-lh-void/60 text-lh-muted/40'
                  : 'bg-lh-void text-lh-muted hover:bg-lh-raised hover:text-lh-text'
            }`}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}

export default function RatePlayers({
  match,
  community,
  myRatings,
  open,
  onRate,
}: {
  match: Match
  community: MatchCommunity
  myRatings: Record<string, number>
  open: boolean
  onRate: (player: string, rating: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const lineup = lineupFor(match.id)

  const rows = useMemo(() => {
    const starters = lineup.filter((p) => p.role === 'titulaire')
    const bench = lineup.filter((p) => p.role === 'banc')
    const list = expanded ? [...starters, ...bench] : starters
    return list.map((entry) => {
      const agg = community.ratings[entry.player]
      const avg = agg && agg.count ? agg.sum / agg.count : 0
      return { entry, avg, count: agg?.count ?? 0 }
    })
  }, [lineup, community, expanded])

  const ranked = [...rows].sort((a, b) => b.avg - a.avg)
  const bestName = ranked[0]?.entry.player
  const ratedCount = Object.keys(myRatings).length

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="lh-eyebrow mb-1">⭐ Notes des joueurs</div>
          <h2 className="lh-display text-2xl">
            {open ? 'Note chaque Gone' : 'Notes de la communauté'}
          </h2>
        </div>
        {open && (
          <Pill tone={ratedCount ? 'green' : 'neutral'}>
            {ratedCount}/{rows.length} noté{ratedCount > 1 ? 's' : ''}
          </Pill>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {rows.map(({ entry, avg, count }, i) => {
          const known = knownPlayer(entry.player)
          const mine = myRatings[entry.player]
          const isBest = entry.player === bestName && avg > 0
          return (
            <Card
              key={entry.player + i}
              className={`animate-lh-rise p-3 ${isBest ? 'border-lh-gold/45' : ''}`}
            >
              <div style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}>
                <div className="flex items-center gap-3">
                  <Face name={entry.player} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold">{entry.player}</span>
                      {isBest && <span title="Meilleure note du match">🏅</span>}
                    </div>
                    <div className="truncate text-[11px] text-lh-muted">
                      {entry.shirt && <span className="lh-tabnum">#{entry.shirt} · </span>}
                      {known?.posteFr ?? entry.position}
                      {entry.role === 'banc' && ' · entré en jeu'}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`lh-display lh-tabnum text-2xl ${toneFor(avg)}`}>
                      {avg ? avg.toFixed(1) : '—'}
                    </div>
                    <div className="text-[10px] text-lh-muted">
                      {count.toLocaleString('fr-FR')} vote{count > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                <div className="mt-2.5">
                  <ResultBar pct={(avg / 10) * 100} color={avg >= 7 ? 'gold' : 'red'} delay={i * 30} />
                </div>

                {open ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <RatingPicker
                      value={mine}
                      onPick={(n) => onRate(entry.player, n)}
                      disabled={!open}
                    />
                    {mine != null && (
                      <span className="text-[11px] font-bold text-emerald-400">
                        Ta note : {mine}/10
                      </span>
                    )}
                  </div>
                ) : (
                  mine != null && (
                    <div className="mt-2 text-[11px] font-bold text-lh-muted">
                      Ta note : <span className="text-lh-text">{mine}/10</span>
                    </div>
                  )
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {lineup.some((p) => p.role === 'banc') && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 w-full rounded-xl border border-lh-line py-2.5 text-sm font-bold text-lh-muted transition-colors hover:border-lh-gold/40 hover:text-lh-goldSoft"
        >
          {expanded ? 'Masquer les remplaçants' : 'Afficher les remplaçants'}
        </button>
      )}
    </section>
  )
}
