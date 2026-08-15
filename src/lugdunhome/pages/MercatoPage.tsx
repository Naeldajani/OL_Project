import { useMemo, useState } from 'react'
import { Segmented } from '../components/Button'
import { Card, Crest, EmptyState, Face, Pill, SectionTitle, Stat } from '../components/ui'
import {
  balanceFor,
  dealsFor,
  flagOf,
  formatFee,
  kindStyle,
  mercatoSeasons,
  positionIcon,
  type Deal,
} from '../lib/mercato'

type Side = 'arrivee' | 'depart'

export default function MercatoPage() {
  const [season, setSeason] = useState(mercatoSeasons[0] ?? '')
  const [side, setSide] = useState<Side>('arrivee')

  const list = useMemo(() => dealsFor(season), [season])
  const balance = useMemo(() => balanceFor(season), [season])

  const shown = useMemo(
    () =>
      list
        .filter((d) => d.direction === side)
        // les gros transferts d'abord, puis les prêts, puis les libres
        .sort((a, b) => (b.fee ?? -1) - (a.fee ?? -1)),
    [list, side],
  )

  const arrivals = list.filter((d) => d.direction === 'arrivee').length
  const departures = list.length - arrivals

  return (
    <div className="flex flex-col gap-5">
      <SectionTitle eyebrow="🔁 Mercat'OL" title="Les mouvements" />

      <Segmented
        value={season}
        onChange={setSeason}
        className="-mx-1 px-1"
        options={mercatoSeasons.map((s) => ({ value: s, label: s }))}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={arrivals} label="Arrivées" accent />
        <Stat value={departures} label="Départs" />
        <Stat value={formatFee(balance.spent || null)} label="Dépensé" />
        <Stat value={formatFee(balance.earned || null)} label="Encaissé" />
      </div>

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="lh-eyebrow">Balance des transferts</span>
          <span
            className={`lh-display lh-tabnum text-xl ${
              balance.net >= 0 ? 'text-emerald-400' : 'text-lh-red'
            }`}
          >
            {balance.net >= 0 ? '+' : '−'}
            {formatFee(Math.abs(balance.net) || null)}
          </span>
        </div>
        <BalanceBar spent={balance.spent} earned={balance.earned} />
        {balance.unknown > 0 && (
          <p className="mt-2 text-[11px] text-lh-muted">
            {balance.unknown} transfert{balance.unknown > 1 ? 's' : ''} dont le montant n'a pas été
            communiqué — ils ne sont pas comptés dans la balance.
          </p>
        )}
      </Card>

      <Segmented
        value={side}
        onChange={setSide}
        options={[
          { value: 'arrivee', label: `➕ Arrivées (${arrivals})` },
          { value: 'depart', label: `➖ Départs (${departures})` },
        ]}
      />

      {shown.length === 0 ? (
        <EmptyState
          icon="🔁"
          title="Aucun mouvement"
          hint="Wikipédia n'a pas encore de tableau pour cette saison."
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {shown.map((deal) => (
            <DealCard key={`${deal.name}-${deal.window}-${deal.club}`} deal={deal} />
          ))}
        </div>
      )}

      <p className="text-[11px] leading-relaxed text-lh-muted">
        Mouvements compilés depuis les tableaux de transferts de Wikipédia. Les montants sont ceux
        annoncés par la presse, hors bonus, et manquent parfois : un club n'est jamais tenu de les
        publier.
      </p>
    </div>
  )
}

function DealCard({ deal }: { deal: Deal }) {
  const style = kindStyle(deal.kind)
  const incoming = deal.direction === 'arrivee'

  return (
    <Card className="flex items-center gap-3 p-3">
      <Face name={deal.name} size={46} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-sm font-black">{deal.name}</span>
          <span className="shrink-0 text-xs">{flagOf(deal.nationality)}</span>
        </div>

        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-lh-muted">
          {deal.position && (
            <span>
              {positionIcon(deal.position)} {deal.position}
            </span>
          )}
          {deal.age != null && <span>· {deal.age} ans</span>}
          <span className="w-full sm:w-auto">
            {/* la flèche dit dans quel sens lire le club : provenance ou destination */}
            {incoming ? '←' : '→'} {deal.club || 'club inconnu'}
          </span>
        </div>

        <div className="mt-1.5 flex items-center gap-1.5">
          <Pill tone={style.tone} className="!px-2 !py-0.5 !text-[10px]">
            {style.label}
          </Pill>
          {deal.window === 'hiver' && (
            <Pill className="!px-2 !py-0.5 !text-[10px]">❄️ Hiver</Pill>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-1">
        {deal.club && <Crest club={deal.club} size={28} />}
        <span
          className={`lh-display lh-tabnum text-sm ${
            deal.fee == null ? 'text-lh-muted' : incoming ? 'text-lh-red' : 'text-emerald-400'
          }`}
        >
          {formatFee(deal.fee)}
        </span>
      </div>
    </Card>
  )
}

function BalanceBar({ spent, earned }: { spent: number; earned: number }) {
  const total = Math.max(1, spent + earned)
  return (
    <div className="flex h-2.5 overflow-hidden rounded-full bg-lh-void">
      <span
        className="bg-lh-red"
        style={{ width: `${(spent / total) * 100}%` }}
        title={`Dépensé ${formatFee(spent)}`}
      />
      <span
        className="bg-emerald-500"
        style={{ width: `${(earned / total) * 100}%` }}
        title={`Encaissé ${formatFee(earned)}`}
      />
    </div>
  )
}
