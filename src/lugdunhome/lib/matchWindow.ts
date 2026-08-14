/**
 * The 24h participation window.
 *
 * Real rule: the window opens at the final whistle (kickoff + 2h) and closes
 * 24h later. Every match in our dataset is historical, so that rule alone
 * would leave the live experience permanently closed and unreachable.
 *
 * So the newest match also runs in "demo" mode: its window starts the first
 * time this browser opens it, giving a genuine 24h countdown and a genuine
 * lock when it expires. The UI always says when a window is simulated.
 */
const DEMO_KEY = 'lh:demo-window'
export const WINDOW_MS = 24 * 60 * 60 * 1000

export interface WindowState {
  open: boolean
  simulated: boolean
  closesAt: number
  msLeft: number
}

function realClose(matchDate: string): number {
  return new Date(`${matchDate}T20:00:00`).getTime() + 2 * 60 * 60 * 1000 + WINDOW_MS
}

export function windowFor(matchId: string, matchDate: string, isLatest: boolean): WindowState {
  const now = Date.now()
  const realCloseAt = realClose(matchDate)

  if (now < realCloseAt) {
    return { open: true, simulated: false, closesAt: realCloseAt, msLeft: realCloseAt - now }
  }

  if (!isLatest) {
    return { open: false, simulated: false, closesAt: realCloseAt, msLeft: 0 }
  }

  // newest match: start a simulated window on first visit
  let store: Record<string, number> = {}
  try {
    store = JSON.parse(localStorage.getItem(DEMO_KEY) || '{}')
  } catch {
    store = {}
  }
  if (!store[matchId]) {
    store[matchId] = now
    try {
      localStorage.setItem(DEMO_KEY, JSON.stringify(store))
    } catch {
      /* private mode — window just restarts next load */
    }
  }
  const closesAt = store[matchId] + WINDOW_MS
  return {
    open: now < closesAt,
    simulated: true,
    closesAt,
    msLeft: Math.max(0, closesAt - now),
  }
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00h00'
  const totalMinutes = Math.floor(ms / 60000)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  const s = Math.floor((ms % 60000) / 1000)
  if (h > 0) return `${h}h${String(m).padStart(2, '0')}`
  return `${m}m${String(s).padStart(2, '0')}`
}

/** Restart the simulated window (used by the "rejouer la fenêtre" control). */
export function resetDemoWindow(matchId: string) {
  try {
    const store = JSON.parse(localStorage.getItem(DEMO_KEY) || '{}')
    delete store[matchId]
    localStorage.setItem(DEMO_KEY, JSON.stringify(store))
  } catch {
    /* ignore */
  }
}
