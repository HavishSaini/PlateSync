import { useEffect, useRef, useState } from 'react'
import './Navbar.css'

export default function Navbar({ page, user, onNavigate, onHome, darkMode, toggleDark }) {
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
        <button onClick={() => onNavigate('roles')}>Get Started</button>
        <button onClick={() => onNavigate('menu')} className={page === 'menu' ? 'active' : ''}>Menu</button>
        {user && (
          <button onClick={() => onNavigate('dashboard')} className={page === 'dashboard' ? 'active' : ''}>
            My Dashboard
          </button>
        )}

        {/* Auth buttons */}
        <div className="nav-auth-btns">
          <button
            className="nav-login-btn"
            id="nav-login"
            onClick={() => window.open('/?view=login', '_blank')}
          >
            Login
          </button>
          <button
            className="nav-signup-btn"
            id="nav-signup"
            onClick={() => window.open('/?view=signup-page', '_blank')}
          >
            Sign Up
          </button>
        </div>

        {/* Hamburger button */}
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
