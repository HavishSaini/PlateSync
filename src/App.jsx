import { useEffect, useMemo, useState } from 'react'
import './App.css'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import Home from './components/home/Home'
import SignupPage from './components/signup/SignupPage'
import Login from './components/login/Login'
import Dashboard from './components/dashboard/Dashboard'
import Menu from './components/menu/Menu'
import NutritionView from './components/nutrition/NutritionView'
import NotificationCenter from './components/notifications/NotificationCenter'
import ToastContainer from './components/notifications/ToastContainer'
import HowToUse from './components/common/HowToUse'
import { NotificationProvider } from './context/NotificationContext'
import { ToastProvider } from './context/ToastContext'

// ---------------------------------------------------------------------------
// Read ?view= param so that the Navbar "Login / Sign Up" links can still open
// in the same tab and land on the right page.
// ---------------------------------------------------------------------------
function getInitialPage() {
  const params = new URLSearchParams(window.location.search)
  const view   = params.get('view')
  if (view === 'login' || view === 'signup-page' || view === 'menu' || view === 'nutrition' || view === 'how-to-use') return view
  return 'home'
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
  // current visible page
  const [page, setPage] = useState(getInitialPage)

  // optional extra data passed alongside a navigation (e.g. signupSuccess flag)
  const [pageExtra, setPageExtra] = useState(null)

  // logged-in user object (null = not logged in)
  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem('plateSyncUser')) || null
  )

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem('plateSyncDark') === 'true'
  )

  // Sync dark-mode preference
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('plateSyncDark', darkMode)
  }, [darkMode])

  // Derive the visible page: if the user is already logged in, treat any
  // attempt to visit login/signup as a redirect to their dashboard.
  // This is a pure derivation — no setState inside an effect.
  const effectivePage = useMemo(() => {
    if (user && (page === 'login' || page === 'signup-page')) return 'dashboard'
    return page
  }, [user, page])

  // ── Navigation helper ──────────────────────────────────────────────────────
  // SignupPage calls onNavigate('login', { signupSuccess: true })
  // All other callers just pass the page name.
  const navigate = (dest, extra = null) => {
    setPage(dest)
    setPageExtra(extra)
  }

  // ── Auth callbacks ─────────────────────────────────────────────────────────
  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser)
    setPage('dashboard')
    setPageExtra(null)
  }

  const handleLogout = () => {
    localStorage.removeItem('plateSyncUser')
    setUser(null)
    setPage('home')
    setPageExtra(null)
  }

  // ── Misc helpers ───────────────────────────────────────────────────────────
  const goHome    = () => { setPage('home');  setPageExtra(null) }
  const toggleDark = () => setDarkMode(prev => !prev)

  return (
    <ToastProvider>
      <NotificationProvider user={user}>
        <div className="app-shell">
          <Navbar
            page={effectivePage}
            user={user}
            onNavigate={navigate}
            onHome={goHome}
            onLogout={handleLogout}
            darkMode={darkMode}
            toggleDark={toggleDark}
          />
          <main>
            {effectivePage === 'home'          && <Home onGetStarted={() => navigate(user ? 'dashboard' : 'login')} />}
            {effectivePage === 'signup-page'   && <SignupPage onNavigate={navigate} />}
            {effectivePage === 'login'         && (
              <Login
                onNavigate={navigate}
                onLogin={handleLogin}
                signupSuccess={pageExtra?.signupSuccess}
              />
            )}
            {effectivePage === 'dashboard'     && <Dashboard user={user} onHome={goHome} onLogout={handleLogout} />}
            {effectivePage === 'menu'          && <Menu onNavigate={navigate} />}
            {effectivePage === 'nutrition'     && <NutritionView onNavigate={navigate} />}
            {effectivePage === 'notifications' && <NotificationCenter onNavigate={navigate} />}
            {effectivePage === 'how-to-use'    && <HowToUse onNavigate={navigate} user={user} />}
          </main>
          <Footer />
          {/* Global toast container — renders on top of everything */}
          <ToastContainer />
        </div>
      </NotificationProvider>
    </ToastProvider>
  )
}
