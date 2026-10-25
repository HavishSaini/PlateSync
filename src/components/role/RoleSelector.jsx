import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUserGraduate,
  faUtensils,
  faArrowLeft,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons'
import './RoleSelector.css'

export default function RoleSelector({ onChoose, onBack }) {
  return (
    <section className="page-container role-page">
      <button className="back-button" onClick={onBack}>
        <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: 6 }} />
        Back to home
      </button>

      <p className="section-label">STEP 1 OF 2</p>
      <h1 className="page-title">How will you use PlateSync?</h1>
      <p className="page-description">
        Choose a role to continue. Both portals provide tailored interfaces for campus dining.
      </p>

      <div className="role-grid">
        <article>
          <span className="role-icon-bubble" aria-hidden="true">
            <FontAwesomeIcon icon={faUserGraduate} />
          </span>
          <h2>I am a student</h2>
          <p>I want to see the menu, book meals, and understand my food-waste impact.</p>
          <button className="primary-button" onClick={() => onChoose('student')}>
            Continue as Student
            <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 6 }} />
          </button>
        </article>

        <article>
          <span className="role-icon-bubble" aria-hidden="true">
            <FontAwesomeIcon icon={faUtensils} />
          </span>
          <h2>I am a mess admin</h2>
          <p>I want to see meal demand and use it to prepare the correct amount of food.</p>
          <button className="secondary-button" onClick={() => onChoose('admin')}>
            Continue as Admin
            <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 6 }} />
          </button>
        </article>
      </div>
    </section>
  )
}
