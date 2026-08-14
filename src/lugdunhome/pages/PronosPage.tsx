import { useCallback, useEffect, useMemo, useState } from 'react'
import Button, { Segmented } from '../components/Button'
import { Card, Crest, EmptyState, Face, Pill, SectionTitle, Stat } from '../components/ui'
import { OL_NAMES } from '../../lib/matchHelpers'
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

      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { value: 'avenir', label: `À venir (${fixtures.length})` },
          { value: 'passes', label: 'Matchs joués' },
        ]}
      />

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

/** Scores fréquents, pour prédire en un geste plutôt qu'en huit appuis. */
const QUICK_SCORES: [number, number][] = [
  [1, 0],
  [2, 0],
  [2, 1],
  [3, 1],
  [1, 1],
  [0, 0],
  [0, 1],
  [1, 2],
]

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
  const olHome = OL_NAMES.has(homeClub)
  const diff = home - away
  const olWins = olHome ? diff > 0 : diff < 0
  const draw = diff === 0

  return (
    <div className="rounded-2xl bg-lh-void/60 p-3.5">
      <div className="flex items-center gap-2">
        <TeamSide club={homeClub} align="end" />
        <div className="flex shrink-0 items-center gap-1.5">
          <NumberPick value={home} onChange={setHome} label={`Buts ${homeClub}`} />
          <span className="lh-display pb-1 text-xl text-lh-muted">:</span>
          <NumberPick value={away} onChange={setAway} label={`Buts ${awayClub}`} />
        </div>
        <TeamSide club={awayClub} align="start" />
      </div>

      <div className="mt-3 flex items-center justify-center">
        <Pill tone={draw ? 'neutral' : olWins ? 'green' : 'red'}>
          {draw ? '🤝 Match nul' : olWins ? '🦁 Victoire de l’OL' : '💀 Défaite de l’OL'}
        </Pill>
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {QUICK_SCORES.map(([h, a]) => {
          const active = home === h && away === a
          return (
            <button
              key={`${h}-${a}`}
              onClick={() => {
                setHome(h)
                setAway(a)
              }}
              className={`lh-tabnum shrink-0 rounded-lg border px-2.5 py-1 text-xs font-black transition-colors ${
                active
                  ? 'border-lh-gold bg-lh-gold/15 text-lh-goldSoft'
                  : 'border-lh-line bg-lh-raised text-lh-muted hover:text-lh-text'
              }`}
            >
              {h}–{a}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TeamSide({ club, align }: { club: string; align: 'start' | 'end' }) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col justify-center gap-1.5 ${
        align === 'end' ? 'items-end text-right' : 'items-start text-left'
      }`}
    >
      <Crest club={club} size={34} />
      <span className="line-clamp-2 text-[11.5px] font-bold leading-tight">{club}</span>
    </div>
  )
}

/** Sélection visuelle du buteur : une grille de visages remplace la liste
 *  déroulante, qui affichait 11 lignes de texte identiques et masquait
 *  l'écran sur mobile. */
function ScorerPicker({
  squad,
  value,
  onChange,
}: {
  squad: { player: string; posteFr?: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="lh-eyebrow">Buteur bonus</span>
        {value && (
          <button
            onClick={() => onChange('')}
            className="text-[11px] font-bold text-lh-muted hover:text-lh-text"
          >
            Effacer
          </button>
        )}
      </div>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
        {squad.map((p) => {
          const active = value === p.player
          return (
            <button
              key={p.player}
              onClick={() => onChange(active ? '' : p.player)}
              title={p.player}
              className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-2 transition-colors ${
                active
                  ? 'border-lh-gold bg-lh-gold/12'
                  : 'border-lh-line bg-lh-raised hover:border-white/25'
              }`}
            >
              <Face name={p.player} size={34} />
              <span className="w-full truncate text-center text-[10px] font-bold leading-tight">
                {shortName(p.player)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

/** « Alexandre Lacazette » ne tient pas sous une vignette de 34 px. */
function shortName(full: string): string {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0][0]}. ${parts[parts.length - 1]}`
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
        <Button
          onClick={() => {
            onSave(fixture.id, home, away)
            setSaved(true)
            setTimeout(() => setSaved(false), 1600)
          }}
        >
          {prediction ? 'Modifier mon prono' : 'Valider mon prono'}
        </Button>
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
          <ScorerPicker squad={squad} value={scorer} onChange={setScorer} />
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          onClick={() => {
            onSave(match.id, home, away, scorer || undefined)
            setSaved(true)
            setTimeout(() => setSaved(false), 1600)
          }}
        >
          {prediction ? 'Modifier mon prono' : 'Valider mon prono'}
        </Button>
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

function NumberPick({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (n: number) => void
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Step onClick={() => onChange(Math.min(9, value + 1))} label={`${label} : plus un`}>
        +
      </Step>
      <span className="lh-display lh-tabnum grid h-12 w-12 place-items-center rounded-xl border border-lh-line bg-lh-surface text-2xl">
        {value}
      </span>
      <Step onClick={() => onChange(Math.max(0, value - 1))} label={`${label} : moins un`}>
        −
      </Step>
    </div>
  )
}

/** Cible de 32 px : en dessous, le pouce rate le bouton une fois sur trois. */
function Step({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="grid h-8 w-12 place-items-center rounded-lg border border-lh-line bg-lh-raised text-sm font-black text-lh-muted transition-colors hover:border-lh-gold/45 hover:text-lh-text active:translate-y-px"
    >
      {children}
    </button>
  )
}
