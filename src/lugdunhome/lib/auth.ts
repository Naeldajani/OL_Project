/**
 * Comptes supporters : inscription, connexion, session.
 *
 * Deux modes, une seule API pour l'interface :
 *
 *  - « supabase » quand VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sont
 *    définis : vrais comptes e-mail + mot de passe, session partagée entre
 *    tous les appareils, votes visibles par toute la communauté.
 *  - « local » sinon : un compte qui ne quitte pas l'appareil. Indispensable
 *    pour que l'application reste utilisable hors-ligne et dans la version
 *    artefact, où aucune requête réseau n'est possible.
 *
 * L'appel passe par fetch et l'API REST GoTrue plutôt que par le SDK
 * supabase-js : une dépendance de moins, et le bundle reste léger.
 */
const URL_BASE = import.meta.env.VITE_SUPABASE_URL as string | undefined
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const authMode: 'supabase' | 'local' = URL_BASE && ANON_KEY ? 'supabase' : 'local'

const SESSION_KEY = 'lh:session'
const LOCAL_KEY = 'lh:local-account'

export interface Session {
  userId: string
  email: string
  pseudo: string
  avatar: string
  accessToken?: string
  refreshToken?: string
  /** epoch ms ; absent en mode local, la session n'expire pas */
  expiresAt?: number
}

export class AuthError extends Error {}

/** Messages GoTrue traduits : « Invalid login credentials » ne dit rien à un
 *  supporter, et l'anglais brut dans une interface française fait bâclé. */
function humanize(raw: string): string {
  const m = raw.toLowerCase()
  if (m.includes('invalid login credentials')) return 'E-mail ou mot de passe incorrect.'
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'Un compte existe déjà avec cet e-mail.'
  if (m.includes('password should be at least'))
    return 'Le mot de passe doit faire au moins 6 caractères.'
  if (m.includes('unable to validate email') || m.includes('invalid email'))
    return "Cette adresse e-mail n'est pas valide."
  if (m.includes('email not confirmed'))
    return 'Confirme ton adresse e-mail avant de te connecter (regarde tes spams).'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Trop de tentatives. Réessaie dans quelques minutes.'
  return raw || 'Une erreur est survenue.'
}

async function gotrue<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${URL_BASE}/auth/v1/${path}`, {
    method: 'POST',
    headers: {
      apikey: ANON_KEY!,
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new AuthError(humanize(json.error_description || json.msg || json.message || ''))
  }
  return json as T
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function writeSession(session: Session | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
  listeners.forEach((fn) => fn(session))
}

type Listener = (s: Session | null) => void
const listeners = new Set<Listener>()

export function onAuthChange(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function currentSession(): Session | null {
  return readSession()
}

interface TokenResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user: { id: string; email: string; user_metadata?: { pseudo?: string; avatar?: string } }
}

function toSession(r: TokenResponse): Session {
  return {
    userId: r.user.id,
    email: r.user.email,
    pseudo: r.user.user_metadata?.pseudo || r.user.email.split('@')[0],
    avatar: r.user.user_metadata?.avatar || '🦁',
    accessToken: r.access_token,
    refreshToken: r.refresh_token,
    expiresAt: Date.now() + r.expires_in * 1000,
  }
}

export async function signUp(email: string, password: string, pseudo: string): Promise<Session> {
  if (authMode === 'local') return localAccount(pseudo || email.split('@')[0], email)

  const r = await gotrue<TokenResponse & { id?: string }>('signup', {
    email,
    password,
    data: { pseudo, avatar: '🦁' },
  })
  // Si la confirmation par e-mail est active, GoTrue renvoie l'utilisateur
  // sans jeton : il n'y a pas encore de session à ouvrir.
  if (!r.access_token) {
    throw new AuthError(
      'Compte créé. Confirme ton adresse depuis le mail reçu, puis connecte-toi.',
    )
  }
  const session = toSession(r)
  writeSession(session)
  return session
}

export async function signIn(email: string, password: string): Promise<Session> {
  if (authMode === 'local') return localAccount(email.split('@')[0], email)

  const r = await gotrue<TokenResponse>('token?grant_type=password', { email, password })
  const session = toSession(r)
  writeSession(session)
  return session
}

export async function signOut(): Promise<void> {
  const s = readSession()
  if (authMode === 'supabase' && s?.accessToken) {
    await gotrue('logout', {}, s.accessToken).catch(() => {
      /* le jeton peut avoir expiré : la session locale part quand même */
    })
  }
  writeSession(null)
}

/** Compte hors-ligne : même forme de session, aucun réseau. */
export function localAccount(pseudo: string, email = ''): Session {
  const stored = localStorage.getItem(LOCAL_KEY)
  const userId = stored ?? crypto.randomUUID()
  if (!stored) localStorage.setItem(LOCAL_KEY, userId)
  const session: Session = { userId, email, pseudo: pseudo || 'Gone', avatar: '🦁' }
  writeSession(session)
  return session
}

export function updateLocalSession(patch: Partial<Pick<Session, 'pseudo' | 'avatar'>>) {
  const s = readSession()
  if (!s) return
  writeSession({ ...s, ...patch })
}

/** Jeton valide pour PostgREST, rafraîchi si besoin. Renvoie undefined en
 *  mode local ou quand le rafraîchissement échoue. */
export async function accessToken(): Promise<string | undefined> {
  const s = readSession()
  if (!s?.accessToken || authMode === 'local') return undefined
  // marge d'une minute : un jeton qui expire pendant la requête la fait
  // échouer côté serveur, pas côté client
  if (s.expiresAt && s.expiresAt - 60_000 > Date.now()) return s.accessToken
  if (!s.refreshToken) return s.accessToken

  try {
    const r = await gotrue<TokenResponse>('token?grant_type=refresh_token', {
      refresh_token: s.refreshToken,
    })
    const next = { ...toSession(r), pseudo: s.pseudo, avatar: s.avatar }
    writeSession(next)
    return next.accessToken
  } catch {
    writeSession(null)
    return undefined
  }
}

export async function updateProfileMetadata(pseudo: string, avatar: string): Promise<void> {
  if (authMode === 'local') {
    updateLocalSession({ pseudo, avatar })
    return
  }
  const token = await accessToken()
  if (!token) return
  await fetch(`${URL_BASE}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      apikey: ANON_KEY!,
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ data: { pseudo, avatar } }),
  })
  updateLocalSession({ pseudo, avatar })
}

export async function resetPassword(email: string): Promise<void> {
  if (authMode === 'local') throw new AuthError('Indisponible sans compte en ligne.')
  await gotrue('recover', { email })
}
