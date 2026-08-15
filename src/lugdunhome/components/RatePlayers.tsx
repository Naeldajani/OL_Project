import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Match } from '../../lib/types'
import type { MatchCommunity } from '../lib/types'
import { coachFor, lineupFor, knownPlayer, type LineupEntry } from '../lib/lineups'
import Pitch from './Pitch'
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
    // fixed 10-column grid: on a phone this keeps the whole 1–10 scale on a
    // single row instead of orphaning "10" onto its own line
    <div className="grid w-full grid-cols-10 gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
        const active = value === n
        return (
          <button
            key={n}
            disabled={disabled}
            onClick={() => onPick(n)}
            aria-label={`Noter ${n} sur 10`}
            className={`h-9 rounded-lg text-xs font-black transition-all ${
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

/** Spread of the community's 1–10 votes: shows consensus vs division,
 * which a single average can't. */
function Distribution({ buckets, mine }: { buckets: number[]; mine?: number }) {
  const max = Math.max(...buckets, 1)
  const total = buckets.reduce((a, b) => a + b, 0)
  return (
    <div className="mt-3 rounded-xl border border-lh-line bg-lh-void/50 p-3">
      <div className="lh-eyebrow mb-2">Répartition des {total.toLocaleString('fr-FR')} notes</div>
      {/* bars are direct children of a fixed-height flex row so their
          percentage heights resolve against a definite container */}
      <div className="flex h-16 items-end gap-1">
        {buckets.map((count, i) => {
          const note = i + 1
          const isMine = mine === note
          return (
            <div
              key={note}
              title={`${count.toLocaleString('fr-FR')} vote${count > 1 ? 's' : ''} à ${note}/10`}
              className={`flex-1 rounded-t transition-all ${
                isMine ? 'bg-lh-red' : note >= 7 ? 'bg-lh-gold/70' : 'bg-lh-muted/45'
              }`}
              style={{ height: `${Math.max(4, (count / max) * 100)}%` }}
            />
          )
        })}
      </div>
      <div className="mt-1 flex gap-1">
        {buckets.map((_, i) => (
          <span
            key={i}
            className={`flex-1 text-center text-[9px] font-bold ${
              mine === i + 1 ? 'text-lh-redSoft' : 'text-lh-muted'
            }`}
          >
            {i + 1}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * Notes des joueurs — terrain vu du dessus.
 *
 * L'ancienne version alignait quinze cartes identiques : impossible de savoir
 * qui jouait où, et le banc s'y mêlait alors qu'une partie n'était jamais
 * entrée en jeu. Ici le onze est à sa place sur le terrain, les entrants
 * suivent en dessous, et le reste du banc n'est pas notable puisqu'il n'a pas
 * joué.
 */
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
  const [selected, setSelected] = useState<string | null>(null)
  const [openDist, setOpenDist] = useState<string | null>(null)
  const lineup = lineupFor(match.id)
  const coach = coachFor(match.id)

  const decorate = (entry: LineupEntry) => {
    const agg = community.ratings[entry.player]
    return {
      entry,
      avg: agg && agg.count ? agg.sum / agg.count : 0,
      count: agg?.count ?? 0,
      mine: myRatings[entry.player],
    }
  }

  const starters = useMemo(
    () => lineup.filter((p) => p.role === 'titulaire').map(decorate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lineup, community, myRatings],
  )
  const substitutes = useMemo(
    () => lineup.filter((p) => p.role === 'entre').map(decorate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lineup, community, myRatings],
  )
  const unused = lineup.filter((p) => p.role === 'banc').length

  const rateable = [...starters, ...substitutes]
  const ratedCount = rateable.filter((r) => r.mine != null).length
  const current = rateable.find((r) => r.entry.player === selected) ?? null

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="lh-eyebrow mb-1">⭐ Notes des joueurs</div>
          <h2 className="lh-display text-2xl">
            {open ? 'Note chaque Gone' : 'Notes de la communauté'}
          </h2>
        </div>
        <Pill tone={ratedCount ? 'green' : 'neutral'}>
          {ratedCount}/{rateable.length} noté{ratedCount > 1 ? 's' : ''}
        </Pill>
      </div>

      <Pitch
        players={starters}
        coach={coach || undefined}
        selected={selected}
        onSelect={(player) => setSelected((cur) => (cur === player ? null : player))}
      />

      <p className="mt-2 text-center text-[11px] text-lh-muted">
        {open ? 'Touche un joueur pour lui donner une note.' : 'Touche un joueur pour voir le détail.'}
      </p>

      {current && (
        <div className="mt-3">
          <PlayerRating
            data={current}
            open={open}
            onRate={onRate}
            distribution={community.distribution[current.entry.player]}
            showDist={openDist === current.entry.player}
            onToggleDist={() =>
              setOpenDist((cur) => (cur === current.entry.player ? null : current.entry.player))
            }
          />
        </div>
      )}

      {substitutes.length > 0 && (
        <div className="mt-5">
          <div className="lh-eyebrow mb-2">🔄 Entrés en jeu ({substitutes.length})</div>
          <div className="flex flex-col gap-2">
            {substitutes.map((data) => (
              <button
                key={data.entry.player}
                onClick={() =>
                  setSelected((cur) => (cur === data.entry.player ? null : data.entry.player))
                }
                className={`lh-card flex items-center gap-3 p-2.5 text-left transition-colors ${
                  selected === data.entry.player ? 'border-lh-gold/50' : ''
                }`}
              >
                <Face
                  name={data.entry.player}
                  size={36}
                  className={data.mine != null ? 'ring-2 ring-emerald-400' : ''}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">{data.entry.player}</div>
                  <div className="truncate text-[11px] text-lh-muted">
                    {knownPlayer(data.entry.player)?.posteFr ?? data.entry.position}
                    {data.entry.minute && ` · entré à la ${data.entry.minute}ᵉ`}
                  </div>
                </div>
                <span className={`lh-display lh-tabnum text-xl ${toneFor(data.mine ?? data.avg)}`}>
                  {(data.mine ?? data.avg) ? (data.mine ?? data.avg).toFixed(1) : '—'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {unused > 0 && (
        <p className="mt-3 text-[11px] leading-relaxed text-lh-muted">
          {unused} remplaçant{unused > 1 ? 's sont restés' : ' est resté'} sur le banc — sans temps
          de jeu, {unused > 1 ? 'ils ne sont pas notables' : 'il n’est pas notable'}.
        </p>
      )}
    </section>
  )
}

/** Panneau de notation du joueur sélectionné sur le terrain. */
function PlayerRating({
  data,
  open,
  onRate,
  distribution,
  showDist,
  onToggleDist,
}: {
  data: { entry: LineupEntry; avg: number; count: number; mine?: number }
  open: boolean
  onRate: (player: string, rating: number) => void
  distribution?: number[]
  showDist: boolean
  onToggleDist: () => void
}) {
  const { entry, avg, count, mine } = data
  const known = knownPlayer(entry.player)

  return (
    <Card raised className="animate-lh-rise p-3">
      <div className="flex items-center gap-3">
        <Link to={`/joueur/${encodeURIComponent(entry.player)}`} className="shrink-0">
          <Face name={entry.player} size={46} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={`/joueur/${encodeURIComponent(entry.player)}`}
            className="block truncate text-sm font-black hover:text-lh-goldSoft"
          >
            {entry.player}
          </Link>
          <div className="truncate text-[11px] text-lh-muted">
            {entry.shirt && <span className="lh-tabnum">#{entry.shirt} · </span>}
            {known?.posteFr ?? entry.position}
            {entry.role === 'entre' && entry.minute && ` · entré à la ${entry.minute}ᵉ`}
            {entry.role === 'titulaire' && entry.minute && ` · sorti à la ${entry.minute}ᵉ`}
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
        <ResultBar pct={(avg / 10) * 100} color={avg >= 7 ? 'gold' : 'red'} />
      </div>

      {open ? (
        <div className="mt-3 flex flex-col gap-1.5">
          <RatingPicker value={mine} onPick={(n) => onRate(entry.player, n)} disabled={!open} />
          {mine != null && (
            <span className="text-[11px] font-bold text-emerald-400">Ta note : {mine}/10</span>
          )}
        </div>
      ) : (
        mine != null && (
          <div className="mt-2 text-[11px] font-bold text-lh-muted">
            Ta note : <span className="text-lh-text">{mine}/10</span>
          </div>
        )
      )}

      {count > 0 && (
        <button
          onClick={onToggleDist}
          className="mt-2 text-[11px] font-bold text-lh-muted transition-colors hover:text-lh-goldSoft"
        >
          {showDist ? 'Masquer la répartition ▲' : 'Voir la répartition des notes ▼'}
        </button>
      )}
      {showDist && distribution && <Distribution buckets={distribution} mine={mine} />}
    </Card>
  )
}
