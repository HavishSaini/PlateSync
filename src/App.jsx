import { useEffect, useState } from 'react'
import './App.css'
import Navbar from './components/common/Navbar'
import Footer from './components/common/Footer'
import Home from './components/home/Home'
import RoleSelector from './components/role/RoleSelector'
import Signup from './components/signup/Signup'
import SignupPage from './components/signup/SignupPage'
import Login from './components/login/Login'
import Dashboard from './components/dashboard/Dashboard'
import Menu from './components/menu/Menu'

// Read ?view= param so navbar "open in new tab" lands on the right page
function getInitialPage() {
  const params = new URLSearchParams(window.location.search)
  const view = params.get('view')
  if (view === 'login' || view === 'signup-page') return view
  return 'home'
}

// This app uses only the React basics from state, effects, props and components.
export default function App() {
  const [page, setPage] = useState(getInitialPage)
  const [role, setRole] = useState('student')
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('plateSyncUser')) || null)
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('plateSyncDark') === 'true')

  useEffect(() => {
    if (user) localStorage.setItem('plateSyncUser', JSON.stringify(user))
  }, [user])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('plateSyncDark', darkMode)
  }, [darkMode])

  const startSignup = (selectedRole) => { setRole(selectedRole); setPage('signup') }
  const openDashboard = (newUser) => { setUser(newUser); setPage('dashboard') }
  const goHome = () => setPage('home')
  const toggleDark = () => setDarkMode(prev => !prev)

  return <div className="app-shell">
    <Navbar page={page} user={user} onNavigate={setPage} onHome={goHome} darkMode={darkMode} toggleDark={toggleDark} />
    <main>
      {page === 'home'        && <Home onGetStarted={() => setPage('roles')} />}
      {page === 'roles'       && <RoleSelector onChoose={startSignup} onBack={goHome} />}
      {page === 'signup'      && <Signup role={role} onSubmit={openDashboard} onBack={() => setPage('roles')} />}
      {page === 'signup-page' && <SignupPage onNavigate={setPage} />}
      {page === 'login'       && <Login onNavigate={setPage} />}
      {page === 'dashboard'   && <Dashboard user={user} onHome={goHome} />}
      {page === 'menu'        && <Menu onGetStarted={() => setPage('roles')} />}
    </main>
    <Footer />
  </div>
}

