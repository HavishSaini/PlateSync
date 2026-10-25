import { useEffect, useRef, useState } from 'react'
import { useNotifications } from '../../context/NotificationContext'
import './Navbar.css'

export default function Navbar({ page, user, onNavigate, onHome, onLogout, darkMode, toggleDark }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const [menuSubOpen, setMenuSubOpen] = useState(false)
  const [menuSubHover, setMenuSubHover] = useState(false)
  const menuDropdownRef = useRef(null)

  const { unreadCount } = useNotifications()

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleOutsideClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(e.target)) {
        setMenuSubOpen(false)
      }
    }
    if (menuOpen || menuSubOpen) document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [menuOpen, menuSubOpen])

  const isMenuSubVisible = menuSubOpen || menuSubHover

  return (
    <header className="navbar">
      <button className="logo" onClick={onHome} aria-label="Go to PlateSync home">
        <span>P</span>PlateSync
      </button>

      <nav aria-label="Main navigation">
        <button onClick={onHome} className={page === 'home' ? 'active' : ''}>Home</button>

        {/* Menu item with Nutrition & Allergens submenu */}
        <div
          className="nav-menu-item-wrap"
          ref={menuDropdownRef}
          onMouseEnter={() => setMenuSubHover(true)}
          onMouseLeave={() => setMenuSubHover(false)}
        >
          <div className="nav-menu-btn-group">
            <button
              onClick={() => { onNavigate('menu'); setMenuSubOpen(false) }}
              className={`nav-menu-btn ${(page === 'menu' || page === 'nutrition') ? 'active' : ''}`}
              id="nav-menu-main-btn"
            >
              Menu
            </button>
            <button
              type="button"
              className={`nav-menu-chevron-btn ${isMenuSubVisible ? 'open' : ''}`}
              onClick={(e) => {
                e.stopPropagation()
                setMenuSubOpen(prev => !prev)
              }}
              aria-expanded={isMenuSubVisible}
              aria-haspopup="true"
              aria-label="Toggle menu options"
              id="nav-menu-chevron"
            >
              <svg width="8" height="5" viewBox="0 0 8 5" fill="none" aria-hidden="true">
                <path d="M1 1L4 4L7 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {isMenuSubVisible && (
            <div className="nav-menu-submenu" role="menu" aria-label="Menu options">
              <button
                role="menuitem"
                className={`nav-submenu-item ${page === 'menu' ? 'active' : ''}`}
                onClick={() => { onNavigate('menu'); setMenuSubOpen(false) }}
                id="nav-sub-menu"
              >
                <span className="submenu-icon" aria-hidden="true">📅</span>
                <div className="submenu-text">
                  <span className="submenu-title">Weekly Mess Menu</span>
                  <span className="submenu-desc">Schedule & day-by-day meals</span>
                </div>
              </button>

              <button
                role="menuitem"
                className={`nav-submenu-item ${page === 'nutrition' ? 'active' : ''}`}
                onClick={() => { onNavigate('nutrition'); setMenuSubOpen(false) }}
                id="nav-sub-nutrition"
              >
                <span className="submenu-icon" aria-hidden="true">🥗</span>
                <div className="submenu-text">
                  <span className="submenu-title">Nutrition & Allergens</span>
                  <span className="submenu-desc">Calories, macros & dietary safety</span>
                </div>
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => onNavigate('how-to-use')}
          className={page === 'how-to-use' ? 'active' : ''}
          id="nav-about-btn"
        >
          About
        </button>

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

            {/* Notification Bell */}
            <button
              className={`nav-bell-btn${page === 'notifications' ? ' nav-bell-active' : ''}`}
              onClick={() => onNavigate('notifications')}
              aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
              title="Notification Center"
              id="nav-bell"
            >
              <span className="nav-bell-icon" aria-hidden="true">🔔</span>
              {unreadCount > 0 && (
                <span className="nav-bell-badge" aria-hidden="true">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

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

              <div className="dropdown-divider" />

              <p className="dropdown-label">HELP & GUIDES</p>
              <button
                className={`ham-nav-item ${page === 'how-to-use' ? 'active' : ''}`}
                onClick={() => { onNavigate('how-to-use'); setMenuOpen(false) }}
                role="menuitem"
                id="ham-how-to-use"
              >
                <span className="ham-nav-icon">📖</span>
                <span className="ham-nav-text">How to Use</span>
                <span className="ham-nav-badge">Guide</span>
              </button>

              <button
                className={`ham-nav-item ${page === 'contact' ? 'active' : ''}`}
                onClick={() => { onNavigate('contact'); setMenuOpen(false) }}
                role="menuitem"
                id="ham-contact-us"
              >
                <span className="ham-nav-icon">💬</span>
                <span className="ham-nav-text">Contact Us</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
