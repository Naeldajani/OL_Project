import type { Backend } from './types'
import { localBackend } from './backendLocal'
import { supabaseBackend, supabaseConfigured } from './backendSupabase'

/**
 * One switch for the whole app: as soon as Supabase credentials exist,
 * every page starts reading and writing shared community data instead of
 * this browser's local store. No page needs to know which one is active.
 */
export const backend: Backend = supabaseConfigured() ? supabaseBackend : localBackend

export const isShared = backend.kind === 'supabase'
