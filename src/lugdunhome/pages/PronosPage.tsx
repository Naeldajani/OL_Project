import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Crest, EmptyState, Pill, SectionTitle, Stat } from '../components/ui'
import { backend } from '../lib/backend'
import type { Prediction } from '../lib/types'
import { ratableMatches, formatShortDate, matchById } from '../lib/matches'
import { lineupFor } from '../lib/lineups'
import { openFixtures, untilKickoff, type UpcomingMatch } from '../lib/fixtures'
import { POINTS, explainPrediction, levelFor, scorePrediction } from '../lib/scoring'

type Tab = 'avenir' | 'passes'

export default function PronosPage() {
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({})
  const [tab, setTab] = useState<Tab>('avenir')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const list = await backend.getMyPredictions()
    setPredictions(Object.fromEntries(list.map((p) => [p.matchId, p])))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const fixtures = useMemo(() => openFixtures().slice(0, 12), [])
  const played = useMemo(() => ratableMatches.slice(0, 12), [])

  const stats = useMemo(() => {
    let points = 0
    let correct = 0
    let exact = 0
    let scored = 0
    let pending = 0
    for (const p of Object.values(predictions)) {
      const m = matchById(p.matchId)
      if (!m) {
        pending += 1
        continue
      }
      scored += 1
      const pts = scorePrediction(p, m)
      points += pts
      if (pts > 0) correct += 1
      if (p.homeScore === m.homeScore && p.awayScore === m.awayScore) exact += 1
    }
    return {
      points,
      correct,
      exact,
      pending,
      scored,
      accuracy: scored ? Math.round((correct / scored) * 100) : 0,
    }
  }, [predictions])

  const { level, next, progress } = levelFor(stats.points)

  const save = async (matchId: string, homeScore: number, awayScore: number, scorerId?: string) => {
    await backend.savePrediction({ matchId, homeScore, awayScore, scorerId: scorerId ?? null })
    load()
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle eyebrow="🔮 Pronostics" title="Tes pronos" />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={stats.points} label="Points" accent />
        <Stat value={`${stats.accuracy} %`} label="Réussite" />
        <Stat value={stats.pending} label="En attente" />
        <Stat value={stats.exact} label="Scores exacts" />
      </div>

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{level.icon}</span>
            <div>
              <div className="lh-eyebrow">Niveau</div>
              <div className="font-black">{level.name}</div>
            </div>
          </div>
          {next && (
            <div className="text-right">
              <div className="lh-eyebrow">Prochain</div>
              <div className="text-sm font-bold text-lh-muted">
                {next.icon} {next.name}
              </div>
            </div>
          )}
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-lh-void">
          <div
            className="animate-lh-grow h-full rounded-full bg-gradient-to-r from-lh-red to-lh-gold"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        {next && (
          <p className="mt-2 text-[11px] text-lh-muted">
            Encore <span className="font-bold text-lh-text">{next.min - stats.points}</span> points
            pour devenir {next.name}.
          </p>
        )}
      </Card>

      <Card className="p-4">
        <div className="lh-eyebrow mb-2">Barème</div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Pill tone="gold">Score exact +{POINTS.exactScore}</Pill>
          <Pill tone="green">Bon vainqueur +{POINTS.rightOutcome}</Pill>
          <Pill>Bon écart +{POINTS.rightGoalDiff}</Pill>
          <Pill tone="red">Buteur trouvé +{POINTS.scorer}</Pill>
        </div>
      </Card>

      <div className="flex gap-1.5">
        <TabButton active={tab === 'avenir'} onClick={() => setTab('avenir')}>
          À venir ({fixtures.length})
        </TabButton>
        <TabButton active={tab === 'passes'} onClick={() => setTab('passes')}>
          Matchs joués
        </TabButton>
      </div>

      {loading ? (
        <p className="text-sm text-lh-muted">Chargement…</p>
      ) : tab === 'avenir' ? (
        <section>
          <p className="mb-3 text-xs text-lh-muted">
            Le vrai calendrier 2026-27. Les pronos se verrouillent au coup d’envoi et seront
            comptabilisés une fois le match joué.
          </p>
          {fixtures.length === 0 ? (
            <EmptyState icon="📅" title="Aucun match à venir" hint="La saison est terminée." />
          ) : (
            <div className="flex flex-col gap-3">
              {fixtures.map((f) => (
                <FixtureCard
                  key={f.id}
                  fixture={f}
                  prediction={predictions[f.id]}
                  onSave={save}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <section>
          <p className="mb-3 text-xs text-lh-muted">
            Ces matchs sont déjà joués : ton prono est noté immédiatement — de quoi grimper au
            classement en rejouant les classiques.
          </p>
          <div className="flex flex-col gap-3">
            {played.map((m) => (
              <PlayedCard key={m.id} match={m} prediction={predictions[m.id]} onSave={save} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border px-3.5 py-2 text-sm font-bold transition-colors ${
        active
          ? 'border-lh-red bg-lh-red/15 text-lh-redSoft'
          : 'border-lh-line text-lh-muted hover:text-lh-text'
      }`}
    >
      {children}
    </button>
  )
}

function ScoreInputs({
  home,
  away,
  setHome,
  setAway,
  homeClub,
  awayClub,
}: {
  home: number
  away: number
  setHome: (n: number) => void
  setAway: (n: number) => void
  homeClub: string
  awayClub: string
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
        <span className="min-w-0 truncate text-sm font-bold">{homeClub}</span>
        <Crest club={homeClub} size={30} />
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <NumberPick value={home} onChange={setHome} />
        <span className="text-lh-muted">–</span>
        <NumberPick value={away} onChange={setAway} />
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Crest club={awayClub} size={30} />
        <span className="min-w-0 truncate text-sm font-bold">{awayClub}</span>
      </div>
    </div>
  )
}

function FixtureCard({
  fixture,
  prediction,
  onSave,
}: {
  fixture: UpcomingMatch
  prediction?: Prediction
  onSave: (matchId: string, h: number, a: number, scorer?: string) => void
}) {
  const [home, setHome] = useState(prediction?.homeScore ?? 1)
  const [away, setAway] = useState(prediction?.awayScore ?? 1)
  const [saved, setSaved] = useState(false)
  const msLeft = fixture.kickoff - Date.now()

  return (
    <Card className={`p-4 ${prediction ? 'border-lh-gold/35' : ''}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Pill tone="gold">J{fixture.matchweek}</Pill>
        <span className="text-xs text-lh-muted">
          {new Date(`${fixture.date}T12:00:00`).toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </span>
        <Pill className="ml-auto">⏳ {untilKickoff(msLeft)}</Pill>
      </div>

      <ScoreInputs
        home={home}
        away={away}
        setHome={setHome}
        setAway={setAway}
        homeClub={fixture.home}
        awayClub={fixture.away}
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            onSave(fixture.id, home, away)
            setSaved(true)
            setTimeout(() => setSaved(false), 1600)
          }}
          className="rounded-xl bg-lh-red px-4 py-2 text-sm font-black text-white transition-transform hover:-translate-y-0.5"
        >
          {prediction ? 'Modifier mon prono' : 'Valider mon prono'}
        </button>
        {saved && <span className="text-xs font-bold text-emerald-400">Enregistré ✓</span>}
        {prediction && !saved && (
          <span className="text-[11px] text-lh-muted">
            Ton prono : <span className="font-bold text-lh-text">
              {prediction.homeScore}–{prediction.awayScore}
            </span>{' '}
            · en attente du coup d’envoi
          </span>
        )}
        <span className="ml-auto text-[11px] text-lh-muted">
          {fixture.h2hKnown} confrontations connues
        </span>
      </div>
    </Card>
  )
}

function PlayedCard({
  match,
  prediction,
  onSave,
}: {
  match: (typeof ratableMatches)[number]
  prediction?: Prediction
  onSave: (matchId: string, h: number, a: number, scorer?: string) => void
}) {
  const [home, setHome] = useState(prediction?.homeScore ?? 1)
  const [away, setAway] = useState(prediction?.awayScore ?? 1)
  const [scorer, setScorer] = useState(prediction?.scorerId ?? '')
  const [saved, setSaved] = useState(false)

  const squad = lineupFor(match.id).filter((p) => p.role === 'titulaire')
  const pts = prediction ? scorePrediction(prediction, match) : null

  return (
    <Card className="p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Pill tone="gold">{match.competition}</Pill>
        <span className="text-xs text-lh-muted">{formatShortDate(match.date)}</span>
        {prediction && (
          <Pill tone={pts && pts > 0 ? 'green' : 'red'} className="ml-auto">
            {pts && pts > 0 ? `+${pts} pts` : '0 pt'}
          </Pill>
        )}
      </div>

      <ScoreInputs
        home={home}
        away={away}
        setHome={setHome}
        setAway={setAway}
        homeClub={match.home}
        awayClub={match.away}
      />

      {squad.length > 0 && (
        <div className="mt-3">
          <label className="lh-eyebrow mb-1.5 block">Buteur (bonus)</label>
          <select
            value={scorer}
            onChange={(e) => setScorer(e.target.value)}
            className="w-full rounded-xl border border-lh-line bg-lh-void px-3 py-2 text-sm outline-none focus:border-lh-gold/50"
          >
            <option value="">— Aucun —</option>
            {squad.map((p) => (
              <option key={p.player} value={p.player}>
                {p.player}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={() => {
            onSave(match.id, home, away, scorer || undefined)
            setSaved(true)
            setTimeout(() => setSaved(false), 1600)
          }}
          className="rounded-xl bg-lh-red px-4 py-2 text-sm font-black text-white transition-transform hover:-translate-y-0.5"
        >
          {prediction ? 'Modifier' : 'Valider'}
        </button>
        {saved && <span className="text-xs font-bold text-emerald-400">Enregistré ✓</span>}
        {prediction && (
          <span className="text-[11px] text-lh-muted">
            Réel {match.homeScore}–{match.awayScore} · {explainPrediction(prediction, match).join(' · ')}
          </span>
        )}
      </div>
    </Card>
  )
}

function NumberPick({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-col items-center">
      <button
        onClick={() => onChange(Math.min(9, value + 1))}
        className="px-2 text-xs text-lh-muted hover:text-lh-text"
        aria-label="Augmenter"
      >
        ▲
      </button>
      <span className="lh-display lh-tabnum w-10 rounded-lg bg-lh-void py-1 text-center text-xl">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="px-2 text-xs text-lh-muted hover:text-lh-text"
        aria-label="Diminuer"
      >
        ▼
      </button>
    </div>
  )
}
