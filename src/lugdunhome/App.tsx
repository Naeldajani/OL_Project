import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import MatchesPage from './pages/MatchesPage'
import MatchPage from './pages/MatchPage'
import PronosPage from './pages/PronosPage'
import DebatsPage from './pages/DebatsPage'
import DataPage from './pages/DataPage'
import ClassementsPage from './pages/ClassementsPage'
import ProfilPage from './pages/ProfilPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/matchs" element={<MatchesPage />} />
        <Route path="/matchs/:id" element={<MatchPage />} />
        <Route path="/pronos" element={<PronosPage />} />
        <Route path="/debats" element={<DebatsPage />} />
        <Route path="/data" element={<DataPage />} />
        <Route path="/classements" element={<ClassementsPage />} />
        <Route path="/profil" element={<ProfilPage />} />
      </Routes>
    </Layout>
  )
}
