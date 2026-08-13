import { useMemo, useState } from 'react'
import Card, { PageHeader } from '../components/Card'
import PersonPhoto from '../components/PersonPhoto'
import { FORMATIONS, eligiblePlayers, randomShortlist } from '../lib/roles'
import { coaches } from '../data/coaches'
import { seedPlayers } from '../data/seed-players'

const byId = new Map(seedPlayers.map((p) => [p.id, p]))
const STAGGER_MS = 120

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** A centered, foreground overlay — used for both the coach and the
 * player-position pickers so they never render "under" the pitch. */
function PickerOverlay({
  title,
  onClose,
  onReroll,
  children,
}: {
  title: string
  onClose: () => void
  onReroll?: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-start justify-center pt-20 z-50 px-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-ink-800 rounded-2xl ring-1 ring-white/10 max-w-2xl w-full p-6 animate-panel-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide">{title}</h3>
          <div className="flex items-center gap-3">
            {onReroll && (
              <button onClick={onReroll} className="text-xs font-semibold text-ol-gold hover:text-white">
                🎲 Relancer
              </button>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">
              Fermer ✕
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function BestXIPage() {
  const [started, setStarted] = useState(false)
  const [formationId, setFormationId] = useState<string | null>(null)
  const formation = FORMATIONS.find((f) => f.id === formationId) ?? null

  const [selection, setSelection] = useState<Record<string, string>>({})
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [rollKey, setRollKey] = useState<Record<string, number>>({})
  const [coachId, setCoachId] = useState<string>(coaches[0]?.id ?? '')
  const [coachOpen, setCoachOpen] = useState(false)
  const [coachRollKey, setCoachRollKey] = useState(0)
  const [bounce, setBounce] = useState<Record<string, number>>({})

  const activeRole = formation?.roles.find((r) => r.id === activeRoleId) ?? null

  const candidates = useMemo(() => {
    if (!activeRole) return []
    const takenElsewhere = new Set(
      Object.entries(selection)
        .filter(([roleId]) => roleId !== activeRole.id)
        .map(([, playerId]) => playerId),
    )
    if (search.trim()) {
      const q = normalize(search)
      return eligiblePlayers(activeRole)
        .filter((p) => !takenElsewhere.has(p.id) && normalize(p.name).includes(q))
        .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
    }
    return randomShortlist(activeRole, 3, takenElsewhere)
    // re-roll only when the slot is (re)opened or "Relancer" is clicked
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRole, selection, search, rollKey[activeRoleId ?? '']])

  const coachCandidates = useMemo(() => {
    const taken = new Set([coachId])
    return shuffle(coaches.filter((c) => !taken.has(c.id))).slice(0, 3)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachRollKey])

  function openSlot(roleId: string) {
    setSearch('')
    setRollKey((k) => ({ ...k, [roleId]: (k[roleId] ?? 0) + 1 }))
    setActiveRoleId(roleId)
  }

  function pick(roleId: string, playerId: string) {
    setSelection((s) => ({ ...s, [roleId]: playerId }))
    setBounce((b) => ({ ...b, [roleId]: (b[roleId] ?? 0) + 1 }))
    setActiveRoleId(null)
  }

  function openCoachPicker() {
    setCoachRollKey((k) => k + 1)
    setCoachOpen(true)
  }

  function pickCoach(id: string) {
    setCoachId(id)
    setCoachOpen(false)
  }

  const selectedCoach = coaches.find((c) => c.id === coachId)

  if (!started) {
    return (
      <div>
        <PageHeader
          icon="🌟"
          eyebrow="Stats"
          title="Meilleur XI"
          description="Compose le onze de légende de l'OL — à toi de choisir chaque poste, rien n'est imposé."
        />
        <Card className="flex flex-col items-center justify-center py-16 gap-6">
          <span className="text-5xl">⚽</span>
          <button
            onClick={() => setStarted(true)}
            className="px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-lg tracking-wide transition-colors shadow-lg shadow-emerald-500/20"
          >
            Commencer
          </button>
        </Card>
      </div>
    )
  }

  if (!formation) {
    return (
      <div>
        <PageHeader
          icon="🌟"
          eyebrow="Stats"
          title="Meilleur XI"
          description="Choisis d'abord une composition — le onze est vide tant que tu n'as rien sélectionné."
        />
        <Card>
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-4">
            Choisis ta compo
          </h3>
          <div className="grid grid-cols-4 gap-4">
            {FORMATIONS.map((f, i) => (
              <button
                key={f.id}
                onClick={() => setFormationId(f.id)}
                style={{ animationDelay: `${i * STAGGER_MS}ms` }}
                className="animate-slide-in-x flex flex-col items-center gap-2 rounded-xl p-6 bg-ink-900/50 ring-1 ring-white/10 hover:ring-ol-gold transition-all hover:-translate-y-0.5"
              >
                <span className="text-2xl">⚽</span>
                <span className="text-lg font-black text-white">{f.label}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        icon="🌟"
        eyebrow="Stats"
        title="Meilleur XI"
        description={`Formation ${formation.label} — clique un poste, 3 joueurs OL au hasard te sont proposés pour le remplir.`}
        right={
          <button
            onClick={() => {
              setFormationId(null)
              setSelection({})
              setActiveRoleId(null)
            }}
            className="text-xs font-semibold px-3 py-2 rounded-lg bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 ring-1 ring-white/10"
          >
            Changer de formation
          </button>
        }
      />

      <Card className="mb-6">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-4">
          🧑‍🏫 Entraîneur
        </h3>
        <button
          onClick={openCoachPicker}
          className="flex items-center gap-4 rounded-xl p-2 -m-2 hover:bg-white/5 transition-colors text-left"
        >
          <PersonPhoto key={coachId} name={selectedCoach?.name ?? '?'} size={56} className="animate-pop-in" />
          <div>
            <div className="text-sm font-bold text-white">{selectedCoach?.name ?? 'Choisir un entraîneur'}</div>
            {selectedCoach && (
              <p className="text-xs text-slate-500 mt-1">
                Sur le banc : {selectedCoach.seasons[0]}
                {selectedCoach.seasons.length > 1
                  ? `–${selectedCoach.seasons[selectedCoach.seasons.length - 1]}`
                  : ''}
              </p>
            )}
          </div>
        </button>
      </Card>

      <Card className="mb-6">
        <div className="relative w-full max-w-2xl mx-auto aspect-[2/2.6] rounded-2xl overflow-hidden bg-gradient-to-b from-emerald-900/40 to-emerald-950/40 ring-1 ring-white/10">
          <PitchLines />
          {formation.roles.map((role) => {
            const player = byId.get(selection[role.id])
            const isActive = activeRoleId === role.id
            return (
              <button
                key={role.id}
                onClick={() => (isActive ? setActiveRoleId(null) : openSlot(role.id))}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group"
                style={{ left: `${role.x}%`, top: `${role.y}%` }}
              >
                <span
                  key={bounce[role.id] ?? 0}
                  className={`rounded-full ${bounce[role.id] ? 'animate-slot-bounce' : ''} ${
                    isActive ? 'ring-4 ring-ol-gold' : 'ring-2 ring-transparent group-hover:ring-white/40'
                  } transition-shadow`}
                >
                  {player ? (
                    <PersonPhoto name={player.name} size={52} />
                  ) : (
                    <div className="w-[52px] h-[52px] rounded-full bg-ink-900/80 ring-2 ring-dashed ring-white/25 flex items-center justify-center text-white/40 text-lg">
                      +
                    </div>
                  )}
                </span>
                <div className="bg-ink-900/80 rounded-md px-2 py-0.5 text-center max-w-[110px]">
                  <div className="text-[11px] font-bold text-white leading-tight truncate">
                    {player ? player.name : role.label}
                  </div>
                  <div className="text-[9px] text-slate-400 leading-tight">{role.label}</div>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      {coachOpen && (
        <PickerOverlay title="Choisir un entraîneur" onClose={() => setCoachOpen(false)} onReroll={openCoachPicker}>
          <div className="grid grid-cols-3 gap-4">
            {coachCandidates.map((c, i) => (
              <button
                key={c.id}
                onClick={() => pickCoach(c.id)}
                style={{ animationDelay: `${i * STAGGER_MS}ms` }}
                className="animate-slide-in-x flex flex-col items-center gap-2 rounded-xl p-4 ring-1 bg-ink-900/50 ring-white/10 hover:ring-ol-gold transition-all hover:-translate-y-0.5"
              >
                <PersonPhoto name={c.name} size={72} />
                <div className="text-sm font-bold text-white text-center leading-tight">{c.name}</div>
                <div className="text-[11px] text-slate-500 text-center leading-tight">
                  {c.seasons[0]}
                  {c.seasons.length > 1 ? `–${c.seasons[c.seasons.length - 1]}` : ''}
                </div>
              </button>
            ))}
          </div>
        </PickerOverlay>
      )}

      {activeRole && (
        <PickerOverlay
          title={`Choisir un joueur — ${activeRole.label}`}
          onClose={() => setActiveRoleId(null)}
          onReroll={() => openSlot(activeRole.id)}
        >
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Rechercher un joueur..."
            className="w-full bg-ink-900/70 ring-1 ring-ol-gold rounded-xl px-4 py-3 text-sm outline-none placeholder:text-slate-500 mb-4"
          />
          {candidates.length === 0 ? (
            <p className="text-sm text-slate-500">
              {search.trim() ? 'Aucun joueur ne correspond.' : "Pas assez de joueurs documentés à ce poste précis pour l'instant."}
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-x-4 gap-y-5 max-h-[420px] overflow-y-auto pr-1">
              {candidates.map((p, i) => {
                const selected = selection[activeRole.id] === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => pick(activeRole.id, p.id)}
                    style={{ animationDelay: `${Math.min(i, 12) * STAGGER_MS}ms` }}
                    className={`animate-slide-in-x flex flex-col items-center gap-2 rounded-xl p-3 ring-1 transition-all hover:-translate-y-0.5 ${
                      selected
                        ? 'bg-ol-gold/10 ring-ol-gold'
                        : 'bg-ink-900/50 ring-white/10 hover:ring-white/30'
                    }`}
                  >
                    <PersonPhoto name={p.name} size={64} />
                    <div className="text-xs font-semibold text-white text-center leading-tight">
                      {p.name}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </PickerOverlay>
      )}
    </div>
  )
}

function PitchLines() {
  return (
    <svg viewBox="0 0 100 130" className="absolute inset-0 w-full h-full opacity-30" preserveAspectRatio="none">
      <rect x="2" y="2" width="96" height="126" fill="none" stroke="white" strokeWidth="0.5" />
      <line x1="2" y1="65" x2="98" y2="65" stroke="white" strokeWidth="0.5" />
      <circle cx="50" cy="65" r="10" fill="none" stroke="white" strokeWidth="0.5" />
      <rect x="25" y="2" width="50" height="18" fill="none" stroke="white" strokeWidth="0.5" />
      <rect x="25" y="110" width="50" height="18" fill="none" stroke="white" strokeWidth="0.5" />
    </svg>
  )
}
