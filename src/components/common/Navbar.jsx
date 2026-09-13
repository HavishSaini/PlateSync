import './Navbar.css'

export default function Navbar({ page, user, onNavigate, onHome }) {
  return <header className="navbar">
    <button className="logo" onClick={onHome} aria-label="Go to PlateSync home"><span>P</span>PlateSync</button>
    <nav aria-label="Main navigation">
      <button onClick={onHome} className={page === 'home' ? 'active' : ''}>Home</button>
      <button onClick={() => onNavigate('roles')}>Get Started</button>
      <button onClick={() => onNavigate('menu')} className={page === 'menu' ? 'active' : ''}>Menu</button>
      {user && <button onClick={() => onNavigate('dashboard')} className={page === 'dashboard' ? 'active' : ''}>My Dashboard</button>}
    </nav>
  </header>
}
