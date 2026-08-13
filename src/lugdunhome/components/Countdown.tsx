import { useEffect, useState } from 'react'
import { formatCountdown, type WindowState } from '../lib/matchWindow'

/** Live 24h countdown. Ticks every second so the last minutes feel urgent. */
export function useLiveWindow(state: WindowState) {
  const [msLeft, setMsLeft] = useState(state.msLeft)

  useEffect(() => {
    setMsLeft(Math.max(0, state.closesAt - Date.now()))
    if (state.closesAt <= Date.now()) return
    const t = setInterval(() => {
      setMsLeft(Math.max(0, state.closesAt - Date.now()))
    }, 1000)
    return () => clearInterval(t)
  }, [state.closesAt])

  return { msLeft, open: msLeft > 0 && state.open }
}

export default function CountdownBanner({
  state,
  msLeft,
  onReset,
}: {
  state: WindowState
  msLeft: number
  onReset?: () => void
}) {
  const open = msLeft > 0 && state.open
  const pct = open ? (msLeft / (24 * 60 * 60 * 1000)) * 100 : 0

  if (!open) {
    return (
      <div className="lh-card-raised flex flex-wrap items-center gap-3 px-4 py-3.5">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-lh-void text-lg">🔒</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Votes clôturés</p>
          <p className="text-xs text-lh-muted">
            La fenêtre de 24h est terminée — voici les résultats définitifs de la communauté.
          </p>
        </div>
        {state.simulated && onReset && (
          <button
            onClick={onReset}
            className="rounded-lg border border-lh-line px-3 py-1.5 text-xs font-bold text-lh-muted transition-colors hover:border-lh-gold/50 hover:text-lh-goldSoft"
          >
            ↻ Rejouer la fenêtre
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="lh-card-raised relative overflow-hidden px-4 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="animate-lh-live grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-lh-red text-lg">
          ⏱️
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">
            Il vous reste{' '}
            <span className="lh-tabnum text-lh-redSoft">{formatCountdown(msLeft)}</span> pour donner
            votre avis
          </p>
          <p className="text-xs text-lh-muted">
            Notes, Homme du Match et débat sont ouverts pendant 24h après le coup de sifflet final.
          </p>
        </div>
        {state.simulated && (
          <span
            className="rounded-full border border-lh-gold/40 bg-lh-gold/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-lh-goldSoft"
            title="Tous les matchs de la base sont passés : la fenêtre de ce match est simulée pour que l'expérience reste jouable."
          >
            Fenêtre simulée
          </span>
        )}
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-lh-void">
        <div
          className="h-full rounded-full bg-gradient-to-r from-lh-red to-lh-gold transition-[width] duration-1000 ease-linear"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
