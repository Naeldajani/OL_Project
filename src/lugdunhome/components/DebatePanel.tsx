import type { Match } from '../../lib/types'
import type { MatchCommunity } from '../lib/types'
import { debateFor } from '../lib/debates'
import { Card, ResultBar } from './ui'

export default function DebatePanel({
  match,
  community,
  myVote,
  open,
  onVote,
}: {
  match: Match
  community: MatchCommunity
  myVote: string | null
  open: boolean
  onVote: (optionId: string) => void
}) {
  const debate = debateFor(match)
  const total = Object.values(community.debate).reduce((a, b) => a + b, 0) || 1
  const answered = myVote != null
  const showResults = answered || !open

  const leader = Object.entries(community.debate).sort((a, b) => b[1] - a[1])[0]

  return (
    <section>
      <div className="lh-eyebrow mb-1">🗣️ Le débat du match</div>
      <h2 className="lh-display mb-3 text-2xl">{debate.question}</h2>

      <Card className="p-4">
        <div className="flex flex-col gap-2.5">
          {debate.options.map((opt, i) => {
            const votes = community.debate[opt.id] ?? 0
            const pct = (votes / total) * 100
            const isMine = myVote === opt.id
            const isLeader = leader?.[0] === opt.id

            if (!showResults) {
              return (
                <button
                  key={opt.id}
                  onClick={() => onVote(opt.id)}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className="animate-lh-rise rounded-xl border border-lh-line bg-lh-void/50 px-4 py-3.5 text-left text-sm font-bold transition-all hover:border-lh-red/50 hover:bg-lh-red/10"
                >
                  {opt.label}
                </button>
              )
            }

            return (
              <button
                key={opt.id}
                disabled={!open}
                onClick={() => open && onVote(opt.id)}
                className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                  isMine
                    ? 'border-lh-red/60 bg-lh-red/10'
                    : 'border-lh-line bg-lh-void/40'
                } ${open ? 'hover:border-lh-red/40' : 'cursor-default'}`}
              >
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-bold">
                    {opt.label}
                    {isMine && <span className="ml-2 text-[10px] text-lh-redSoft">TON VOTE</span>}
                  </span>
                  <span className="lh-tabnum shrink-0 text-sm font-black">{pct.toFixed(0)} %</span>
                </div>
                <ResultBar pct={pct} color={isLeader ? 'red' : 'muted'} delay={i * 70} />
              </button>
            )
          })}
        </div>

        <p className="mt-3 text-[11px] text-lh-muted">
          {showResults
            ? `${total.toLocaleString('fr-FR')} supporters ont tranché`
            : 'Réponds pour découvrir l’avis de la communauté'}
        </p>
      </Card>
    </section>
  )
}
