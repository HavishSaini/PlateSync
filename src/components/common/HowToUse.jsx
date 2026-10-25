import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookOpen,
  faUserGraduate,
  faUtensils,
  faCalendarDays,
  faClock,
  faCircleCheck,
  faBullhorn,
  faChartColumn,
  faPen,
  faClipboardList,
  faShieldHalved,
  faLightbulb,
  faSun,
  faBowlFood,
  faMugHot,
  faMoon,
  faCircleQuestion,
  faChevronDown,
  faArrowRight,
} from '@fortawesome/free-solid-svg-icons'
import './HowToUse.css'

export default function HowToUse({ onNavigate, user }) {
  const [roleTab, setRoleTab] = useState(user?.role === 'admin' ? 'admin' : 'student')
  const [openFaq, setOpenFaq] = useState(null)

  const toggleFaq = (index) => {
    setOpenFaq(prev => prev === index ? null : index)
  }

  const studentSteps = [
    {
      num: 'Step 1',
      icon: faCalendarDays,
      title: 'Review Today\'s & Weekly Menu',
      desc: 'Browse the day-by-day menu under the Menu tab or right on your Dashboard. Check dish names, specials, and serving hours.',
      tip: 'Click on "Nutrition & Allergens" to check protein, fiber, fat, and allergen warnings before deciding to eat.'
    },
    {
      num: 'Step 2',
      icon: faClock,
      title: 'Book During the 45-Min Window',
      desc: 'Meal bookings unlock exactly 45 minutes prior to each meal (e.g. Breakfast opens at 07:15 AM for an 08:00 AM meal).',
      tip: 'Pre-booking helps the kitchen prepare exact quantities, directly eliminating food wastage.'
    },
    {
      num: 'Step 3',
      icon: faCircleCheck,
      title: 'Attend and Mark Check-In',
      desc: 'Head to the cafeteria dining hall during serving hours. The mess staff records your meal check-in seamlessly.',
      tip: 'Track your attendance count and see your personal carbon and food-saving impact on your dashboard.'
    },
    {
      num: 'Step 4',
      icon: faBullhorn,
      title: 'Report Issues & Get Notifications',
      desc: 'Encountered cold food, hygiene issues, or shortages? Submit an issue report with photos and track resolution live.',
      tip: 'Keep an eye on the notification bell for real-time announcements from mess administrators.'
    }
  ]

  const adminSteps = [
    {
      num: 'Step 1',
      icon: faChartColumn,
      title: 'Monitor Live Dining Demand',
      desc: 'View real-time headcounts and confirmed bookings in your Live Demand dashboard before the meal serving begins.',
      tip: 'Compare expected attendance with current bookings to adjust kitchen prep in advance.'
    },
    {
      num: 'Step 2',
      icon: faPen,
      title: 'Update Menus & Nutrition',
      desc: 'Edit the upcoming meal menu in Menu Management. Updates automatically notify all students via instant toast and notification feeds.',
      tip: 'Menus can be updated until student bookings open (45 minutes before serving). Once open, it automatically locks.'
    },
    {
      num: 'Step 3',
      icon: faClipboardList,
      title: 'Mark Attendance & Log Waste',
      desc: 'Log student attendance during meal hours and enter end-of-meal food surplus or leftover weight (kg) into Waste Analysis.',
      tip: 'The waste engine automatically graphs costs lost and environmental metrics.'
    },
    {
      num: 'Step 4',
      icon: faShieldHalved,
      title: 'Resolve Student Issue Reports',
      desc: 'Review submitted hygiene, quality, or portion tickets. Update ticket status to "In Progress" or "Resolved" with administrative notes.',
      tip: 'Resolved tickets provide transparent feedback and maintain high student satisfaction.'
    }
  ]

  const faqs = [
    {
      q: 'Why can\'t I book my meal right now?',
      a: 'Bookings are strictly time-gated to the 45 minutes preceding each meal. For example, Breakfast (8:00 AM - 10:00 AM) opens for booking at 7:15 AM. Once the meal starts at 8:00 AM, bookings lock so the kitchen can finalize food counts.'
    },
    {
      q: 'How long do admin menu updates stay active?',
      a: 'Menu overrides are bound strictly to that specific meal and calendar date. Once that meal time passes, the system automatically transitions to subsequent meals and default schedules.'
    },
    {
      q: 'Where do I find high protein or allergen-free meals?',
      a: 'Navigate to "Menu" in the top bar and click "Nutrition & Allergens". You can use the quick filter pills ("High Protein", "High Fiber", "Low Fat") or filter out common allergens like Dairy, Gluten, and Nuts.'
    },
    {
      q: 'Can I cancel my meal booking?',
      a: 'Yes! You can cancel your booking anytime before the meal commences directly from your "Today\'s Meals" dashboard cards.'
    }
  ]

  return (
    <div className="how-to-use-page">
      {/* Hero Header */}
      <section className="how-to-hero">
        <span className="how-to-badge">
          <FontAwesomeIcon icon={faBookOpen} style={{ marginRight: 6 }} />
          User Guide
        </span>
        <h1>How to Use PlateSync</h1>
        <p className="how-to-hero-subtitle">
          Everything you need to know about booking meals, tracking macros, avoiding food waste,
          and managing cafeteria dining efficiently.
        </p>

        {/* Role Toggle */}
        <div className="how-to-role-switcher" role="tablist" aria-label="User role guide tabs">
          <button
            role="tab"
            aria-selected={roleTab === 'student'}
            className={`how-to-role-btn ${roleTab === 'student' ? 'active' : ''}`}
            onClick={() => setRoleTab('student')}
          >
            <FontAwesomeIcon icon={faUserGraduate} style={{ marginRight: 6 }} /> For Students
          </button>
          <button
            role="tab"
            aria-selected={roleTab === 'admin'}
            className={`how-to-role-btn ${roleTab === 'admin' ? 'active' : ''}`}
            onClick={() => setRoleTab('admin')}
          >
            <FontAwesomeIcon icon={faUtensils} style={{ marginRight: 6 }} /> For Mess Admins
          </button>
        </div>
      </section>

      {/* Step by Step Workflow */}
      <section className="workflow-section">
        <h2 className="workflow-section-title">
          <span>
            <FontAwesomeIcon
              icon={roleTab === 'student' ? faUserGraduate : faClipboardList}
              style={{ marginRight: 8, color: 'var(--primary, #138052)' }}
            />
            {roleTab === 'student' ? 'Student Dining Workflow' : 'Admin Operational Workflow'}
          </span>
        </h2>
        <p className="workflow-section-desc">
          {roleTab === 'student'
            ? 'Follow these 4 simple steps to ensure your meals are prepared fresh and food waste is avoided.'
            : 'Key administrative routines for forecasting demand, editing menus, and maintaining dining hygiene.'}
        </p>

        <div className="steps-grid">
          {(roleTab === 'student' ? studentSteps : adminSteps).map((step, idx) => (
            <div className="step-card" key={idx}>
              <div className="step-header">
                <span className="step-number">{step.num}</span>
                <span className="step-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={step.icon} />
                </span>
              </div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              <div className="step-tip">
                <span className="step-tip-icon">
                  <FontAwesomeIcon icon={faLightbulb} />
                </span>
                <span>{step.tip}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Meal Timing & Booking Window Reference */}
      <section className="rules-card">
        <h3>
          <span>
            <FontAwesomeIcon icon={faClock} style={{ marginRight: 8, color: 'var(--primary, #138052)' }} />
            Meal Schedules & 45-Minute Booking Windows
          </span>
        </h3>
        <div className="rules-timeline-grid">
          <div className="timeline-item">
            <div className="timeline-meal">
              <span>Breakfast</span>
              <FontAwesomeIcon icon={faSun} style={{ color: '#E09F3E' }} />
            </div>
            <div className="timeline-window">Booking: 07:15 AM – 08:00 AM</div>
            <div className="timeline-meal-time">Serving: 08:00 AM – 10:00 AM</div>
          </div>

          <div className="timeline-item">
            <div className="timeline-meal">
              <span>Lunch</span>
              <FontAwesomeIcon icon={faBowlFood} style={{ color: 'var(--primary, #138052)' }} />
            </div>
            <div className="timeline-window">Booking: 11:45 AM – 12:30 PM</div>
            <div className="timeline-meal-time">Serving: 12:30 PM – 02:30 PM</div>
          </div>

          <div className="timeline-item">
            <div className="timeline-meal">
              <span>Snacks</span>
              <FontAwesomeIcon icon={faMugHot} style={{ color: '#D97706' }} />
            </div>
            <div className="timeline-window">Booking: 04:15 PM – 05:00 PM</div>
            <div className="timeline-meal-time">Serving: 05:00 PM – 06:30 PM</div>
          </div>

          <div className="timeline-item">
            <div className="timeline-meal">
              <span>Dinner</span>
              <FontAwesomeIcon icon={faMoon} style={{ color: '#6366F1' }} />
            </div>
            <div className="timeline-window">Booking: 06:45 PM – 07:30 PM</div>
            <div className="timeline-meal-time">Serving: 07:30 PM – 09:30 PM</div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="faq-section">
        <h2>
          <span>
            <FontAwesomeIcon icon={faCircleQuestion} style={{ marginRight: 8, color: 'var(--primary, #138052)' }} />
            Frequently Asked Questions
          </span>
        </h2>
        <div className="faq-list">
          {faqs.map((faq, idx) => (
            <div className="faq-item" key={idx}>
              <button
                className="faq-question"
                onClick={() => toggleFaq(idx)}
                aria-expanded={openFaq === idx}
              >
                <span>{faq.q}</span>
                <span className={`faq-arrow ${openFaq === idx ? 'open' : ''}`}>
                  <FontAwesomeIcon icon={faChevronDown} />
                </span>
              </button>
              {openFaq === idx && (
                <p className="faq-answer">{faq.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Box */}
      <div className="how-to-cta-box">
        <div className="cta-text">
          <h4>Ready to get started?</h4>
          <p>Head to your dashboard to check today's dining schedule or explore the weekly menu.</p>
        </div>
        <div className="cta-buttons">
          <button
            className="cta-primary-btn"
            onClick={() => onNavigate(user ? 'dashboard' : 'login')}
          >
            {user ? 'Go to My Dashboard' : 'Login to PlateSync'}
            <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 8 }} />
          </button>
          <button
            className="cta-secondary-btn"
            onClick={() => onNavigate('menu')}
          >
            View Weekly Menu
          </button>
        </div>
      </div>
    </div>
  )
}
