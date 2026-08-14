import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Segmented } from '../components/Button'
import MatchHero from '../components/MatchHero'
import CountdownBanner, { useLiveWindow } from '../components/Countdown'
import RatePlayers from '../components/RatePlayers'
import Motm from '../components/Motm'
import DebatePanel from '../components/DebatePanel'
import { Card, Crest, EmptyState, Face, Pill } from '../components/ui'
import { useMatchCommunity } from '../hooks/useMatchCommunity'
import { isLatest, matchById } from '../lib/matches'
import { coachFor, lineupFor, opponentLineupFor } from '../lib/lineups'
import { resetDemoWindow, windowFor } from '../lib/matchWindow'

type Tab = 'notes' | 'hdm' | 'debat' | 'feuille'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'notes', label: 'Notes', icon: '⭐' },
  { id: 'hdm', label: 'Homme du match', icon: '🏆' },
  { id: 'debat', label: 'Débat', icon: '🗣️' },
  { id: 'feuille', label: 'Feuille de match', icon: '📋' },
]

export default function MatchPage() {
  const { id } = useParams()
  const match = id ? matchById(id) : undefined
  const [tab, setTab] = useState<Tab>('notes')
  const [windowKey, setWindowKey] = useState(0)

  const winState = useMemo(
    () => (match ? windowFor(match.id, match.date, isLatest(match.id)) : null),
    // windowKey lets "rejouer la fenêtre" recompute the state
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [match, windowKey],
  )
  const live = useLiveWindow(winState ?? { open: false, simulated: false, closesAt: 0, msLeft: 0 })
  const { community, myRatings, myMotm, myDebate, ratePlayer, voteMotm, voteDebate } =
    useMatchCommunity(match?.id)

  if (!match) {
    return <EmptyState icon="🔍" title="Match introuvable" hint="Ce match n’est pas dans la base." />
  }

  const open = live.open

  return (
    <div className="flex flex-col gap-6">
      <Link to="/matchs" className="text-xs font-bold text-lh-muted hover:text-lh-text">
        ← Tous les matchs
      </Link>

      <MatchHero match={match} />

      {winState && (
        <CountdownBanner
          state={winState}
          msLeft={live.msLeft}
          onReset={() => {
            resetDemoWindow(match.id)
            setWindowKey((k) => k + 1)
          }}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Pill tone="gold">👥 {community.participants.toLocaleString('fr-FR')} participants</Pill>
        {open ? <Pill tone="live">● Votes ouverts</Pill> : <Pill>Votes clos</Pill>}
      </div>

      {/* tabs */}
      <Segmented
        value={tab}
        onChange={setTab}
        className="-mx-1 px-1"
        options={TABS.map((t) => ({ value: t.id, label: `${t.icon}  ${t.label}` }))}
      />

      {tab === 'notes' && (
        <RatePlayers
          match={match}
          community={community}
          myRatings={myRatings}
          open={open}
          onRate={ratePlayer}
        />
      )}
      {tab === 'hdm' && (
        <Motm match={match} community={community} myVote={myMotm} open={open} onVote={voteMotm} />
      )}
      {tab === 'debat' && (
        <DebatePanel
          match={match}
          community={community}
          myVote={myDebate}
          open={open}
          onVote={voteDebate}
        />
      )}
      {tab === 'feuille' && <MatchSheet matchId={match.id} match={match} />}
    </div>
  )
}

function MatchSheet({ matchId, match }: { matchId: string; match: ReturnType<typeof matchById> }) {
  const ol = lineupFor(matchId)
  const adv = opponentLineupFor(matchId)
  const coach = coachFor(matchId)
  if (!match) return null

  const olIsHome = match.home === 'Lyon'
  const scorersFor = (side: 'home' | 'away') => match.scorers.filter((s) => s.team === side)

  return (
    <section className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="lh-eyebrow mb-3">⚽ Buteurs</div>
        <div className="grid gap-4 sm:grid-cols-2">
          {(['home', 'away'] as const).map((side) => {
            const club = side === 'home' ? match.home : match.away
            const list = scorersFor(side)
            return (
              <div key={side}>
                <div className="mb-2 flex items-center gap-2">
                  <Crest club={club} size={20} />
                  <span className="text-xs font-bold text-lh-muted">{club}</span>
                </div>
                {list.length === 0 ? (
                  <p className="text-xs text-lh-muted">Aucun but</p>
                ) : (
                  <ul className="flex flex-col gap-1">
                    {list.map((s, i) => (
                      <li key={i} className="text-sm">
                        <span className="font-bold">{s.player}</span>
                        {s.assist && <span className="text-lh-muted"> · passe {s.assist}</span>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="lh-eyebrow">📋 Composition OL</div>
          {coach && <span className="text-xs text-lh-muted">Coach : {coach}</span>}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {ol
            .filter((p) => p.role === 'titulaire')
            .map((p) => (
              <div key={p.player} className="flex items-center gap-2.5">
                <Face name={p.player} size={30} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{p.player}</span>
                <span className="lh-tabnum shrink-0 text-[11px] text-lh-muted">#{p.shirt}</span>
              </div>
            ))}
        </div>
        {ol.some((p) => p.role === 'banc') && (
          <>
            <div className="lh-eyebrow mb-2 mt-4">Banc</div>
            <p className="text-xs text-lh-muted">
              {ol
                .filter((p) => p.role === 'banc')
                .map((p) => p.player)
                .join(' · ')}
            </p>
          </>
        )}
      </Card>

      {adv.length > 0 && (
        <Card className="p-4">
          <div className="lh-eyebrow mb-3">
            Composition {olIsHome ? match.away : match.home}
          </div>
          <p className="text-xs text-lh-muted">
            {adv
              .filter((p) => p.role === 'titulaire')
              .map((p) => p.player)
              .join(' · ')}
          </p>
        </Card>
      )}
    </section>
  )
}
