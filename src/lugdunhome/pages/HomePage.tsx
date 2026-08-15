import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ButtonLink } from '../components/Button'
import MatchHero, { MatchRow } from '../components/MatchHero'
import CountdownBanner, { useLiveWindow } from '../components/Countdown'
import { Card, Crest, Face, Pill, ResultBar, Rubric, SectionTitle, Stat } from '../components/ui'
import { useMatchCommunity } from '../hooks/useMatchCommunity'
import { isLatest, latestMatch, ratableMatches } from '../lib/matches'
import { windowFor } from '../lib/matchWindow'
import { debateFor } from '../lib/debates'
import { nextFixture, untilKickoff } from '../lib/fixtures'
import { news, relativeTime, topicStyle } from '../lib/news'
import { seedMatches } from '../../data/seed-matches'
import { result } from '../../lib/matchHelpers'

export default function HomePage() {
  const match = latestMatch
  const [windowKey] = useState(0)

  const winState = useMemo(
    () => (match ? windowFor(match.id, match.date, isLatest(match.id)) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [match, windowKey],
  )
  const live = useLiveWindow(winState ?? { open: false, simulated: false, closesAt: 0, msLeft: 0 })
  const { community } = useMatchCommunity(match?.id)

  const topRated = useMemo(() => {
    return Object.entries(community.ratings)
      .map(([player, agg]) => ({ player, avg: agg.count ? agg.sum / agg.count : 0 }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 3)
  }, [community])

  const motmLeader = useMemo(() => {
    const total = Object.values(community.motm).reduce((a, b) => a + b, 0) || 1
    const top = Object.entries(community.motm).sort((a, b) => b[1] - a[1])[0]
    return top ? { player: top[0], pct: (top[1] / total) * 100 } : null
  }, [community])

  const form = useMemo(
    () =>
      [...seedMatches]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 5)
        .reverse()
        .map((m) => result(m)),
    [],
  )

  if (!match) return null

  const debate = debateFor(match)

  return (
    <div className="flex flex-col gap-8">
      {/* Latest match + live window */}
      <section>
        <SectionTitle
          eyebrow="Le dernier match"
          title="À chaud"
          action={
            <Link to={`/matchs/${match.id}`} className="text-xs font-bold text-lh-muted hover:text-lh-text">
              Tout voir →
            </Link>
          }
        />
        <div className="flex flex-col gap-3">
          <MatchHero match={match} />
          {winState && <CountdownBanner state={winState} msLeft={live.msLeft} />}

          {/* Une seule porte d'entrée après le match : « Réaction » déroule
              score, prono, notes, vote et débat dans l'ordre où on y pense. */}
          <ButtonLink to={`/reaction/${match.id}`} variant="primary" size="lg" icon="🔥" full>
            Réagir au match
          </ButtonLink>
          <p className="-mt-1 text-center text-[11px] text-lh-muted">
            Ton prono, tes notes du onze, le vote du Kop et le débat — d’un seul défilement.
          </p>
        </div>
      </section>

      {/* Next fixture — the "before match" state */}
      <NextFixtureCard />

      {/* Ce que dit le Kop — replié : c'est du contexte, pas une action */}
      <Rubric
        icon="🗣️"
        title="Ce que dit le Kop"
        hint="Participation, meilleures notes, homme du match et débat"
        badge={<Pill tone="gold">{community.participants.toLocaleString('fr-FR')}</Pill>}
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat value={community.participants.toLocaleString('fr-FR')} label="Participants" accent />
          <Stat
            value={Object.values(community.ratings).reduce((a, b) => a + b.count, 0).toLocaleString('fr-FR')}
            label="Notes déposées"
          />
          <Stat
            value={Object.values(community.motm).reduce((a, b) => a + b, 0).toLocaleString('fr-FR')}
            label="Votes Homme du Match"
          />
          <Stat
            value={
              <span className="flex gap-1">
                {form.map((r, i) => (
                  <span
                    key={i}
                    className={`grid h-6 w-6 place-items-center rounded text-[11px] ${
                      r === 'V'
                        ? 'bg-emerald-500/80'
                        : r === 'D'
                          ? 'bg-lh-red/80'
                          : 'bg-lh-muted/60'
                    }`}
                  >
                    {r}
                  </span>
                ))}
              </span>
            }
            label="5 derniers matchs"
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="p-4">
          <div className="lh-eyebrow mb-3">⭐ Mieux notés</div>
          <div className="flex flex-col gap-3">
            {topRated.map((r, i) => (
              <div key={r.player} className="flex items-center gap-2.5">
                <span className="w-4 text-xs font-black text-lh-muted">{i + 1}</span>
                <Face name={r.player} size={32} />
                <span className="min-w-0 flex-1 truncate text-sm font-bold">{r.player}</span>
                <span className="lh-display lh-tabnum text-lg text-lh-goldSoft">
                  {r.avg.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="lh-eyebrow mb-3">🏆 Homme du match</div>
          {motmLeader ? (
            <div className="flex items-center gap-3">
              <Face name={motmLeader.player} size={52} className="ring-2 ring-lh-gold" />
              <div className="min-w-0">
                <div className="truncate font-black">{motmLeader.player}</div>
                <div className="lh-tabnum text-sm font-bold text-lh-goldSoft">
                  {motmLeader.pct.toFixed(0)} % des votes
                </div>
                <div className="mt-1.5">
                  <ResultBar pct={motmLeader.pct} color="gold" />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-lh-muted">Les votes viennent d’ouvrir.</p>
          )}
        </Card>

        <Card className="p-4">
          <div className="lh-eyebrow mb-3">🗣️ Le débat</div>
          <p className="mb-3 text-sm font-bold leading-snug">{debate.question}</p>
          <Link
            to={`/matchs/${match.id}`}
            className="inline-block rounded-lg border border-lh-line px-3 py-2 text-xs font-bold text-lh-muted transition-colors hover:border-lh-red/50 hover:text-lh-redSoft"
          >
            {live.open ? 'Donner mon avis →' : 'Voir les résultats →'}
          </Link>
        </Card>
        </div>
      </Rubric>

      <NewsTeaser />

      <Rubric icon="🗂️" title="Matchs précédents" hint="Les six derniers, notés par la communauté">
        <div className="flex flex-col gap-2">
          {ratableMatches.slice(1, 7).map((m) => (
            <MatchRow key={m.id} match={m} />
          ))}
        </div>
        <Link
          to="/matchs"
          className="mt-3 inline-block text-xs font-bold text-lh-muted hover:text-lh-text"
        >
          Tout l'historique →
        </Link>
      </Rubric>

      <Rubric icon="🧭" title="Aller plus loin" hint="Pronos, data, classements">
        <div className="grid gap-3 sm:grid-cols-3">
          <QuickLink to="/pronos" icon="🔮" title="Pronostics" hint="Marque des points sur les prochains matchs" />
          <QuickLink to="/data" icon="📊" title="Data" hint="Toute la mémoire de la communauté" />
          <QuickLink to="/classements" icon="🏆" title="Classements" hint="Qui est le meilleur Gone ?" />
        </div>
      </Rubric>
    </div>
  )
}

/** The pre-match state: next real fixture, counting down to kickoff. */
function NextFixtureCard() {
  const fixture = useMemo(() => nextFixture(), [])
  const [left, setLeft] = useState(() => (fixture ? fixture.kickoff - Date.now() : 0))

  useEffect(() => {
    if (!fixture) return
    const t = setInterval(() => setLeft(fixture.kickoff - Date.now()), 30000)
    return () => clearInterval(t)
  }, [fixture])

  if (!fixture) return null

  return (
    <section>
      <SectionTitle
        eyebrow="Avant match"
        title="Le prochain rendez-vous"
        action={
          <Link to="/pronos" className="text-xs font-bold text-lh-muted hover:text-lh-text">
            Pronostiquer →
          </Link>
        }
      />
      <Card className="relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-lh-gold/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <Pill tone="gold">J{fixture.matchweek}</Pill>
          <span className="text-xs text-lh-muted">
            {new Date(`${fixture.date}T12:00:00`).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </span>
          <Pill className="ml-auto">⏳ dans {untilKickoff(left)}</Pill>
        </div>
        <div className="relative mt-4 flex items-center justify-center gap-4">
          <div className="flex min-w-0 flex-1 items-center justify-end gap-3 text-right">
            <span className="min-w-0 truncate font-bold">{fixture.home}</span>
            <Crest club={fixture.home} size={44} />
          </div>
          <span className="lh-display shrink-0 text-2xl text-lh-muted">VS</span>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Crest club={fixture.away} size={44} />
            <span className="min-w-0 truncate font-bold">{fixture.away}</span>
          </div>
        </div>
        <div className="relative mt-4 flex justify-center">
          <Link
            to="/pronos"
            className="rounded-xl border border-lh-gold/40 bg-lh-gold/10 px-5 py-2.5 text-sm font-black uppercase tracking-wide text-lh-goldSoft transition-colors hover:bg-lh-gold/20"
          >
            Poser mon pronostic
          </Link>
        </div>
      </Card>
    </section>
  )
}

/** Les 3 dernières brèves, pour que l'actu vive dès l'accueil. */
function NewsTeaser() {
  const items = news.slice(0, 3)
  if (!items.length) return null

  return (
    <Rubric
      icon="📰"
      title="Inf'OL"
      hint="Ce qui se dit sur l'OL en ce moment"
      badge={<Pill>{news.length}</Pill>}
    >
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="lh-card group flex items-center gap-3 overflow-hidden p-0"
          >
            {item.image ? (
              <img src={item.image} alt="" loading="lazy" className="h-16 w-20 shrink-0 object-cover sm:h-20 sm:w-28" />
            ) : (
              <span className="grid h-16 w-20 shrink-0 place-items-center bg-lh-raised text-xl sm:h-20 sm:w-28">
                {topicStyle(item.topic).icon}
              </span>
            )}
            <span className="min-w-0 py-2 pr-3">
              <span className="mb-0.5 block text-[10.5px] font-bold uppercase tracking-wide text-lh-muted">
                {topicStyle(item.topic).icon} {item.topic} · {item.source}
              </span>
              <span className="line-clamp-2 block text-sm font-bold leading-snug group-hover:text-lh-redSoft">
                {item.title}
              </span>
              <span className="mt-0.5 block text-[11px] text-lh-muted">
                {relativeTime(item.publishedAt)}
              </span>
            </span>
          </a>
        ))}
      </div>
      <Link to="/infol" className="mt-3 inline-block text-xs font-bold text-lh-muted hover:text-lh-text">
        Tout le fil →
      </Link>
    </Rubric>
  )
}

function QuickLink({ to, icon, title, hint }: { to: string; icon: string; title: string; hint: string }) {
  return (
    <Link
      to={to}
      className="lh-card flex items-center gap-3 p-4 transition-colors hover:border-lh-gold/40"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-lh-void text-xl">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block font-black">{title}</span>
        <span className="block truncate text-xs text-lh-muted">{hint}</span>
      </span>
      <Pill className="ml-auto shrink-0">→</Pill>
    </Link>
  )
}
