import './Footer.css'

export default function Footer({ onNavigate }) {
  const handleNav = (target) => {
    if (onNavigate) {
      onNavigate(target)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <div className="footer-logo">
            <span>P</span>
            <strong>PlateSync</strong>
          </div>
        </div>

        <nav className="footer-links" aria-label="Footer navigation">
          <button type="button" onClick={() => handleNav('home')}>Home</button>
          <button type="button" onClick={() => handleNav('menu')}>Menu</button>
          <button type="button" onClick={() => handleNav('how-to-use')}>About</button>
          <button type="button" onClick={() => handleNav('how-to-use')}>Contact</button>
        </nav>

        <div className="footer-tagline">
          <span>Smart hostel dining · Less waste · Better choices</span>
        </div>
      </div>
    </footer>
  )
}
