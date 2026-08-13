import { useEffect, useMemo, useState } from 'react'
import { Card, EmptyState, Pill, SectionTitle } from '../components/ui'
import { backend } from '../lib/backend'
import type { LeaderboardRow, LhUser } from '../lib/types'
import { levelFor } from '../lib/scoring'

type Board = 'points' | 'accuracy' | 'activity'

const BOARDS: { id: Board; label: string; hint: string }[] = [
  { id: 'points', label: '🏆 Points', hint: 'Le classement général des pronostiqueurs' },
  { id: 'accuracy', label: '🎯 Réussite', hint: 'Meilleur taux de bons pronos (min. 10 pronos)' },
  { id: 'activity', label: '📣 Activité', hint: 'Les supporters les plus impliqués' },
]

export default function ClassementsPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [me, setMe] = useState<LhUser | null>(null)
  const [board, setBoard] = useState<Board>('points')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const [list, user] = await Promise.all([backend.getLeaderboard(), backend.getUser()])
      setRows(list)
      setMe(user)
      setLoading(false)
    })()
  }, [])

  const sorted = useMemo(() => {
    const copy = [...rows]
    if (board === 'accuracy') {
      return copy
        .filter((r) => r.predictions >= 10)
        .sort((a, b) => b.accuracy - a.accuracy || b.points - a.points)
    }
    if (board === 'activity') {
      return copy.sort(
        (a, b) => b.votes + b.ratedMatches * 2 - (a.votes + a.ratedMatches * 2),
      )
    }
    return copy.sort((a, b) => b.points - a.points)
  }, [rows, board])

  const myRank = useMemo(
    () => (me ? sorted.findIndex((r) => r.userId === me.id) : -1),
    [sorted, me],
  )

  if (loading) return <EmptyState icon="⏳" title="Chargement du classement…" />

  const active = BOARDS.find((b) => b.id === board)!

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle eyebrow="🏆 Classements" title="Le tableau d’honneur" />

      <div className="lh-rail -mx-1 flex gap-1.5 overflow-x-auto px-1">
        {BOARDS.map((b) => (
          <button
            key={b.id}
            onClick={() => setBoard(b.id)}
            className={`shrink-0 rounded-xl border px-3.5 py-2 text-sm font-bold transition-colors ${
              board === b.id
                ? 'border-lh-red bg-lh-red/15 text-lh-redSoft'
                : 'border-lh-line text-lh-muted hover:text-lh-text'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>
      <p className="-mt-2 text-xs text-lh-muted">{active.hint}</p>

      {myRank >= 0 && (
        <Card raised className="p-4">
          <div className="lh-eyebrow mb-2">Ta position</div>
          <Row row={sorted[myRank]} rank={myRank + 1} board={board} highlight />
        </Card>
      )}

      <div className="flex flex-col gap-2">
        {sorted.slice(0, 40).map((row, i) => (
          <Card key={row.userId} className="px-3 py-2.5">
            <Row row={row} rank={i + 1} board={board} highlight={row.userId === me?.id} />
          </Card>
        ))}
      </div>
    </div>
  )
}

function Row({
  row,
  rank,
  board,
  highlight,
}: {
  row: LeaderboardRow
  rank: number
  board: Board
  highlight?: boolean
}) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
  const { level } = levelFor(row.points)
  const value =
    board === 'accuracy'
      ? `${Math.round(row.accuracy * 100)} %`
      : board === 'activity'
        ? `${(row.votes + row.ratedMatches * 2).toLocaleString('fr-FR')}`
        : `${row.points.toLocaleString('fr-FR')}`
  const unit = board === 'points' ? 'pts' : board === 'activity' ? 'act.' : ''

  return (
    <div className={`flex items-center gap-3 ${highlight ? 'text-lh-goldSoft' : ''}`}>
      <span className="w-7 shrink-0 text-center text-sm font-black text-lh-muted">
        {medal ?? rank}
      </span>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lh-void text-lg">
        {row.avatar}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">
          {row.pseudo}
          {highlight && <span className="ml-1.5 text-[10px]">(toi)</span>}
        </div>
        <div className="truncate text-[11px] text-lh-muted">
          {level.icon} {level.name} · {row.predictions} pronos · {row.ratedMatches} matchs notés
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="lh-display lh-tabnum text-lg">{value}</div>
        {unit && <div className="text-[10px] text-lh-muted">{unit}</div>}
      </div>
    </div>
  )
}

export { Pill }
