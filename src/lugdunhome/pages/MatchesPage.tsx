import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { MatchRow } from '../components/MatchHero'
import Button from '../components/Button'
import { Card, Crest, EmptyState, Pill, SectionTitle, Stat } from '../components/ui'
import { allMatches, ratableMatches, formatShortDate } from '../lib/matches'
import { olScore, oppScore, opponent, result, yearsAgo } from '../../lib/matchHelpers'

type Scope = 'notables' | 'tous'

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

export default function MatchesPage() {
  const [scope, setScope] = useState<Scope>('notables')
  const [competition, setCompetition] = useState('Toutes')
  const [season, setSeason] = useState('Toutes')
  const [query, setQuery] = useState('')
  const [rival, setRival] = useState<string | null>(null)

  const source = scope === 'notables' ? ratableMatches : allMatches

  const competitions = useMemo(
    () => ['Toutes', ...Array.from(new Set(source.map((m) => m.competition))).sort()],
    [source],
  )
  const seasons = useMemo(
    () => ['Toutes', ...Array.from(new Set(source.map((m) => m.season))).sort().reverse()],
    [source],
  )

  /* « Ce jour-là » se lit sur tout l'historique, pas sur le filtre courant :
     un anniversaire de match ne dépend pas de la compétition sélectionnée. */
  const onThisDay = useMemo(() => {
    const today = new Date()
    return allMatches
      .filter((m) => {
        const d = new Date(`${m.date}T12:00:00`)
        return d.getMonth() === today.getMonth() && d.getDate() === today.getDate()
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1))
  }, [])

  const rivals = useMemo(() => {
    const counts = new Map<string, number>()
    for (const m of allMatches) {
      const o = opponent(m)
      counts.set(o, (counts.get(o) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])
  }, [])

  const visibleRivals = useMemo(() => {
    const q = norm(query.trim())
    if (!q) return rivals.slice(0, 10)
    return rivals.filter(([club]) => norm(club).includes(q)).slice(0, 24)
  }, [rivals, query])

  const h2h = useMemo(() => {
    if (!rival) return null
    const list = allMatches
      .filter((m) => opponent(m) === rival)
      .sort((a, b) => (a.date < b.date ? 1 : -1))
    let v = 0
    let n = 0
    let d = 0
    let gf = 0
    let ga = 0
    for (const m of list) {
      const r = result(m)
      if (r === 'V') v++
      else if (r === 'N') n++
      else d++
      gf += olScore(m)
      ga += oppScore(m)
    }
    return { list, v, n, d, gf, ga }
  }, [rival])

  const list = useMemo(() => {
    const q = norm(query.trim())
    return source.filter((m) => {
      if (competition !== 'Toutes' && m.competition !== competition) return false
      if (season !== 'Toutes' && m.season !== season) return false
      if (!q) return true
      return norm(`${m.home} ${m.away}`).includes(q)
    })
  }, [source, competition, season, query])

  const record = useMemo(() => {
    let v = 0
    let n = 0
    let d = 0
    for (const m of list) {
      const r = result(m)
      if (r === 'V') v++
      else if (r === 'N') n++
      else d++
    }
    const total = v + n + d
    return { v, n, d, winRate: total ? Math.round((v / total) * 100) : 0 }
  }, [list])

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle eyebrow="Archives" title="Tous les matchs" />

      {/* ---- ce jour-là ---- */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg">📅</span>
          <h2 className="lh-display text-lg">Ce jour-là</h2>
          <Pill className="ml-auto">{onThisDay.length}</Pill>
        </div>
        {onThisDay.length === 0 ? (
          <Card className="px-4 py-5 text-sm text-lh-muted">
            Aucun match de l'OL un {new Date().getDate()}{' '}
            {new Date().toLocaleDateString('fr-FR', { month: 'long' })} depuis 2000.
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {onThisDay.map((m) => (
              <Link
                key={m.id}
                to={`/matchs/${m.id}`}
                className="lh-card flex items-center gap-3 px-3.5 py-3 transition-colors hover:border-lh-gold/40"
              >
                <span className="lh-display shrink-0 rounded-lg bg-lh-gold/15 px-2 py-1 text-[11px] text-lh-goldSoft">
                  il y a {yearsAgo(m.date)} ans
                </span>
                <Crest club={m.home} size={26} />
                <span className="lh-tabnum shrink-0 font-black">
                  {m.homeScore}–{m.awayScore}
                </span>
                <Crest club={m.away} size={26} />
                <span className="min-w-0 truncate text-xs text-lh-muted">
                  {m.home} – {m.away}
                </span>
                <ResultDot r={result(m)} />
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="lh-rule" />

      {/* ---- adversaire ---- */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <h2 className="lh-display text-lg">Chercher un adversaire</h2>
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="PSG, Marseille, Bayern, Fenerbahçe…"
          className="mb-3 w-full rounded-xl border border-lh-line bg-lh-surface px-4 py-3 text-sm outline-none placeholder:text-lh-muted/70 focus:border-lh-gold/50"
        />

        <div className="flex flex-wrap gap-2">
          {visibleRivals.map(([club, count]) => (
            <button
              key={club}
              onClick={() => setRival(rival === club ? null : club)}
              className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 transition-colors ${
                rival === club
                  ? 'border-lh-gold bg-lh-gold/12'
                  : 'border-lh-line bg-lh-raised hover:border-white/25'
              }`}
            >
              <Crest club={club} size={24} />
              <span className="text-[13px] font-bold">{club}</span>
              <span className="text-[11px] text-lh-muted">{count}</span>
            </button>
          ))}
          {visibleRivals.length === 0 && (
            <p className="text-sm text-lh-muted">Aucun club ne correspond à « {query} ».</p>
          )}
        </div>

        {h2h && rival && (
          <Card raised className="mt-4 p-4">
            <div className="mb-3 flex items-center gap-3">
              <Crest club={rival} size={40} />
              <div className="min-w-0">
                <div className="lh-display truncate text-lg">OL – {rival}</div>
                <div className="text-[11px] text-lh-muted">
                  Dernier duel {formatShortDate(h2h.list[0].date)}
                  {/* « il y a 0 an » pour un match de la saison en cours */}
                  {yearsAgo(h2h.list[0].date) > 0 &&
                    ` · il y a ${yearsAgo(h2h.list[0].date)} an${
                      yearsAgo(h2h.list[0].date) > 1 ? 's' : ''
                    }`}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto"
                onClick={() => setRival(null)}
              >
                Fermer
              </Button>
            </div>

            <div className="mb-3 grid grid-cols-3 gap-2">
              <Stat value={`${h2h.v}V`} label="Victoires" accent />
              <Stat value={`${h2h.n}N`} label="Nuls" />
              <Stat value={`${h2h.d}D`} label="Défaites" />
            </div>

            <BalanceBar v={h2h.v} n={h2h.n} d={h2h.d} />

            <p className="mb-3 mt-2.5 text-xs text-lh-muted">
              <span className="font-bold text-lh-text">{h2h.list.length}</span> confrontations ·{' '}
              <span className="font-bold text-lh-text">
                {h2h.gf}-{h2h.ga}
              </span>{' '}
              au cumul des buts
            </p>

            <div className="flex flex-col gap-2">
              {h2h.list.slice(0, 8).map((m) => (
                <MatchRow key={m.id} match={m} />
              ))}
            </div>
            {h2h.list.length > 8 && (
              <p className="pt-3 text-center text-[11px] text-lh-muted">
                + {h2h.list.length - 8} autres confrontations
              </p>
            )}
          </Card>
        )}
      </section>

      <div className="lh-rule" />

      {/* ---- archives filtrées ---- */}
      <section>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-lg">🗂️</span>
          <h2 className="lh-display text-lg">Parcourir l'historique</h2>
        </div>

        <div className="mb-3 flex flex-col gap-3">
          <div className="flex gap-2">
            {(['notables', 'tous'] as Scope[]).map((s) => (
              <Button
                key={s}
                variant={scope === s ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => {
                  setScope(s)
                  setCompetition('Toutes')
                  setSeason('Toutes')
                }}
              >
                {s === 'notables' ? 'Matchs notables' : 'Tout l’historique'}
              </Button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Chips value={competition} onChange={setCompetition} options={competitions} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Chips value={season} onChange={setSeason} options={seasons} max={12} />
          </div>
        </div>

        <div className="mb-3 grid grid-cols-4 gap-2">
          <Stat value={list.length} label="Matchs" />
          <Stat value={`${record.v}V`} label="Victoires" accent />
          <Stat value={`${record.n}N`} label="Nuls" />
          <Stat value={`${record.winRate} %`} label="Réussite" />
        </div>

        {scope === 'notables' && (
          <p className="mb-3 text-xs text-lh-muted">
            Les matchs « notables » sont ceux dont on possède la composition, donc ceux où la
            communauté peut noter chaque joueur ({ratableMatches.length} matchs).
          </p>
        )}

        {list.length === 0 ? (
          <EmptyState
            icon="🔍"
            title="Aucun match"
            hint="Élargis les filtres ou vide la recherche."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {list.slice(0, 120).map((m) => (
              <MatchRow key={m.id} match={m} />
            ))}
            {list.length > 120 && (
              <p className="py-3 text-center text-xs text-lh-muted">
                {list.length - 120} matchs supplémentaires — affine les filtres pour les voir.
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}

/** Barre victoires / nuls / défaites, proportionnelle. */
function BalanceBar({ v, n, d }: { v: number; n: number; d: number }) {
  const total = Math.max(1, v + n + d)
  return (
    <div className="flex h-2.5 overflow-hidden rounded-full bg-lh-void">
      <span className="bg-emerald-500" style={{ width: `${(v / total) * 100}%` }} />
      <span className="bg-lh-muted/60" style={{ width: `${(n / total) * 100}%` }} />
      <span className="bg-lh-red" style={{ width: `${(d / total) * 100}%` }} />
    </div>
  )
}

function ResultDot({ r }: { r: 'V' | 'N' | 'D' }) {
  const tone = { V: 'bg-emerald-500', N: 'bg-lh-muted', D: 'bg-lh-red' }[r]
  return (
    <span
      className={`ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black text-white ${tone}`}
    >
      {r}
    </span>
  )
}

/** Remplace les listes déroulantes : sur mobile, un menu natif masque tout
 *  l'écran pour choisir une valeur qu'on veut pouvoir comparer d'un coup d'œil. */
function Chips({
  value,
  onChange,
  options,
  max = 8,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  max?: number
}) {
  const [expanded, setExpanded] = useState(false)
  const shown = expanded ? options : options.slice(0, max)

  return (
    <>
      {shown.map((o) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
            value === o
              ? 'border-lh-red bg-lh-red/15 text-lh-redSoft'
              : 'border-lh-line bg-lh-raised text-lh-muted hover:text-lh-text'
          }`}
        >
          {o}
        </button>
      ))}
      {options.length > max && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="rounded-full border border-dashed border-lh-line px-3 py-1.5 text-xs font-bold text-lh-muted hover:text-lh-text"
        >
          {expanded ? '− Réduire' : `+ ${options.length - max}`}
        </button>
      )}
    </>
  )
}
