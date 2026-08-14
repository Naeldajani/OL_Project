import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  authMode,
  currentSession,
  onAuthChange,
  signIn as doSignIn,
  signOut as doSignOut,
  signUp as doSignUp,
  updateProfileMetadata,
  type Session,
} from '../lib/auth'

interface AuthValue {
  session: Session | null
  mode: typeof authMode
  ready: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, pseudo: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (pseudo: string, avatar: string) => Promise<void>
}

const Ctx = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => currentSession())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setSession(currentSession())
    setReady(true)
    // la session peut changer dans un autre onglet, ou expirer au
    // rafraîchissement du jeton : on écoute plutôt que de la lire une fois
    return onAuthChange(setSession)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    setSession(await doSignIn(email, password))
  }, [])

  const signUp = useCallback(async (email: string, password: string, pseudo: string) => {
    setSession(await doSignUp(email, password, pseudo))
  }, [])

  const signOut = useCallback(async () => {
    await doSignOut()
    setSession(null)
  }, [])

  const updateProfile = useCallback(async (pseudo: string, avatar: string) => {
    await updateProfileMetadata(pseudo, avatar)
    setSession(currentSession())
  }, [])

  const value = useMemo(
    () => ({ session, mode: authMode, ready, signIn, signUp, signOut, updateProfile }),
    [session, ready, signIn, signUp, signOut, updateProfile],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(Ctx)
  if (!value) throw new Error('useAuth doit être utilisé dans <AuthProvider>')
  return value
}
