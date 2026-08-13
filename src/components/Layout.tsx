import type { ReactNode } from 'react'
import Sidebar from './Sidebar'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-ink-900">
      <Sidebar />
      <main className="flex-1 min-w-0 px-10 py-8">
        <div className="max-w-[1100px] mx-auto">{children}</div>
        <footer className="max-w-[1100px] mx-auto mt-16 pb-8 text-center text-xs text-slate-500">
          Généré automatiquement — données FBref, filtrées sur Olympique Lyonnais.
        </footer>
      </main>
    </div>
  )
}
