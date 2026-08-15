import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import MatchHero from '../components/MatchHero'
import CountdownBanner, { useLiveWindow } from '../components/Countdown'
import RatePlayers from '../components/RatePlayers'
import Motm from '../components/Motm'
import DebatePanel from '../components/DebatePanel'
import { Card, Crest, EmptyState, Pill } from '../components/ui'
import { useMatchCommunity } from '../hooks/useMatchCommunity'
import { backend } from '../lib/backend'
import { isLatest, latestMatch, matchById } from '../lib/matches'
import { windowFor } from '../lib/matchWindow'
import { bonusFor, labelOf, pointsFor, bonusCorrect } from '../lib/bonuses'
import { explainPrediction, scorePrediction } from '../lib/scoring'
import type { Prediction } from '../lib/types'
import { result } from '../../lib/matchHelpers'

/**
 * Réaction à chaud — le parcours d'après-match en une seule descente :
 * le score, puis ce que valait notre pronostic, puis les notes du onze, puis
 * le vote collectif, puis le débat.
 *
 * C'est le même contenu que la page du match, mais rangé dans l'ordre où on
 * y pense après le coup de sifflet, au lieu de quatre onglets entre lesquels
 * il faut choisir.
 */
export default function ReactionPage() {
  const { id } = useParams()
  const match = id ? matchById(id) : latestMatch
  const [prediction, setPrediction] = useState<Prediction | null>(null)

  const winState = useMemo(
    () => (match ? windowFor(match.id, match.date, isLatest(match.id)) : null),
    [match],
  )
  const live = useLiveWindow(winState ?? { open: false, simulated: false, closesAt: 0, msLeft: 0 })
  const { community, myRatings, myMotm, myDebate, ratePlayer, voteMotm, voteDebate } =
    useMatchCommunity(match?.id)

  useEffect(() => {
    if (!match) return
    let cancelled = false
    backend.getMyPrediction(match.id).then((p) => {
      if (!cancelled) setPrediction(p)
    })
    return () => {
      cancelled = true
    }
  }, [match])

  if (!match) {
    return <EmptyState icon="🔍" title="Match introuvable" hint="Ce match n’est pas dans la base." />
  }

  const open = live.open
  // une défaite ne se conclut pas par un homme du match : on cherche un coupable
  const lost = result(match) === 'D'

  return (
    <div className="flex flex-col gap-10">
      <div>
        <Link to="/" className="text-xs font-bold text-lh-muted hover:text-lh-text">
          ← Accueil
        </Link>
      </div>

      {/* 1 — le score */}
      <section className="flex flex-col gap-3">
        <div className="lh-eyebrow">Étape 1 · Le résultat</div>
        <MatchHero match={match} />
        {winState && <CountdownBanner state={winState} msLeft={live.msLeft} />}
      </section>

      {/* 2 — mon prono */}
      <section>
        <div className="lh-eyebrow mb-1">Étape 2 · Ton pronostic</div>
        <h2 className="lh-display mb-3 text-2xl">Ce que tu avais dit</h2>
        <PredictionRecap match={match} prediction={prediction} />
      </section>

      {/* 3 — les notes */}
      <section>
        <div className="lh-eyebrow mb-1">Étape 3 · Le onze</div>
        <RatePlayers
          match={match}
          community={community}
          myRatings={myRatings}
          open={open}
          onRate={ratePlayer}
        />
      </section>

      {/* 4 — élu ou coupable */}
      <section>
        <div className="lh-eyebrow mb-1">Étape 4 · Le vote</div>
        <Motm
          match={match}
          community={community}
          myVote={myMotm}
          open={open}
          onVote={voteMotm}
          mode={lost ? 'blame' : 'motm'}
        />
      </section>

      {/* 5 — le débat */}
      <section>
        <div className="lh-eyebrow mb-1">Étape 5 · Le débat</div>
        <DebatePanel
          match={match}
          community={community}
          myVote={myDebate}
          open={open}
          onVote={voteDebate}
        />
      </section>

      <div className="lh-rule" />

      <div className="flex flex-wrap gap-3">
        <Link
          to={`/matchs/${match.id}`}
          className="text-xs font-bold text-lh-muted hover:text-lh-text"
        >
          Voir la feuille de match →
        </Link>
        <Link to="/pronos" className="text-xs font-bold text-lh-muted hover:text-lh-text">
          Pronostiquer le prochain →
        </Link>
      </div>
    </div>
  )
}

function PredictionRecap({
  match,
  prediction,
}: {
  match: NonNullable<ReturnType<typeof matchById>>
  prediction: Prediction | null
}) {
  const bonus = useMemo(() => bonusFor(match.id), [match.id])

  if (!prediction) {
    return (
      <Card className="flex flex-col gap-2 p-4">
        <p className="text-sm text-lh-muted">
          Tu n’avais pas pronostiqué ce match. Les points se jouent avant le coup d’envoi.
        </p>
        <Link
          to="/pronos"
          className="text-xs font-black text-lh-redSoft underline underline-offset-2"
        >
          Pronostiquer les prochains matchs →
        </Link>
      </Card>
    )
  }

  const points = scorePrediction(prediction, match)
  const exact = prediction.homeScore === match.homeScore && prediction.awayScore === match.awayScore
  const choice = prediction.bonusChoice ?? prediction.scorerId ?? ''
  const bonusWon = choice ? bonusCorrect(bonus, choice, match) : false

  return (
    <Card raised className="overflow-hidden">
      <div className="flex items-stretch">
        <div className="flex flex-1 flex-col items-center gap-2 border-r border-lh-line p-4">
          <span className="lh-eyebrow">Ton prono</span>
          <div className="flex items-center gap-2">
            <Crest club={match.home} size={26} />
            <span className="lh-display lh-tabnum text-2xl">
              {prediction.homeScore}–{prediction.awayScore}
            </span>
            <Crest club={match.away} size={26} />
          </div>
          {exact ? (
            <Pill tone="green">🎯 Score exact</Pill>
          ) : (
            <Pill>
              Réel {match.homeScore}–{match.awayScore}
            </Pill>
          )}
        </div>

        <div className="flex w-32 shrink-0 flex-col items-center justify-center gap-1 p-4">
          <span className="lh-eyebrow">Récolté</span>
          <span
            className={`lh-display lh-tabnum text-4xl ${
              points > 0 ? 'text-lh-goldSoft' : 'text-lh-muted'
            }`}
          >
            {points > 0 ? `+${points}` : '0'}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-lh-muted">
            point{points > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="border-t border-lh-line px-4 py-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {explainPrediction(prediction, match).map((line) => (
            <Pill key={line} tone={line === 'Aucun point' ? 'neutral' : 'gold'}>
              {line}
            </Pill>
          ))}
        </div>
        {choice && (
          <p className="text-[11px] leading-relaxed text-lh-muted">
            <span className="font-bold text-lh-text">{bonus.question}</span> tu avais répondu «{' '}
            {labelOf(bonus, choice)} »{' '}
            {bonusWon ? (
              <span className="font-bold text-emerald-400">
                — gagné, +{pointsFor(bonus, choice)}
              </span>
            ) : (
              <span className="font-bold text-lh-red">— raté</span>
            )}
          </p>
        )}
      </div>
    </Card>
  )
}
