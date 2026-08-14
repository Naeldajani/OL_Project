import { useEffect, useState } from 'react'
import Card, { PageHeader } from '../components/Card'
import { fixtures202627 } from '../data/fixtures-2026-27'

const STORAGE_KEY = 'gones-analytics-pronostics'
const OL_NAMES = new Set(['Lyon', 'Olympique Lyonnais'])

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

type Prono = { home: string; away: string; validated: boolean }

export default function PredictionsPage() {
  const [pronos, setPronos] = useState<Record<number, Prono>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pronos))
  }, [pronos])

  function setScore(mw: number, side: 'home' | 'away', value: string) {
    setPronos((prev) => ({
      ...prev,
      [mw]: {
        home: side === 'home' ? value : prev[mw]?.home ?? '0',
        away: side === 'away' ? value : prev[mw]?.away ?? '0',
        validated: false,
      },
    }))
  }

  function validate(mw: number) {
    setPronos((prev) => ({
      ...prev,
      [mw]: { ...(prev[mw] ?? { home: '0', away: '0' }), validated: true },
    }))
  }

  return (
    <div>
      <PageHeader
        icon="🧑‍🎤"
        eyebrow="Jeux"
        title="Pronostics 2026-27"
        description="Le calendrier officiel de la saison 2026-27. Fais tes pronostics journée par journée et suis tes prédictions au fil de la saison."
      />

      <div className="grid grid-cols-2 gap-6">
        {fixtures202627.map((f) => {
          const olHome = OL_NAMES.has(f.home)
          const opponent = olHome ? f.away : f.home
          const prono = pronos[f.matchweek] ?? { home: '0', away: '0', validated: false }
          return (
            <Card key={f.matchweek}>
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-400 mb-2">
                <span>Matchweek {f.matchweek}</span>
                <span>{formatDate(f.date)}</span>
              </div>
              <h3 className="text-lg font-extrabold text-white">
                {olHome ? `OL vs ${opponent}` : `${opponent} vs OL`}
              </h3>
              <div className="text-sm text-blue-300/80 mb-2">
                {olHome ? 'Domicile' : 'Extérieur'}
              </div>
              <div className="text-xs text-slate-500 mb-4">
                {f.h2hKnown} confrontation(s) connue(s)
              </div>
              <div className="border-t border-white/10 pt-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>🎯</span>
                  <span>Ton pronostic</span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="number"
                  min={0}
                  value={prono.home}
                  onChange={(e) => setScore(f.matchweek, 'home', e.target.value)}
                  className="w-16 bg-ink-900/70 ring-1 ring-white/10 focus:ring-ol-gold rounded-lg px-3 py-2 text-center text-sm outline-none"
                />
                <span className="text-slate-500">-</span>
                <input
                  type="number"
                  min={0}
                  value={prono.away}
                  onChange={(e) => setScore(f.matchweek, 'away', e.target.value)}
                  className="w-16 bg-ink-900/70 ring-1 ring-white/10 focus:ring-ol-gold rounded-lg px-3 py-2 text-center text-sm outline-none"
                />
                <button
                  onClick={() => validate(f.matchweek)}
                  className={`ml-auto px-4 py-2 rounded-lg text-sm font-semibold ring-1 transition-colors ${
                    prono.validated
                      ? 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/40'
                      : 'bg-blue-600/15 text-blue-300 ring-blue-500/40 hover:bg-blue-600/25'
                  }`}
                >
                  {prono.validated ? '✓ Validé' : 'Valider'}
                </button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
