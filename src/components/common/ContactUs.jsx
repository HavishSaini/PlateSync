import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faLocationDot,
  faEnvelope,
  faPhone,
  faClock,
  faCircleCheck,
  faPaperPlane
} from '@fortawesome/free-solid-svg-icons'
import { useToast } from '../../context/ToastContext'
import './ContactUs.css'

export default function ContactUs({ onNavigate: _onNavigate, user }) {
  const { showToast } = useToast()

  const [formData, setFormData] = useState({
    name: user?.fullName || '',
    email: user?.email || '',
    hostel: user?.hostel || 'Alfred Noble-A',
    subject: 'General Inquiry',
    message: '',
  })

  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      showToast({
        type: 'error',
        title: 'Missing Fields',
        message: 'Please fill in your name, email, and message.',
      })
      return
    }

    setLoading(true)

    // Save contact message into localStorage demo store
    setTimeout(() => {
      try {
        const existingMessages = JSON.parse(localStorage.getItem('plateSyncContactMessages') || '[]')
        const newMessage = {
          id: `msg_${Date.now()}`,
          ...formData,
          createdAt: new Date().toISOString(),
        }
        existingMessages.push(newMessage)
        localStorage.setItem('plateSyncContactMessages', JSON.stringify(existingMessages))
      } catch {
        // storage fallback
      }

      setLoading(false)
      setSubmitted(true)
      showToast({
        type: 'success',
        title: 'Message Sent!',
        message: 'Thank you for reaching out. The mess administration will get back to you.',
      })
    }, 600)
  }

  return (
    <div className="contact-page">
      {/* Hero Header */}
      <div className="contact-hero">
        <span className="contact-kicker">GET IN TOUCH</span>
        <h1>Contact Mess Administration</h1>
        <p>
          Have questions about your meal plan, special dietary requests, menu suggestions, or cafeteria operations?
          Send us a message and our team will get back to you promptly.
        </p>
      </div>

      <div className="contact-layout-grid">
        {/* Left Column: Direct Info & Campus Location */}
        <div className="contact-info-col">
          <div className="contact-card-info">
            <h3>Mess & Dining Office</h3>
            <p>
              We're here to assist students, staff, and faculty members with meal bookings, nutritional guidelines, and cafeteria hygiene.
            </p>

            <div className="contact-details-list">
              <div className="contact-detail-row">
                <span className="contact-icon-bubble" aria-hidden="true">
                  <FontAwesomeIcon icon={faLocationDot} />
                </span>
                <div className="contact-detail-text">
                  <strong>Campus Location</strong>
                  <span>Central Dining Hall, Chitkara University, Punjab</span>
                </div>
              </div>

              <div className="contact-detail-row">
                <span className="contact-icon-bubble" aria-hidden="true">
                  <FontAwesomeIcon icon={faEnvelope} />
                </span>
                <div className="contact-detail-text">
                  <strong>Email Administration</strong>
                  <span>mess.support@chitkara.edu.in</span>
                </div>
              </div>

              <div className="contact-detail-row">
                <span className="contact-icon-bubble" aria-hidden="true">
                  <FontAwesomeIcon icon={faPhone} />
                </span>
                <div className="contact-detail-text">
                  <strong>Helpline / Counter</strong>
                  <span>+91 9056978368</span>
                </div>
              </div>
            </div>
          </div>

          <div className="contact-hostel-hours">
            <h4>Office & Help Desk Hours</h4>
            <p>Direct assistance is available at the cafeteria administrative counter during meal service intervals.</p>
            <span className="hours-pill">
              <FontAwesomeIcon icon={faClock} style={{ marginRight: 6 }} />
              Open Daily: 07:00 AM – 10:00 PM
            </span>
          </div>
        </div>

        {/* Right Column: Interactive Contact Form */}
        <div className="contact-form-container">
          <div className="contact-form-header">
            <h3>Send a Message</h3>
            <p>Fill out the form below to contact our dining management team.</p>
          </div>

          {submitted ? (
            <div className="contact-success-banner" role="alert">
              <span style={{ fontSize: 24, color: '#138052' }} aria-hidden="true">
                <FontAwesomeIcon icon={faCircleCheck} />
              </span>
              <div>
                <strong>Thank you, {formData.name.split(' ')[0]}!</strong>
                <p>
                  Your message regarding <em>"{formData.subject}"</em> has been received. Our administration will contact you at <strong>{formData.email}</strong>.
                </p>
                <button
                  type="button"
                  className="contact-submit-btn"
                  style={{ marginTop: 14, padding: '8px 16px', fontSize: 13 }}
                  onClick={() => {
                    setSubmitted(false)
                    setFormData(prev => ({ ...prev, message: '' }))
                  }}
                >
                  Send Another Message
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row-2col">
                <div className="contact-field-group">
                  <label htmlFor="contact-name">Full Name *</label>
                  <input
                    type="text"
                    id="contact-name"
                    name="name"
                    className="contact-input"
                    placeholder="e.g. Aditi Sharma"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="contact-field-group">
                  <label htmlFor="contact-email">Email Address *</label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    className="contact-input"
                    placeholder="student@chitkara.edu.in"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2col">
                <div className="contact-field-group">
                  <label htmlFor="contact-hostel">Hostel Residence</label>
                  <select
                    id="contact-hostel"
                    name="hostel"
                    className="contact-select"
                    value={formData.hostel}
                    onChange={handleChange}
                  >
                    <option value="Alfred Noble-A">Alfred Noble - Block A</option>
                    <option value="Alfred Noble-B">Alfred Noble - Block B</option>
                    <option value="Archimedes-A">Archimedes - Block A</option>
                    <option value="Archimedes-B">Archimedes - Block B</option>
                    <option value="Franklin-A">Franklin - Block A</option>
                    <option value="Franklin-B">Franklin - Block B</option>
                    <option value="Day Scholar / Other">Day Scholar / Other</option>
                  </select>
                </div>

                <div className="contact-field-group">
                  <label htmlFor="contact-subject">Topic / Subject *</label>
                  <select
                    id="contact-subject"
                    name="subject"
                    className="contact-select"
                    value={formData.subject}
                    onChange={handleChange}
                  >
                    <option value="General Inquiry">General Dining Inquiry</option>
                    <option value="Dietary & Allergen Guidance">Dietary & Allergen Guidance</option>
                    <option value="Menu Suggestion">Menu Suggestion</option>
                    <option value="Booking System Feedback">Booking System Feedback</option>
                    <option value="Cafeteria Hygiene & Service">Cafeteria Hygiene & Service</option>
                  </select>
                </div>
              </div>

              <div className="contact-field-group">
                <label htmlFor="contact-message">Your Message *</label>
                <textarea
                  id="contact-message"
                  name="message"
                  className="contact-textarea"
                  placeholder="Tell us what you'd like to share or ask..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="contact-submit-btn"
                disabled={loading}
                id="contact-form-submit-btn"
              >
                {loading ? 'Sending...' : (
                  <>
                    <FontAwesomeIcon icon={faPaperPlane} style={{ marginRight: 8 }} />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
