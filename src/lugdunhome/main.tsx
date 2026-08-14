import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)

// Offline support + home-screen install. Only on http(s): a service worker
// can't register from a file:// page (the self-contained artifact build).
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(new URL('lh-sw.js', document.baseURI).pathname)
      .catch(() => {
        /* offline mode is a bonus, never block the app on it */
      })
  })
}
