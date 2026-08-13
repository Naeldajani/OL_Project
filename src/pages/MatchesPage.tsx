import { useMemo, useState } from 'react'
import Card, { PageHeader } from '../components/Card'
import ClubCrest from '../components/ClubCrest'
import MatchModal, { ResultBadge } from '../components/MatchModal'
import { seedMatches } from '../data/seed-matches'
import { formatDate, olScore, opponent, oppScore, result, yearsAgo } from '../lib/matchHelpers'
import type { Match } from '../lib/types'

export default function MatchesPage() {
  const matches = seedMatches
  const [query, setQuery] = useState('')
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null)
  const [activeMatch, setActiveMatch] = useState<Match | null>(null)

  const stats = useMemo(() => {
    let w = 0,
      n = 0,
      d = 0,
      gf = 0,
      ga = 0
    for (const m of matches) {
      const r = result(m)
      if (r === 'V') w++
      else if (r === 'N') n++
      else d++
      gf += olScore(m)
      ga += oppScore(m)
    }
    const played = matches.length
    const winRate = played ? Math.round((w / played) * 100) : 0
    return { w, n, d, gf, ga, played, winRate }
  }, [matches])

  const rivalCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const m of matches) {
      const opp = opponent(m)
      counts.set(opp, (counts.get(opp) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [matches])

  const filteredRivals = useMemo(() => {
    if (!query.trim()) return rivalCounts.slice(0, 8)
    const q = query.toLowerCase()
    return rivalCounts.filter(([club]) => club.toLowerCase().includes(q))
  }, [rivalCounts, query])

  const onThisDay = useMemo(() => {
    const today = new Date()
    return matches
      .filter((m) => {
        const d = new Date(m.date + 'T12:00:00')
        return d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [matches])

  const recent = useMemo(
    () => [...matches].sort((a, b) => (a.date < b.date ? 1 : -1)),
    [matches],
  )

  const h2h = useMemo(() => {
    if (!selectedOpponent) return null
    const list = matches
      .filter((m) => opponent(m) === selectedOpponent)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
    let w = 0,
      n = 0,
      d = 0,
      gf = 0,
      ga = 0
    for (const m of list) {
      const r = result(m)
      if (r === 'V') w++
      else if (r === 'N') n++
      else d++
      gf += olScore(m)
      ga += oppScore(m)
    }
    return { list, w, n, d, gf, ga }
  }, [matches, selectedOpponent])

  return (
    <div>
      <PageHeader
        icon="🌍"
        eyebrow="Jeux"
        title="Matchs & résultats"
        description="Explore 25 ans de matchs OL sans tableau à l'ancienne : cherche un adversaire, pioche parmi les grands rivaux, ou regarde ce qui s'est passé ce jour-là."
      />

      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-2xl font-extrabold text-ol-red">
            {stats.w}-{stats.n}-{stats.d}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">
            Victoires-Nuls-Défaites
          </div>
        </Card>
        <Card>
          <div className="text-2xl font-extrabold text-white">
            {stats.gf}-{stats.ga}
          </div>
          <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">
            Buts marqués-encaissés
          </div>
        </Card>
        <Card>
          <div className="text-2xl font-extrabold text-white">{stats.winRate}%</div>
          <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">
            Taux de victoire
          </div>
        </Card>
        <Card>
          <div className="text-2xl font-extrabold text-white">{stats.played}</div>
          <div className="text-xs text-slate-400 uppercase tracking-wide mt-1">
            Matchs (2000-2026)
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-300 uppercase tracking-wide mb-4">
          📅 Ce jour-là
        </h3>
        {onThisDay.length === 0 ? (
          <p className="text-sm text-slate-500">Aucun match OL ce jour-là dans les données chargées.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {onThisDay.map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMatch(m)}
                className="flex items-center justify-between bg-ink-900/60 hover:bg-ink-900 rounded-xl px-4 py-3 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ol-gold font-semibold">
                    il y a {yearsAgo(m.date)} ans
                  </span>
                  <span className="font-semibold text-white">
                    {m.home} vs {m.away}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-white">
                    {m.homeScore}-{m.awayScore}
                  </span>
                  <ResultBadge r={result(m)} />
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card className="mb-6">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-300 uppercase tracking-wide mb-4">
          🔍 Chercher un adversaire
        </h3>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher un club (ex: Fenerbahçe, PSG, Real Madrid...)"
          className="w-full bg-ink-900/70 ring-1 ring-white/10 focus:ring-ol-gold rounded-xl px-4 py-3 text-sm outline-none placeholder:text-slate-500 mb-4"
        />
        <div className="flex flex-wrap gap-3">
          {filteredRivals.map(([club, count]) => (
            <button
              key={club}
              onClick={() => setSelectedOpponent(club)}
              className={`flex items-center gap-2 pl-2 pr-4 py-2 rounded-full ring-1 transition-colors ${
                selectedOpponent === club
                  ? 'bg-ink-700 ring-ol-gold'
                  : 'bg-ink-900/60 ring-white/10 hover:ring-white/30'
              }`}
            >
              <ClubCrest club={club} size={26} />
              <span className="text-sm font-medium text-white">{club}</span>
              <span className="text-sm text-slate-400">({count})</span>
            </button>
          ))}
          {filteredRivals.length === 0 && (
            <p className="text-sm text-slate-500">Aucun club ne correspond à "{query}".</p>
          )}
        </div>

        {h2h && selectedOpponent && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
              Dernier duel : il y a {yearsAgo(h2h.list[0].date)} an(s) —{' '}
              {formatDate(h2h.list[0].date)}
            </div>
            <div className="text-sm text-slate-300 mb-4">
              <span className="font-bold text-white">{h2h.list.length}</span> confrontations{' '}
              <span className="font-bold text-emerald-400">{h2h.w}</span>V{' '}
              <span className="font-bold text-slate-300">{h2h.n}</span>N{' '}
              <span className="font-bold text-ol-red">{h2h.d}</span>D{' '}
              <span className="font-bold text-white">
                {h2h.gf}-{h2h.ga}
              </span>{' '}
              buts
            </div>
            <MatchList matches={h2h.list} onSelect={setActiveMatch} />
          </div>
        )}
      </Card>

      <Card>
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-300 uppercase tracking-wide mb-4">
          🕐 Matchs récents
        </h3>
        <MatchList matches={recent} onSelect={setActiveMatch} />
      </Card>

      {activeMatch && <MatchModal match={activeMatch} onClose={() => setActiveMatch(null)} />}
    </div>
  )
}

function MatchList({
  matches,
  onSelect,
}: {
  matches: Match[]
  onSelect: (m: Match) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {matches.map((m) => {
        const r = result(m)
        const borderColor =
          r === 'V' ? 'border-emerald-500' : r === 'N' ? 'border-slate-500' : 'border-ol-red'
        return (
          <button
            key={m.id}
            onClick={() => onSelect(m)}
            className={`flex items-center justify-between bg-ink-900/50 hover:bg-ink-900 rounded-lg pl-4 pr-4 py-3 border-l-4 ${borderColor} text-left transition-colors`}
          >
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400 font-mono w-24 shrink-0">
                {formatDate(m.date)}
              </span>
              <span className="text-xs text-slate-500 w-24 shrink-0">{m.competition}</span>
              <span className="font-semibold text-white">
                {m.home} vs {m.away}
              </span>
            </div>
            <span className="font-bold text-white">
              {m.homeScore}-{m.awayScore}
            </span>
          </button>
        )
      })}
    </div>
  )
}
