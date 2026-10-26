import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
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
import ContactUs from './components/common/ContactUs'
import { NotificationProvider } from './context/NotificationContext'
import { ToastProvider } from './context/ToastContext'

import ProtectedRoute from './components/common/ProtectedRoute'

export default function App() {
  const navigate = useNavigate()
  const user = useSelector((state) => state.auth.user)
  const [darkMode, setDarkMode] = useState(false)

  // Sync dark-mode preference
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('plateSyncDark', darkMode)
  }, [darkMode])

  const toggleDark = () => setDarkMode(prev => !prev)

  return (
    <ToastProvider>
      <NotificationProvider user={user}>
        <div className="app-shell">
          <Navbar
            darkMode={darkMode}
            toggleDark={toggleDark}
          />
          <main>
            <Routes>
              {/* Public Pages */}
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu onNavigate={(dest) => navigate(`/${dest === 'home' ? '' : dest}`)} />} />
              <Route path="/nutrition" element={<NutritionView onNavigate={(dest) => navigate(`/${dest === 'home' ? '' : dest}`)} />} />
              <Route path="/how-to-use" element={<HowToUse user={user} onNavigate={(dest) => navigate(`/${dest === 'home' ? '' : dest}`)} />} />
              <Route path="/contact" element={<ContactUs user={user} onNavigate={(dest) => navigate(`/${dest === 'home' ? '' : dest}`)} />} />

              {/* Protected Notification Center: Requires logged in user */}
              <Route
                path="/notifications"
                element={
                  <ProtectedRoute>
                    <NotificationCenter onNavigate={(dest) => navigate(`/${dest === 'home' ? '' : dest}`)} />
                  </ProtectedRoute>
                }
              />

              {/* Authentication Routes: redirect to /dashboard if already logged in */}
              <Route
                path="/login"
                element={user ? <Navigate to="/dashboard" replace /> : <Login />}
              />
              <Route
                path="/signup"
                element={user ? <Navigate to="/dashboard" replace /> : <SignupPage />}
              />
              <Route
                path="/signup-page"
                element={<Navigate to="/signup" replace />}
              />

              {/* State-Aware Protected Route: redirects unauthenticated users to /login */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard user={user} onHome={() => navigate('/')} />
                  </ProtectedRoute>
                }
              />

              {/* 404 Catch-All Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer onNavigate={(dest) => navigate(`/${dest === 'home' ? '' : dest}`)} />
          {/* Global toast container — renders on top of everything */}
          <ToastContainer />
        </div>
      </NotificationProvider>
    </ToastProvider>
  )
}
