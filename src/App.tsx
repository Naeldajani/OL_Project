import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import MomentumPage from './pages/MomentumPage'
import BestXIPage from './pages/BestXIPage'
import PredictionsPage from './pages/PredictionsPage'
import GuessThePlayerPage from './pages/GuessThePlayerPage'
import MatchesPage from './pages/MatchesPage'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/matchs" replace />} />
        <Route path="/momentum" element={<MomentumPage />} />
        <Route path="/meilleur-xi" element={<BestXIPage />} />
        <Route path="/pronostics" element={<PredictionsPage />} />
        <Route path="/devine-le-gone" element={<GuessThePlayerPage />} />
        <Route path="/matchs" element={<MatchesPage />} />
      </Routes>
    </Layout>
  )
}
