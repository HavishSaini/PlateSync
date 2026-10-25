import { useEffect, useRef, useState } from 'react'
import './Navbar.css'

export default function Navbar({ page, user, onNavigate, onHome, onLogout, darkMode, toggleDark }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleOutsideClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [menuOpen])

  return (
    <header className="navbar">
      <button className="logo" onClick={onHome} aria-label="Go to PlateSync home">
        <span>P</span>PlateSync
      </button>

      <nav aria-label="Main navigation">
        <button onClick={onHome} className={page === 'home' ? 'active' : ''}>Home</button>
        <button onClick={() => onNavigate('menu')} className={page === 'menu' ? 'active' : ''}>Menu</button>

        {user && (
          <button
            onClick={() => onNavigate('dashboard')}
            className={page === 'dashboard' ? 'active' : ''}
          >
            My Dashboard
          </button>
        )}

        {/* Auth area — changes based on login state */}
        {user ? (
          <div className="nav-auth-btns">
            <span className="nav-user-name" title={user.email}>
              {user.fullName?.split(' ')[0]}
              <span className="nav-user-role">{user.role}</span>
            </span>
            <button
              className="nav-logout-btn"
              id="nav-logout"
              onClick={onLogout}
            >
              Log out
            </button>
          </div>
        ) : (
          <div className="nav-auth-btns">
            <button
              className="nav-login-btn"
              id="nav-login"
              onClick={() => onNavigate('login')}
            >
              Login
            </button>
            <button
              className="nav-signup-btn"
              id="nav-signup"
              onClick={() => onNavigate('signup-page')}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Hamburger / settings button */}
        <div className="hamburger-wrap" ref={menuRef}>
          <button
            className={`hamburger-btn${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(prev => !prev)}
            aria-label="Open settings menu"
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="hamburger-dropdown" role="menu">
              <p className="dropdown-label">APPEARANCE</p>
              <button
                className="dark-toggle"
                onClick={() => { toggleDark(); setMenuOpen(false) }}
                role="menuitem"
              >
                <span className="toggle-icon">{darkMode ? '☀️' : '🌙'}</span>
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                <span className={`toggle-pill${darkMode ? ' on' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
