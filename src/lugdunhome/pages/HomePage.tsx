import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import MatchHero, { MatchRow } from '../components/MatchHero'
import CountdownBanner, { useLiveWindow } from '../components/Countdown'
import { Card, Face, Pill, ResultBar, SectionTitle, Stat } from '../components/ui'
import { useMatchCommunity } from '../hooks/useMatchCommunity'
import { isLatest, latestMatch, ratableMatches } from '../lib/matches'
import { windowFor } from '../lib/matchWindow'
import { debateFor } from '../lib/debates'
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
      {/* Brand hero */}
      <section className="relative overflow-hidden rounded-3xl border border-lh-line bg-gradient-to-br from-lh-surface via-lh-night to-lh-void px-5 py-8 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-lh-red/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-lh-gold/10 blur-3xl" />
        <div className="relative">
          <div className="lh-eyebrow mb-2 text-lh-goldSoft">Lyon · depuis Lugdunum</div>
          <h1 className="lh-display text-4xl sm:text-6xl">
            LA MAISON DES
            <br />
            <span className="text-lh-red">SUPPORTERS</span> DE L’OL
          </h1>
          <p className="mt-4 max-w-xl text-sm text-lh-muted sm:text-base">
            Après chaque match, vous avez 24 heures pour noter les joueurs, élire l’Homme du Match
            et trancher le débat. Ici, c’est la communauté qui a le dernier mot.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              to={`/matchs/${match.id}`}
              className="rounded-xl bg-lh-red px-5 py-3 text-sm font-black uppercase tracking-wide text-white shadow-lg shadow-lh-red/25 transition-transform hover:-translate-y-0.5"
            >
              {live.open ? 'Donner mon avis' : 'Voir le dernier match'}
            </Link>
            <Link
              to="/pronos"
              className="rounded-xl border border-lh-line px-5 py-3 text-sm font-black uppercase tracking-wide text-lh-text transition-colors hover:border-lh-gold/50 hover:text-lh-goldSoft"
            >
              Pronostiquer
            </Link>
          </div>
        </div>
      </section>

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
        </div>
      </section>

      {/* Community pulse */}
      <section>
        <SectionTitle eyebrow="En ce moment" title="La communauté" />
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
      </section>

      {/* Top rated + MOTM + debate teaser */}
      <section className="grid gap-4 lg:grid-cols-3">
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
      </section>

      {/* Recent matches */}
      <section>
        <SectionTitle
          eyebrow="Historique"
          title="Matchs précédents"
          action={
            <Link to="/matchs" className="text-xs font-bold text-lh-muted hover:text-lh-text">
              Tout voir →
            </Link>
          }
        />
        <div className="flex flex-col gap-2">
          {ratableMatches.slice(1, 7).map((m) => (
            <MatchRow key={m.id} match={m} />
          ))}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <QuickLink to="/pronos" icon="🔮" title="Pronostics" hint="Marque des points sur les prochains matchs" />
        <QuickLink to="/data" icon="📊" title="Data" hint="Toute la mémoire de la communauté" />
        <QuickLink to="/classements" icon="🏆" title="Classements" hint="Qui est le meilleur Gone ?" />
      </section>
    </div>
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
