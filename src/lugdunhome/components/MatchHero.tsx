import { Link } from 'react-router-dom'
import type { Match } from '../../lib/types'
import { olScore, oppScore, opponent, result } from '../../lib/matchHelpers'
import { formatLongDate } from '../lib/matches'
import { Crest, Pill } from './ui'

const RESULT_LABEL = { V: 'Victoire', N: 'Nul', D: 'Défaite' } as const

export function ResultTag({ r }: { r: 'V' | 'N' | 'D' }) {
  const tone = r === 'V' ? 'green' : r === 'D' ? 'red' : 'neutral'
  return <Pill tone={tone}>{RESULT_LABEL[r]}</Pill>
}

/** The big scoreboard used at the top of a match page and on the home hero. */
export default function MatchHero({
  match,
  compact = false,
}: {
  match: Match
  compact?: boolean
}) {
  const r = result(match)
  const accent =
    r === 'V' ? 'from-emerald-500/20' : r === 'D' ? 'from-lh-red/20' : 'from-lh-muted/15'

  return (
    <div className={`lh-card relative overflow-hidden ${compact ? 'p-4' : 'p-5 sm:p-7'}`}>
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accent} to-transparent`} />
      <div className="relative">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Pill tone="gold">{match.competition}</Pill>
          {match.round && <Pill>J{match.round}</Pill>}
          <ResultTag r={r} />
          <span className="ml-auto text-xs text-lh-muted">{formatLongDate(match.date)}</span>
        </div>

        <div className="flex items-center justify-center gap-3 sm:gap-8">
          <TeamSide club={match.home} align="right" compact={compact} />
          <div className="shrink-0 text-center">
            <div
              className={`lh-display lh-tabnum ${compact ? 'text-4xl' : 'text-5xl sm:text-6xl'}`}
            >
              {match.homeScore}
              <span className="mx-1.5 text-lh-muted">–</span>
              {match.awayScore}
            </div>
            {match.penalties && (
              <div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-lh-goldSoft">
                aux tirs au but
              </div>
            )}
            {!compact && (
              <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-lh-muted">
                {match.venue === 'domicile' ? 'À domicile' : 'À l’extérieur'}
              </div>
            )}
          </div>
          <TeamSide club={match.away} align="left" compact={compact} />
        </div>

        {/* Names live under the scoreline on phones, where the inline
            layout would truncate them to a single letter. */}
        <div className="mt-2 flex items-center justify-between gap-3 sm:hidden">
          <span className="min-w-0 flex-1 truncate text-center text-xs font-bold">
            {match.home === 'Lyon' ? 'Olympique Lyonnais' : match.home}
          </span>
          <span className="min-w-0 flex-1 truncate text-center text-xs font-bold">
            {match.away === 'Lyon' ? 'Olympique Lyonnais' : match.away}
          </span>
        </div>

        {!compact && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="Buts marqués" value={olScore(match)} />
            <MiniStat label="Buts encaissés" value={oppScore(match)} />
            <MiniStat label="Adversaire" value={opponent(match)} small />
            <MiniStat
              label="Affluence"
              value={match.attendance ? match.attendance.toLocaleString('fr-FR') : '—'}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function TeamSide({
  club,
  align,
  compact,
}: {
  club: string
  align: 'left' | 'right'
  compact: boolean
}) {
  const isOL = club === 'Lyon'
  return (
    <div
      className={`flex min-w-0 flex-1 items-center gap-3 ${
        align === 'right' ? 'justify-end text-right' : 'justify-start text-left'
      } ${align === 'right' ? 'flex-row' : 'flex-row-reverse'}`}
    >
      <span
        className={`hidden min-w-0 truncate font-bold sm:block ${
          compact ? 'text-sm' : 'text-base sm:text-lg'
        } ${isOL ? 'text-lh-text' : 'text-lh-muted'}`}
      >
        {isOL ? 'Olympique Lyonnais' : club}
      </span>
      <Crest club={club} size={compact ? 34 : 52} />
    </div>
  )
}

function MiniStat({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="rounded-xl border border-lh-line bg-lh-void/50 px-3 py-2.5">
      <div className={`lh-tabnum truncate font-black ${small ? 'text-sm' : 'text-xl'}`}>{value}</div>
      <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-lh-muted">
        {label}
      </div>
    </div>
  )
}

/** Compact row used in lists. */
export function MatchRow({ match }: { match: Match }) {
  const r = result(match)
  const bar = r === 'V' ? 'bg-emerald-500' : r === 'D' ? 'bg-lh-red' : 'bg-lh-muted'
  return (
    <Link
      to={`/matchs/${match.id}`}
      className="lh-card flex items-center gap-3 overflow-hidden py-2.5 pl-0 pr-3 transition-colors hover:border-lh-gold/40"
    >
      <span className={`h-11 w-1 shrink-0 rounded-r ${bar}`} />
      <Crest club={match.home} size={26} />
      <Crest club={match.away} size={26} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">
          {match.home} <span className="text-lh-muted">vs</span> {match.away}
        </div>
        <div className="text-[11px] text-lh-muted">
          {match.competition} · {new Date(`${match.date}T12:00:00`).toLocaleDateString('fr-FR')}
        </div>
      </div>
      <span className="lh-display lh-tabnum shrink-0 text-lg">
        {match.homeScore}–{match.awayScore}
        {match.penalties && <span className="ml-1 text-[10px] text-lh-goldSoft">tab</span>}
      </span>
    </Link>
  )
}
