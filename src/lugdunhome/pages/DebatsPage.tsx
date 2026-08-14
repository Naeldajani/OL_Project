import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, Crest, Pill, ResultBar, SectionTitle } from '../components/ui'
import { backend } from '../lib/backend'
import { ratableMatches, formatShortDate } from '../lib/matches'
import { debateFor } from '../lib/debates'
import type { MatchCommunity } from '../lib/types'

export default function DebatsPage() {
  const list = useMemo(() => ratableMatches.slice(0, 12), [])
  const [data, setData] = useState<Record<string, MatchCommunity>>({})
  const [mine, setMine] = useState<Record<string, string | null>>({})

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const entries = await Promise.all(
        list.map(async (m) => {
          const [c, v] = await Promise.all([
            backend.getCommunity(m.id),
            backend.getMyDebateVote(m.id),
          ])
          return [m.id, c, v] as const
        }),
      )
      if (cancelled) return
      setData(Object.fromEntries(entries.map(([id, c]) => [id, c])))
      setMine(Object.fromEntries(entries.map(([id, , v]) => [id, v])))
    })()
    return () => {
      cancelled = true
    }
  }, [list])

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle eyebrow="🗣️ Débats" title="Ce que pense le Kop" />
      <p className="-mt-2 text-sm text-lh-muted">
        Une question par match, tranchée par la communauté. Les débats ouverts se votent depuis la
        page du match.
      </p>

      <div className="flex flex-col gap-3">
        {list.map((m) => {
          const debate = debateFor(m)
          const community = data[m.id]
          const total = community
            ? Object.values(community.debate).reduce((a, b) => a + b, 0) || 1
            : 1
          const ranked = community
            ? Object.entries(community.debate)
                .map(([id, votes]) => ({
                  id,
                  votes,
                  pct: (votes / total) * 100,
                  label: debate.options.find((o) => o.id === id)?.label ?? id,
                }))
                .sort((a, b) => b.votes - a.votes)
            : []
          const myVote = mine[m.id]

          return (
            <Card key={m.id} className="p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Crest club={m.home} size={22} />
                <Crest club={m.away} size={22} />
                <span className="text-xs font-bold text-lh-muted">
                  {m.home} {m.homeScore}–{m.awayScore} {m.away}
                </span>
                <span className="text-xs text-lh-muted">· {formatShortDate(m.date)}</span>
                {myVote && (
                  <Pill tone="green" className="ml-auto">
                    Tu as voté
                  </Pill>
                )}
              </div>

              <p className="mb-3 font-bold leading-snug">{debate.question}</p>

              <div className="flex flex-col gap-2">
                {ranked.slice(0, 4).map((row, i) => (
                  <div key={row.id}>
                    <div className="mb-1 flex items-baseline justify-between gap-3">
                      <span className="truncate text-xs font-semibold">
                        {row.label}
                        {myVote === row.id && (
                          <span className="ml-1.5 text-[10px] text-lh-redSoft">TOI</span>
                        )}
                      </span>
                      <span className="lh-tabnum shrink-0 text-xs font-bold">
                        {row.pct.toFixed(0)} %
                      </span>
                    </div>
                    <ResultBar pct={row.pct} color={i === 0 ? 'red' : 'muted'} delay={i * 60} />
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between gap-3">
                <span className="text-[11px] text-lh-muted">
                  {total.toLocaleString('fr-FR')} réponses
                </span>
                <Link
                  to={`/matchs/${m.id}`}
                  className="text-xs font-bold text-lh-muted hover:text-lh-text"
                >
                  Voir le match →
                </Link>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
