import { useMemo, useState } from 'react'
import Card, { PageHeader } from '../components/Card'
import ClubCrest from '../components/ClubCrest'
import { seedPlayers } from '../data/seed-players'
import type { Player } from '../lib/types'

type Difficulty = 'facile' | 'moyen' | 'difficile' | 'aleatoire'

const DIFFICULTIES: { key: Difficulty; label: string }[] = [
  { key: 'facile', label: '★ Facile' },
  { key: 'moyen', label: '★★ Moyen' },
  { key: 'difficile', label: '★★★ Difficile' },
  { key: 'aleatoire', label: '🎲 Aléatoire' },
]

const STARS: Record<Difficulty, string> = {
  facile: '★☆☆ Facile',
  moyen: '★★☆ Moyen',
  difficile: '★★★ Difficile',
  aleatoire: '🎲 Aléatoire',
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
}

function pickPlayer(pool: Player[], difficulty: Difficulty): Player {
  let candidates = pool
  if (difficulty === 'facile') candidates = pool.filter((p) => p.career.length <= 2)
  else if (difficulty === 'moyen')
    candidates = pool.filter((p) => p.career.length === 3 || p.career.length === 4)
  else if (difficulty === 'difficile') candidates = pool.filter((p) => p.career.length >= 4)
  if (candidates.length === 0) candidates = pool
  return candidates[Math.floor(Math.random() * candidates.length)]
}

function initialReveal(player: Player, difficulty: Difficulty): number {
  if (difficulty === 'aleatoire') return player.career.length
  if (difficulty === 'facile') return Math.min(2, player.career.length)
  if (difficulty === 'moyen') return Math.min(2, player.career.length)
  return 1
}

export default function GuessThePlayerPage() {
  const pool = seedPlayers
  const [difficulty, setDifficulty] = useState<Difficulty>('facile')
  const [mystery, setMystery] = useState<Player>(() => pickPlayer(pool, 'facile'))
  const [revealed, setRevealed] = useState(() => initialReveal(mystery, 'facile'))
  const [guess, setGuess] = useState('')
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing')
  const [message, setMessage] = useState<string | null>(null)
  const [attempts, setAttempts] = useState<string[]>([])

  const suggestions = useMemo(() => {
    if (!guess.trim()) return []
    const q = normalize(guess)
    return pool
      .filter((p) => normalize(p.name).includes(q))
      .slice(0, 6)
      .map((p) => p.name)
  }, [guess, pool])

  function newGone(nextDifficulty: Difficulty = difficulty) {
    const p = pickPlayer(pool, nextDifficulty)
    setMystery(p)
    setRevealed(initialReveal(p, nextDifficulty))
    setGuess('')
    setStatus('playing')
    setMessage(null)
    setAttempts([])
  }

  function selectDifficulty(d: Difficulty) {
    setDifficulty(d)
    newGone(d)
  }

  function submitGuess() {
    if (!guess.trim() || status !== 'playing') return
    const correct = normalize(guess) === normalize(mystery.name)
    if (correct) {
      setStatus('won')
      setMessage(`🎉 Bien joué ! C'était bien ${mystery.name}. Nouveau Gone dans un instant...`)
      setTimeout(() => newGone(), 1800)
    } else {
      setAttempts((a) => [...a, guess.trim()])
      if (revealed < mystery.career.length) {
        setRevealed((r) => r + 1)
        setMessage(`❌ Raté. Un indice de plus est révélé.`)
      } else {
        setStatus('lost')
        setMessage(`😔 Perdu. C'était ${mystery.name}.`)
      }
    }
    setGuess('')
  }

  function abandon() {
    setStatus('lost')
    setMessage(`C'était ${mystery.name}.`)
  }

  return (
    <div>
      <PageHeader
        icon="🎮"
        eyebrow="Jeux"
        title="Devine le Gone"
        description="Un Gone mystère a joué à l'OL entre 2000 et 2026. Regarde son parcours (sans son nom !) et devine qui c'est. Après chaque essai, des indices t'aident à te rapprocher."
      />

      <Card>
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Difficulté :</span>
            {DIFFICULTIES.map((d) => (
              <button
                key={d.key}
                onClick={() => selectDifficulty(d.key)}
                className={`text-sm font-semibold px-4 py-2 rounded-full ring-1 transition-colors ${
                  difficulty === d.key
                    ? 'bg-blue-600/30 ring-blue-400 text-white'
                    : 'bg-ink-900/50 ring-white/10 text-slate-300 hover:ring-white/30'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
          <button className="text-sm font-semibold px-4 py-2 rounded-full bg-ol-gold/10 text-ol-gold ring-1 ring-ol-gold/40">
            🏁 Quiz 10 manches
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          {mystery.career.slice(0, revealed).map((step, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 bg-ink-900/50 rounded-xl px-6 py-4 ring-1 ring-white/5"
            >
              <ClubCrest club={step.club} size={48} />
              <span className="font-semibold text-white text-sm">{step.club}</span>
              <span className="text-xs text-slate-400">{step.years}</span>
            </div>
          ))}
        </div>

        <div className="relative flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitGuess()}
              disabled={status !== 'playing'}
              placeholder="Nom d'un joueur de l'OL..."
              className="w-full bg-ink-900/70 ring-1 ring-white/10 focus:ring-ol-gold rounded-xl px-4 py-3 text-sm outline-none placeholder:text-slate-500 disabled:opacity-50"
            />
            {suggestions.length > 0 && status === 'playing' && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-ink-800 ring-1 ring-white/10 rounded-xl overflow-hidden z-10">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setGuess(s)}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-ink-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={submitGuess}
            disabled={status !== 'playing'}
            className="px-5 py-3 rounded-xl bg-blue-600/20 text-blue-300 ring-1 ring-blue-500/40 font-semibold text-sm hover:bg-blue-600/30 disabled:opacity-50"
          >
            Deviner
          </button>
          <button
            onClick={abandon}
            disabled={status !== 'playing'}
            className="px-5 py-3 rounded-xl bg-ol-red/10 text-ol-red ring-1 ring-ol-red/40 font-semibold text-sm hover:bg-ol-red/20 disabled:opacity-50"
          >
            Abandonner
          </button>
          <button
            onClick={() => newGone()}
            className="px-5 py-3 rounded-xl bg-white/5 text-white ring-1 ring-white/10 font-semibold text-sm hover:bg-white/10"
          >
            Nouveau Gone
          </button>
        </div>

        {attempts.length > 0 && status === 'playing' && (
          <div className="mt-3 text-xs text-slate-500">
            Essais : {attempts.join(', ')}
          </div>
        )}

        {message && (
          <div
            className={`mt-4 text-sm font-medium ${
              status === 'won' ? 'text-emerald-400' : status === 'lost' ? 'text-slate-300' : 'text-slate-300'
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-4 text-xs text-slate-500">{STARS[difficulty]}</div>
      </Card>
    </div>
  )
}
