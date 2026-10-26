import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Link to="/" onClick={scrollToTop} className="footer-logo">
            <span>P</span>
            <strong>PlateSync</strong>
          </Link>
        </div>

        <nav className="footer-links" aria-label="Footer navigation">
          <Link to="/" onClick={scrollToTop}>Home</Link>
          <Link to="/menu" onClick={scrollToTop}>Menu</Link>
          <Link to="/how-to-use" onClick={scrollToTop}>About</Link>
          <Link to="/contact" onClick={scrollToTop} id="footer-contact-btn">Contact</Link>
        </nav>

        <div className="footer-tagline">
          <span>Smart hostel dining · Less waste · Better choices</span>
        </div>
      </div>
    </footer>
  )
}
