import { useState } from 'react'
import Button from '../components/Button'
import { Wordmark } from '../components/Layout'
import { useAuth } from '../hooks/useAuth'
import { AuthError, localAccount, resetPassword } from '../lib/auth'

type Mode = 'connexion' | 'inscription'

const ARGUMENTS = [
  { icon: '⭐', text: 'Note chaque joueur pendant les 24 h qui suivent le coup de sifflet' },
  { icon: '🏅', text: "Élis l'Homme du Match avec le reste du Kop" },
  { icon: '🔮', text: 'Marque des points sur tes pronostics et grimpe au classement' },
  { icon: '🗣️', text: 'Tranche le débat de la semaine' },
]

export default function AuthPage() {
  const { signIn, signUp, mode: backendMode } = useAuth()
  const [mode, setMode] = useState<Mode>('connexion')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const local = backendMode === 'local'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      if (mode === 'inscription') await signUp(email.trim(), password, pseudo.trim())
      else await signIn(email.trim(), password)
    } catch (err) {
      const message = err instanceof AuthError ? err.message : 'Une erreur est survenue.'
      // « compte créé, confirme ton e-mail » est un succès, pas un échec
      if (message.startsWith('Compte créé')) setNotice(message)
      else setError(message)
    } finally {
      setBusy(false)
    }
  }

  const forgot = async () => {
    if (!email.trim()) {
      setError("Saisis ton e-mail d'abord, on t'enverra le lien dessus.")
      return
    }
    setError(null)
    try {
      await resetPassword(email.trim())
      setNotice('Lien de réinitialisation envoyé. Pense à regarder tes spams.')
    } catch (err) {
      setError(err instanceof AuthError ? err.message : 'Envoi impossible.')
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-10">
      <div className="animate-lh-rise">
        <div className="mb-7 flex flex-col items-center gap-4 text-center">
          <Wordmark />
          <div>
            <h1 className="lh-display text-3xl">La maison des supporters</h1>
            <p className="mt-2 text-sm text-lh-muted">
              Après chaque match, 24 h pour noter, élire et débattre. Entre les matchs, on
              pronostique.
            </p>
          </div>
        </div>

        <div className="lh-card-raised overflow-hidden">
          <div className="flex border-b border-lh-line">
            {(['connexion', 'inscription'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m)
                  setError(null)
                  setNotice(null)
                }}
                className={`flex-1 py-3.5 text-sm font-black capitalize transition-colors ${
                  mode === m
                    ? 'bg-lh-red/12 text-lh-redSoft'
                    : 'text-lh-muted hover:bg-white/5 hover:text-lh-text'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="flex flex-col gap-3.5 p-5">
            {mode === 'inscription' && (
              <Field
                label="Pseudo"
                hint="C'est le nom qui apparaîtra au classement"
                value={pseudo}
                onChange={setPseudo}
                placeholder="TontonGone69"
                autoComplete="nickname"
                required
                maxLength={24}
              />
            )}

            <Field
              label="E-mail"
              value={email}
              onChange={setEmail}
              type="email"
              placeholder="toi@exemple.fr"
              autoComplete="email"
              required
            />

            <Field
              label="Mot de passe"
              hint={mode === 'inscription' ? '6 caractères minimum' : undefined}
              value={password}
              onChange={setPassword}
              type="password"
              placeholder="••••••••"
              autoComplete={mode === 'inscription' ? 'new-password' : 'current-password'}
              required
              minLength={6}
            />

            {error && (
              <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-[13px] font-semibold text-red-300">
                {error}
              </p>
            )}
            {notice && (
              <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3.5 py-2.5 text-[13px] font-semibold text-emerald-300">
                {notice}
              </p>
            )}

            <Button type="submit" size="lg" full loading={busy}>
              {mode === 'inscription' ? 'Créer mon compte' : 'Se connecter'}
            </Button>

            {mode === 'connexion' && !local && (
              <button
                type="button"
                onClick={forgot}
                className="text-center text-xs font-semibold text-lh-muted underline-offset-2 hover:text-lh-text hover:underline"
              >
                Mot de passe oublié ?
              </button>
            )}
          </form>
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          {ARGUMENTS.map((a) => (
            <div key={a.text} className="flex items-start gap-3 px-1">
              <span className="text-base leading-5">{a.icon}</span>
              <span className="text-[13px] leading-5 text-lh-muted">{a.text}</span>
            </div>
          ))}
        </div>

        <div className="lh-rule my-5" />

        <button
          onClick={() => localAccount(pseudo.trim() || 'Gone anonyme')}
          className="w-full text-center text-xs font-semibold text-lh-muted hover:text-lh-text"
        >
          Continuer sans compte →
        </button>
        <p className="mt-2 text-center text-[11px] leading-relaxed text-lh-muted">
          {local
            ? "Aucun serveur n'est configuré : les comptes restent sur cet appareil."
            : "Sans compte, tes votes restent sur cet appareil et n'alimentent pas les classements."}
        </p>
      </div>
    </div>
  )
}

function Field({
  label,
  hint,
  value,
  onChange,
  ...rest
}: {
  label: string
  hint?: string
  value: string
  onChange: (v: string) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="lh-eyebrow">{label}</span>
      <input
        {...rest}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-lh-line bg-lh-void px-3.5 py-3 text-sm outline-none transition-colors placeholder:text-lh-muted/70 focus:border-lh-gold/55"
      />
      {hint && <span className="text-[11px] text-lh-muted">{hint}</span>}
    </label>
  )
}
