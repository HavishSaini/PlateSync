import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faChevronDown,
  faCalendarDays,
  faChartPie,
  faBell,
  faRightFromBracket,
  faBookOpen,
  faEnvelope,
  faSun,
  faMoon
} from '@fortawesome/free-solid-svg-icons'
import { useNotifications } from '../../context/NotificationContext'
import { logout as logoutAction } from '../../store/slices/authSlice'
import './Navbar.css'

export default function Navbar({ darkMode, toggleDark }) {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)

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

  const handleLogout = () => {
    dispatch(logoutAction())
    navigate('/')
  }

  return (
    <header className="navbar">
      <Link to="/" className="logo" aria-label="Go to PlateSync home">
        <span>P</span>PlateSync
      </Link>

      <nav aria-label="Main navigation">
        <NavLink
          to="/"
          className={({ isActive }) => isActive ? 'active' : ''}
          end
        >
          Home
        </NavLink>

        {/* Menu item with Nutrition & Allergens submenu */}
        <div
          className="nav-menu-item-wrap"
          ref={menuDropdownRef}
          onMouseEnter={() => setMenuSubHover(true)}
          onMouseLeave={() => setMenuSubHover(false)}
        >
          <div className="nav-menu-btn-group">
            <NavLink
              to="/menu"
              className={({ isActive }) => `nav-menu-btn ${isActive ? 'active' : ''}`}
              id="nav-menu-main-btn"
              onClick={() => setMenuSubOpen(false)}
            >
              Menu
            </NavLink>
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
              <FontAwesomeIcon icon={faChevronDown} style={{ fontSize: 10 }} />
            </button>
          </div>

          {isMenuSubVisible && (
            <div className="nav-menu-submenu" role="menu" aria-label="Menu options">
              <NavLink
                to="/menu"
                role="menuitem"
                className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                onClick={() => setMenuSubOpen(false)}
                id="nav-sub-menu"
              >
                <span className="submenu-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={faCalendarDays} />
                </span>
                <div className="submenu-text">
                  <span className="submenu-title">Weekly Mess Menu</span>
                  <span className="submenu-desc">Schedule & day-by-day meals</span>
                </div>
              </NavLink>

              <NavLink
                to="/nutrition"
                role="menuitem"
                className={({ isActive }) => `nav-submenu-item ${isActive ? 'active' : ''}`}
                onClick={() => setMenuSubOpen(false)}
                id="nav-sub-nutrition"
              >
                <span className="submenu-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={faChartPie} />
                </span>
                <div className="submenu-text">
                  <span className="submenu-title">Nutrition & Allergens</span>
                  <span className="submenu-desc">Calories, macros & dietary safety</span>
                </div>
              </NavLink>
            </div>
          )}
        </div>

        <NavLink
          to="/how-to-use"
          className={({ isActive }) => isActive ? 'active' : ''}
          id="nav-about-btn"
        >
          About
        </NavLink>

        {user && (
          <NavLink
            to="/dashboard"
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            My Dashboard
          </NavLink>
        )}

        {/* Auth area — changes based on login state */}
        {user ? (
          <div className="nav-auth-btns">
            <span className="nav-user-name" title={user.email}>
              {user.fullName?.split(' ')[0]}
              <span className="nav-user-role">{user.role}</span>
            </span>

            {/* Notification Bell */}
            <NavLink
              to="/notifications"
              className={({ isActive }) => `nav-bell-btn${isActive ? ' nav-bell-active' : ''}`}
              aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
              title="Notification Center"
              id="nav-bell"
            >
              <span className="nav-bell-icon" aria-hidden="true">
                <FontAwesomeIcon icon={faBell} />
              </span>
              {unreadCount > 0 && (
                <span className="nav-bell-badge" aria-hidden="true">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>

            <button
              className="nav-logout-btn"
              id="nav-logout"
              onClick={handleLogout}
            >
              <FontAwesomeIcon icon={faRightFromBracket} style={{ marginRight: 6 }} />
              Log out
            </button>
          </div>
        ) : (
          <div className="nav-auth-btns">
            <Link
              to="/login"
              className="nav-login-btn"
              id="nav-login"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="nav-signup-btn"
              id="nav-signup"
            >
              Sign Up
            </Link>
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
                <span className="toggle-icon">
                  <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
                </span>
                <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                <span className={`toggle-pill${darkMode ? ' on' : ''}`} />
              </button>

              <div className="dropdown-divider" />

              <p className="dropdown-label">HELP & GUIDES</p>
              <NavLink
                to="/how-to-use"
                className={({ isActive }) => `ham-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
                role="menuitem"
                id="ham-how-to-use"
              >
                <span className="ham-nav-icon">
                  <FontAwesomeIcon icon={faBookOpen} />
                </span>
                <span className="ham-nav-text">How to Use</span>
                <span className="ham-nav-badge">Guide</span>
              </NavLink>

              <NavLink
                to="/contact"
                className={({ isActive }) => `ham-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => setMenuOpen(false)}
                role="menuitem"
                id="ham-contact-us"
              >
                <span className="ham-nav-icon">
                  <FontAwesomeIcon icon={faEnvelope} />
                </span>
                <span className="ham-nav-text">Contact Us</span>
              </NavLink>
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}
