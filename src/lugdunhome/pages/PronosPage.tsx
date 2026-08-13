import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, Crest, Pill, SectionTitle, Stat } from '../components/ui'
import { backend } from '../lib/backend'
import type { Prediction } from '../lib/types'
import { ratableMatches, formatShortDate, matchById } from '../lib/matches'
import { lineupFor } from '../lib/lineups'
import { POINTS, explainPrediction, levelFor, scorePrediction } from '../lib/scoring'

export default function PronosPage() {
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const list = await backend.getMyPredictions()
    setPredictions(Object.fromEntries(list.map((p) => [p.matchId, p])))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const slate = useMemo(() => ratableMatches.slice(0, 10), [])

  const stats = useMemo(() => {
    let points = 0
    let correct = 0
    let exact = 0
    const entries = Object.values(predictions)
    for (const p of entries) {
      const m = matchById(p.matchId)
      if (!m) continue
      const pts = scorePrediction(p, m)
      points += pts
      if (pts > 0) correct += 1
      if (p.homeScore === m.homeScore && p.awayScore === m.awayScore) exact += 1
    }
    return {
      points,
      correct,
      exact,
      total: entries.length,
      accuracy: entries.length ? Math.round((correct / entries.length) * 100) : 0,
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
        <Stat value={stats.total} label="Pronos posés" />
        <Stat value={stats.exact} label="Scores exacts" />
      </div>

      {/* progression */}
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

      <section>
        <SectionTitle eyebrow="À jouer" title="La grille" />
        {loading ? (
          <p className="text-sm text-lh-muted">Chargement…</p>
        ) : (
          <div className="flex flex-col gap-3">
            {slate.map((m) => (
              <PredictionCard
                key={m.id}
                match={m}
                prediction={predictions[m.id]}
                onSave={save}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function PredictionCard({
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
  const [justSaved, setJustSaved] = useState(false)

  const squad = lineupFor(match.id).filter((p) => p.role === 'titulaire')
  const pts = prediction ? scorePrediction(prediction, match) : null
  const detail = prediction ? explainPrediction(prediction, match) : []

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

      <div className="flex items-center justify-center gap-3">
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 text-right">
          <span className="min-w-0 truncate text-sm font-bold">{match.home}</span>
          <Crest club={match.home} size={30} />
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <NumberPick value={home} onChange={setHome} />
          <span className="text-lh-muted">–</span>
          <NumberPick value={away} onChange={setAway} />
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Crest club={match.away} size={30} />
          <span className="min-w-0 truncate text-sm font-bold">{match.away}</span>
        </div>
      </div>

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
            setJustSaved(true)
            setTimeout(() => setJustSaved(false), 1600)
          }}
          className="rounded-xl bg-lh-red px-4 py-2 text-sm font-black text-white transition-transform hover:-translate-y-0.5"
        >
          {prediction ? 'Modifier' : 'Valider'}
        </button>
        {justSaved && <span className="text-xs font-bold text-emerald-400">Enregistré ✓</span>}
        {prediction && (
          <span className="text-[11px] text-lh-muted">
            Résultat réel : {match.homeScore}–{match.awayScore} · {detail.join(' · ')}
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
        className="text-xs text-lh-muted hover:text-lh-text"
        aria-label="Augmenter"
      >
        ▲
      </button>
      <span className="lh-display lh-tabnum w-9 rounded-lg bg-lh-void py-1 text-center text-xl">
        {value}
      </span>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="text-xs text-lh-muted hover:text-lh-text"
        aria-label="Diminuer"
      >
        ▼
      </button>
    </div>
  )
}
