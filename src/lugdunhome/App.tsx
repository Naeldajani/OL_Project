import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import InfOLPage from './pages/InfOLPage'
import MatchesPage from './pages/MatchesPage'
import MercatoPage from './pages/MercatoPage'
import ReactionPage from './pages/ReactionPage'
import MatchPage from './pages/MatchPage'
import PronosPage from './pages/PronosPage'
import DebatsPage from './pages/DebatsPage'
import DataPage from './pages/DataPage'
import ClassementsPage from './pages/ClassementsPage'
import ProfilPage from './pages/ProfilPage'
import PlayerPage from './pages/PlayerPage'
import LegalPage from './pages/LegalPage'

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  )
}

/** Tant qu'aucune session n'existe, l'application se résume à l'écran de
 *  connexion : les notes et les pronostics n'ont pas de sens sans identité,
 *  et un compte anonyme reste accessible depuis cet écran. */
function Gate() {
  const { session, ready } = useAuth()

  if (!ready) return <Splash />
  if (!session) return <AuthPage />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/infol" element={<InfOLPage />} />
        <Route path="/matchs" element={<MatchesPage />} />
        <Route path="/reaction" element={<ReactionPage />} />
        <Route path="/reaction/:id" element={<ReactionPage />} />
        <Route path="/mercato" element={<MercatoPage />} />
        <Route path="/matchs/:id" element={<MatchPage />} />
        <Route path="/pronos" element={<PronosPage />} />
        <Route path="/debats" element={<DebatsPage />} />
        <Route path="/data" element={<DataPage />} />
        <Route path="/classements" element={<ClassementsPage />} />
        <Route path="/profil" element={<ProfilPage />} />
        <Route path="/joueur/:name" element={<PlayerPage />} />
        <Route path="/mentions-legales" element={<LegalPage />} />
      </Routes>
    </Layout>
  )
}

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center">
      <span className="lh-display animate-pulse text-2xl text-lh-muted">LUGDUN’HOME</span>
    </div>
  )
}
