import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Button, { ButtonLink } from '../components/Button'
import { Card, Crest, EmptyState, Pill, SectionTitle, Stat } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { backend, isShared } from '../lib/backend'
import type { LeaderboardRow, LhUser, Prediction } from '../lib/types'
import { badgesFor, explainPrediction, levelFor, scorePrediction } from '../lib/scoring'
import { formatShortDate, matchById } from '../lib/matches'

const AVATARS = ['🦁', '⚽', '🔴', '🔵', '🏟️', '🥇', '🎯', '🔥', '💪', '👑', '🧤', '⭐', '📣', '🇫🇷', '🎽']

export default function ProfilPage() {
  const { session, signOut } = useAuth()
  const [user, setUser] = useState<LhUser | null>(null)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [board, setBoard] = useState<LeaderboardRow[]>([])
  const [editing, setEditing] = useState(false)
  const [draftPseudo, setDraftPseudo] = useState('')

  const load = useCallback(async () => {
    const [u, p, lb] = await Promise.all([
      backend.getUser(),
      backend.getMyPredictions(),
      backend.getLeaderboard(),
    ])
    setUser(u)
    setDraftPseudo(u.pseudo)
    setPredictions(p)
    setBoard(lb)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const stats = useMemo(() => {
    let points = 0
    let correct = 0
    let exact = 0
    for (const p of predictions) {
      const m = matchById(p.matchId)
      if (!m) continue
      const pts = scorePrediction(p, m)
      points += pts
      if (pts > 0) correct += 1
      if (p.homeScore === m.homeScore && p.awayScore === m.awayScore) exact += 1
    }
    const mine = board.find((r) => r.userId === user?.id)
    return {
      points,
      correct,
      exact,
      total: predictions.length,
      accuracy: predictions.length ? Math.round((correct / predictions.length) * 100) : 0,
      ratedMatches: mine?.ratedMatches ?? 0,
      votes: mine?.votes ?? 0,
      rank: board.findIndex((r) => r.userId === user?.id) + 1,
    }
  }, [predictions, board, user])

  const { level, next, progress } = levelFor(stats.points)
  const badges = badgesFor({
    points: stats.points,
    predictions: stats.total,
    correct: stats.correct,
    ratedMatches: stats.ratedMatches,
    votes: stats.votes,
    exactScores: stats.exact,
  })
  const earned = badges.filter((b) => b.earned).length

  if (!user) return <EmptyState icon="⏳" title="Chargement du profil…" />

  const save = async (patch: Partial<Pick<LhUser, 'pseudo' | 'avatar'>>) => {
    const next = await backend.updateUser(patch)
    setUser(next)
    load()
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle eyebrow="👤 Profil" title="Ton espace" />

      {/* identity card */}
      <Card raised className="relative overflow-hidden p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-lh-red/15 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-lh-void text-3xl ring-1 ring-lh-line">
            {user.avatar}
          </span>
          <div className="min-w-0 flex-1">
            {editing ? (
              <div className="flex flex-wrap items-center gap-2">
                <input
                  value={draftPseudo}
                  onChange={(e) => setDraftPseudo(e.target.value)}
                  maxLength={22}
                  className="min-w-0 flex-1 rounded-lg border border-lh-line bg-lh-void px-3 py-2 text-sm font-bold outline-none focus:border-lh-gold/50"
                />
                <button
                  onClick={() => {
                    save({ pseudo: draftPseudo.trim() || 'Gone anonyme' })
                    setEditing(false)
                  }}
                  className="rounded-lg bg-lh-red px-3 py-2 text-xs font-black text-white"
                >
                  Enregistrer
                </button>
              </div>
            ) : (
              <>
                <div className="lh-display text-2xl">{user.pseudo}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <Pill tone="gold">
                    {level.icon} {level.name}
                  </Pill>
                  {stats.rank > 0 && <Pill>#{stats.rank} au classement</Pill>}
                  <button
                    onClick={() => setEditing(true)}
                    className="text-[11px] font-bold text-lh-muted underline hover:text-lh-text"
                  >
                    Modifier
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="relative mt-4">
          <div className="mb-1.5 flex justify-between text-[11px] font-bold text-lh-muted">
            <span>{stats.points} pts</span>
            {next && <span>{next.min} pts → {next.name}</span>}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-lh-void">
            <div
              className="animate-lh-grow h-full rounded-full bg-gradient-to-r from-lh-red to-lh-gold"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        <div className="relative mt-4">
          <div className="lh-eyebrow mb-2">Avatar</div>
          <div className="flex flex-wrap gap-1.5">
            {AVATARS.map((a) => (
              <button
                key={a}
                onClick={() => save({ avatar: a })}
                className={`grid h-9 w-9 place-items-center rounded-lg text-lg transition-all ${
                  user.avatar === a
                    ? 'scale-105 bg-lh-red/20 ring-1 ring-lh-red'
                    : 'bg-lh-void hover:bg-lh-raised'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={stats.points} label="Points" accent />
        <Stat value={`${stats.accuracy} %`} label="Réussite" />
        <Stat value={stats.ratedMatches} label="Matchs notés" />
        <Stat value={stats.votes} label="Votes exprimés" />
      </div>

      {/* badges */}
      <section>
        <SectionTitle
          eyebrow="Récompenses"
          title="Badges"
          action={
            <Pill tone="gold">
              {earned}/{badges.length}
            </Pill>
          }
        />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {badges.map((b) => (
            <Card
              key={b.id}
              className={`flex items-center gap-3 p-3 ${b.earned ? '' : 'opacity-45'}`}
            >
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl ${
                  b.earned ? 'bg-lh-gold/15' : 'bg-lh-void'
                }`}
              >
                {b.earned ? b.icon : '🔒'}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-black">{b.label}</span>
                <span className="block text-[10px] leading-tight text-lh-muted">
                  {b.description}
                </span>
              </span>
            </Card>
          ))}
        </div>
      </section>

      {/* prediction history */}
      <section>
        <SectionTitle eyebrow="Historique" title="Tes pronostics" />
        {predictions.length === 0 ? (
          <EmptyState
            icon="🔮"
            title="Aucun pronostic pour l’instant"
            hint="Va sur la page Pronos pour poser ton premier pari et marquer des points."
          />
        ) : (
          <div className="flex flex-col gap-2">
            {predictions
              .slice()
              .reverse()
              .map((p) => {
                const m = matchById(p.matchId)
                if (!m) return null
                const pts = scorePrediction(p, m)
                return (
                  <Link
                    key={p.matchId}
                    to={`/matchs/${p.matchId}`}
                    className="lh-card flex flex-wrap items-center gap-2.5 p-3 transition-colors hover:border-lh-gold/40"
                  >
                    <Crest club={m.home} size={22} />
                    <Crest club={m.away} size={22} />
                    <span className="min-w-0 flex-1 truncate text-xs font-bold">
                      {m.home} vs {m.away}
                      <span className="ml-1.5 font-normal text-lh-muted">
                        {formatShortDate(m.date)}
                      </span>
                    </span>
                    <span className="lh-tabnum text-xs text-lh-muted">
                      Prono {p.homeScore}–{p.awayScore} · Réel {m.homeScore}–{m.awayScore}
                    </span>
                    <Pill tone={pts > 0 ? 'green' : 'red'}>
                      {pts > 0 ? `+${pts}` : '0'} pts
                    </Pill>
                    <span className="w-full text-[10px] text-lh-muted">
                      {explainPrediction(p, m).join(' · ')}
                    </span>
                  </Link>
                )
              })}
          </div>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <ButtonLink to="/data" variant="secondary" icon="📊" full>
          Data
        </ButtonLink>
        <ButtonLink to="/classements" variant="secondary" icon="🏆" full>
          Classements
        </ButtonLink>
      </section>

      <Card className="p-4">
        <div className="lh-eyebrow mb-2">Ton compte</div>
        <p className="mb-3 text-xs leading-relaxed text-lh-muted">
          {session?.email ? (
            <>
              Connecté avec <span className="font-bold text-lh-text">{session.email}</span>.{' '}
              {isShared
                ? 'Tes votes comptent dans les totaux vus par toute la communauté et te classent.'
                : 'Aucun serveur partagé n’est branché pour l’instant : tes votes restent sur cet appareil.'}
            </>
          ) : (
            <>
              Tu navigues <span className="font-bold text-lh-text">sans compte</span>. Tes votes
              restent sur cet appareil et n’apparaissent pas au classement — crée un compte pour les
              retrouver partout et concourir.
            </>
          )}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={signOut}>
            {session?.email ? 'Se déconnecter' : 'Créer un compte'}
          </Button>
          <ButtonLink to="/mentions-legales" variant="ghost" size="sm">
            Mentions légales et crédits
          </ButtonLink>
        </div>
      </Card>

      <PrivacyControls onWiped={signOut} />
    </div>
  )
}

/** Droits d'accès, de portabilité et d'effacement, exercés sur place.
 *  Une politique de confidentialité qui renvoie à un e-mail est un droit
 *  théorique ; ces deux boutons le rendent effectif. */
function PrivacyControls({ onWiped }: { onWiped: () => void }) {
  const [busy, setBusy] = useState<'export' | 'delete' | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const exportData = async () => {
    setBusy('export')
    setNotice(null)
    try {
      const payload = JSON.stringify(await backend.exportMyData(), null, 2)
      const blob = new Blob([payload], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lugdunhome-mes-donnees-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setNotice('Export téléchargé. Il contient tout ce que le service détient sur toi.')
    } catch {
      setNotice("L'export a échoué. Réessaie, ou écris-nous depuis la politique de confidentialité.")
    } finally {
      setBusy(null)
    }
  }

  const wipe = async () => {
    setBusy('delete')
    setNotice(null)
    try {
      await backend.deleteMyData()
      setConfirming(false)
      onWiped()
    } catch {
      setNotice('La suppression a échoué. Réessaie dans un instant.')
      setBusy(null)
    }
  }

  return (
    <Card className="p-4">
      <div className="lh-eyebrow mb-2">🔒 Tes données</div>
      <p className="mb-3 text-xs leading-relaxed text-lh-muted">
        Tu peux récupérer une copie complète de ce que le service détient, ou tout effacer. Aucune
        justification n’est demandée, aucun délai n’est imposé.
      </p>

      {notice && (
        <p className="mb-3 rounded-xl border border-lh-line bg-lh-raised px-3 py-2 text-[12px] text-lh-text">
          {notice}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" loading={busy === 'export'} onClick={exportData}>
          Exporter mes données
        </Button>

        {confirming ? (
          <>
            <Button variant="danger" size="sm" loading={busy === 'delete'} onClick={wipe}>
              Confirmer la suppression
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Annuler
            </Button>
          </>
        ) : (
          <Button variant="danger" size="sm" onClick={() => setConfirming(true)}>
            Supprimer mon compte
          </Button>
        )}

        <ButtonLink to="/confidentialite" variant="ghost" size="sm">
          Politique de confidentialité
        </ButtonLink>
      </div>

      {confirming && (
        <p className="mt-3 text-[11px] leading-relaxed text-red-300">
          Cette action efface ton profil, tes notes, tes votes et tes pronostics. Elle est
          irréversible — pense à exporter avant.
        </p>
      )}
    </Card>
  )
}
