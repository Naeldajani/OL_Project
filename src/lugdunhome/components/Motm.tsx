import type { Match } from '../../lib/types'
import type { MatchCommunity } from '../lib/types'
import { lineupFor } from '../lib/lineups'
import { Card, Face, ResultBar } from './ui'

const PODIUM = ['🥇', '🥈', '🥉']
/* Un podium pour désigner un fautif serait une récompense : on numérote. */
const BLAME_RANK = ['①', '②', '③']

export default function Motm({
  match,
  community,
  myVote,
  open,
  onVote,
  /** Après une défaite, désigner un « homme du match » sonne faux : la même
   *  mécanique de vote sert alors à désigner le responsable. */
  mode = 'motm',
}: {
  match: Match
  community: MatchCommunity
  myVote: string | null
  open: boolean
  onVote: (player: string) => void
  mode?: 'motm' | 'blame'
}) {
  const blame = mode === 'blame'
  const copy = blame
    ? {
        eyebrow: '😤 Responsable',
        askTitle: 'À qui la faute ?',
        doneTitle: 'Le principal responsable',
        crown: '😤 Désigné par la communauté',
      }
    : {
        eyebrow: '🏆 Homme du match',
        askTitle: 'Qui est votre Homme du Match ?',
        doneTitle: 'Homme du Match',
        crown: '🏆 Élu par la communauté',
      }
  const starters = lineupFor(match.id).filter((p) => p.role === 'titulaire')
  const total = Object.values(community.motm).reduce((a, b) => a + b, 0) || 1
  const ranked = Object.entries(community.motm)
    .map(([player, votes]) => ({ player, votes, pct: (votes / total) * 100 }))
    .sort((a, b) => b.votes - a.votes)

  const winner = ranked[0]

  return (
    <section>
      <div className="lh-eyebrow mb-1">{copy.eyebrow}</div>
      <h2 className="lh-display mb-3 text-2xl">{open ? copy.askTitle : copy.doneTitle}</h2>

      {!open && winner && (
        <Card
          raised
          className={`animate-lh-pop mb-4 overflow-hidden ${blame ? 'border-lh-red/40' : ''}`}
        >
          <div className="relative flex items-center gap-4 p-5">
            {!blame && <div className="lh-shine pointer-events-none absolute inset-0" />}
            <Face
              name={winner.player}
              size={72}
              className={`ring-2 ${blame ? 'ring-lh-red' : 'ring-lh-gold'}`}
            />
            <div className="min-w-0">
              <div className={`lh-eyebrow ${blame ? 'text-lh-redSoft' : 'text-lh-goldSoft'}`}>
                {copy.crown}
              </div>
              <div className="lh-display truncate text-2xl sm:text-3xl">{winner.player}</div>
              <div
                className={`lh-tabnum mt-1 text-sm font-bold ${
                  blame ? 'text-lh-redSoft' : 'text-lh-goldSoft'
                }`}
              >
                {winner.pct.toFixed(0)} % des votes
                <span className="ml-2 font-medium text-lh-muted">
                  ({winner.votes.toLocaleString('fr-FR')} voix)
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {open && (
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {starters.map((entry, i) => {
            const selected = myVote === entry.player
            return (
              <button
                key={entry.player}
                onClick={() => onVote(entry.player)}
                style={{ animationDelay: `${Math.min(i, 11) * 40}ms` }}
                className={`animate-lh-rise flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all ${
                  selected
                    ? blame
                      ? 'border-lh-red bg-lh-red/12 shadow-lg shadow-lh-red/10'
                      : 'border-lh-gold bg-lh-gold/12 shadow-lg shadow-lh-gold/10'
                    : 'border-lh-line bg-lh-surface/70 hover:border-lh-gold/40'
                }`}
              >
                <Face name={entry.player} size={38} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold">{entry.player}</span>
                  <span className="block truncate text-[10px] text-lh-muted">{entry.position}</span>
                </span>
                {selected && <span className="shrink-0 text-lg">🏆</span>}
              </button>
            )
          })}
        </div>
      )}

      <Card className="p-4">
        <div className="lh-eyebrow mb-3">
          {open ? 'Tendance en direct' : 'Podium final'}
        </div>
        <div className="flex flex-col gap-3">
          {ranked.slice(0, open ? 3 : 5).map((row, i) => (
            <div key={row.player} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-center text-sm">
                {(blame ? BLAME_RANK : PODIUM)[i] ?? `${i + 1}.`}
              </span>
              <Face name={row.player} size={30} />
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-baseline justify-between gap-2">
                  <span className="truncate text-xs font-bold">{row.player}</span>
                  <span
                    className={`lh-tabnum shrink-0 text-xs font-bold ${
                      blame ? 'text-lh-redSoft' : 'text-lh-goldSoft'
                    }`}
                  >
                    {row.pct.toFixed(0)} %
                  </span>
                </div>
                <ResultBar
                  pct={row.pct}
                  color={i === 0 ? (blame ? 'red' : 'gold') : 'muted'}
                  delay={i * 70}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-lh-muted">
          {total.toLocaleString('fr-FR')} votes exprimés
          {myVote && <> · ton vote : <span className="font-bold text-lh-text">{myVote}</span></>}
        </p>
      </Card>
    </section>
  )
}
