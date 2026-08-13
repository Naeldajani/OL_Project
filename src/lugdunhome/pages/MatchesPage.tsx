import { useMemo, useState } from 'react'
import { MatchRow } from '../components/MatchHero'
import { EmptyState, Pill, SectionTitle } from '../components/ui'
import { allMatches, ratableMatches } from '../lib/matches'
import { result } from '../../lib/matchHelpers'

type Filter = 'notables' | 'tous'

export default function MatchesPage() {
  const [filter, setFilter] = useState<Filter>('notables')
  const [competition, setCompetition] = useState<string>('Toutes')
  const [season, setSeason] = useState<string>('Toutes')
  const [query, setQuery] = useState('')

  const source = filter === 'notables' ? ratableMatches : allMatches

  const competitions = useMemo(
    () => ['Toutes', ...Array.from(new Set(source.map((m) => m.competition))).sort()],
    [source],
  )
  const seasons = useMemo(
    () => ['Toutes', ...Array.from(new Set(source.map((m) => m.season))).sort().reverse()],
    [source],
  )

  const list = useMemo(() => {
    const q = query
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
    return source.filter((m) => {
      if (competition !== 'Toutes' && m.competition !== competition) return false
      if (season !== 'Toutes' && m.season !== season) return false
      if (!q) return true
      const hay = `${m.home} ${m.away}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
      return hay.includes(q)
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
    return { v, n, d }
  }, [list])

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle eyebrow="Archives" title="Tous les matchs" />

      <div className="flex flex-col gap-3">
        <div className="flex gap-1.5">
          {(['notables', 'tous'] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => {
                setFilter(f)
                setCompetition('Toutes')
                setSeason('Toutes')
              }}
              className={`rounded-xl border px-3.5 py-2 text-sm font-bold transition-colors ${
                filter === f
                  ? 'border-lh-red bg-lh-red/15 text-lh-redSoft'
                  : 'border-lh-line text-lh-muted hover:text-lh-text'
              }`}
            >
              {f === 'notables' ? 'Notables par la communauté' : 'Tout l’historique'}
            </button>
          ))}
        </div>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="🔍 Chercher un adversaire (PSG, Marseille, Bayern...)"
          className="w-full rounded-xl border border-lh-line bg-lh-surface px-4 py-2.5 text-sm outline-none placeholder:text-lh-muted focus:border-lh-gold/50"
        />

        <div className="flex flex-wrap gap-2">
          <Select value={competition} onChange={setCompetition} options={competitions} />
          <Select value={season} onChange={setSeason} options={seasons} />
          <Pill tone="green" className="ml-auto self-center">
            {record.v}V
          </Pill>
          <Pill className="self-center">{record.n}N</Pill>
          <Pill tone="red" className="self-center">
            {record.d}D
          </Pill>
        </div>
      </div>

      {filter === 'notables' && (
        <p className="text-xs text-lh-muted">
          Les matchs « notables » sont ceux dont on possède la composition, donc ceux où la
          communauté peut noter chaque joueur ({ratableMatches.length} matchs).
        </p>
      )}

      {list.length === 0 ? (
        <EmptyState icon="🔍" title="Aucun match" hint="Change de filtre pour élargir la recherche." />
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
    </div>
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-lh-line bg-lh-surface px-3 py-2 text-sm font-semibold text-lh-text outline-none focus:border-lh-gold/50"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}
