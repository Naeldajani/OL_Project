import type { LineupEntry } from '../lib/lineups'
import { formationLabel, placeOnPitch } from '../lib/formation'
import { Face } from './ui'

export interface PitchPlayer {
  entry: LineupEntry
  avg: number
  mine?: number
}

/**
 * Terrain vu du dessus : le onze à sa place, comme sur une feuille de match.
 *
 * La note portée sur la pastille est celle qu'on a soi-même donnée quand elle
 * existe, sinon la moyenne de la communauté — c'est ce qu'on cherche à voir
 * d'un coup d'œil : « où en suis-je », pas « où en sont les autres ».
 */
export default function Pitch({
  players,
  coach,
  selected,
  onSelect,
}: {
  players: PitchPlayer[]
  coach?: string
  selected: string | null
  onSelect: (player: string) => void
}) {
  const spots = placeOnPitch(players.map((p) => p.entry))
  const byName = new Map(players.map((p) => [p.entry.player, p]))

  return (
    <div className="overflow-hidden rounded-2xl border border-lh-line">
      <div className="flex items-center justify-between border-b border-lh-line bg-lh-raised px-3 py-2">
        <span className="lh-eyebrow">Composition</span>
        <span className="lh-display text-sm text-lh-goldSoft">
          {formationLabel(players.map((p) => p.entry))}
        </span>
      </div>

      <div
        className="relative w-full"
        style={{
          aspectRatio: '3 / 4',
          background:
            'linear-gradient(180deg, #1c5b34 0%, #174d2c 50%, #1c5b34 100%)',
        }}
      >
        <PitchLines />

        {spots.map(({ entry, x, y }) => {
          const data = byName.get(entry.player)
          if (!data) return null
          const active = selected === entry.player
          const shown = data.mine ?? data.avg

          return (
            <button
              key={entry.player}
              onClick={() => onSelect(entry.player)}
              style={{ left: `${x}%`, top: `${y}%` }}
              className="absolute flex w-[19%] -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
              title={`${entry.player} — ${entry.position}`}
            >
              <span className="relative">
                <Face
                  name={entry.player}
                  size={40}
                  className={
                    active
                      ? 'ring-[3px] ring-lh-gold'
                      : data.mine
                        ? 'ring-2 ring-emerald-400'
                        : 'ring-2 ring-white/70'
                  }
                />
                {shown > 0 && (
                  <span
                    className={`lh-tabnum absolute -bottom-1 -right-1 rounded-md px-1 text-[10px] font-black text-white shadow ${
                      data.mine ? 'bg-emerald-500' : 'bg-lh-void/90'
                    }`}
                  >
                    {shown.toFixed(1)}
                  </span>
                )}
              </span>
              <span className="w-full truncate rounded bg-black/45 px-1 text-center text-[9.5px] font-bold leading-tight text-white">
                {shortName(entry.player)}
              </span>
            </button>
          )
        })}
      </div>

      {coach && (
        <div className="flex items-center gap-2.5 border-t border-lh-line bg-lh-raised px-3 py-2.5">
          <Face name={coach} size={32} />
          <div className="min-w-0">
            <div className="lh-eyebrow">Entraîneur</div>
            <div className="truncate text-sm font-bold">{coach}</div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Tracé du terrain — dessiné plutôt qu'importé : une image de fond
 *  s'étirerait mal selon le nombre de joueurs par ligne. */
function PitchLines() {
  const stroke = 'rgba(255,255,255,0.28)'
  return (
    <svg
      viewBox="0 0 300 400"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {/* bandes de tonte */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect
          key={i}
          x="0"
          y={i * 50}
          width="300"
          height="50"
          fill={i % 2 ? 'rgba(255,255,255,0.028)' : 'transparent'}
        />
      ))}
      <g fill="none" stroke={stroke} strokeWidth="2">
        <rect x="8" y="8" width="284" height="384" />
        <line x1="8" y1="200" x2="292" y2="200" />
        <circle cx="150" cy="200" r="46" />
        {/* surface et point de réparation, en bas côté OL */}
        <rect x="70" y="310" width="160" height="82" />
        <rect x="112" y="366" width="76" height="26" />
        <rect x="70" y="8" width="160" height="82" />
        <rect x="112" y="8" width="76" height="26" />
      </g>
      <circle cx="150" cy="200" r="3" fill={stroke} />
      <circle cx="150" cy="338" r="3" fill={stroke} />
      <circle cx="150" cy="62" r="3" fill={stroke} />
    </svg>
  )
}

function shortName(full: string): string {
  const parts = full.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]
  return `${parts[0][0]}. ${parts[parts.length - 1]}`
}
