import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faEye,
  faEyeSlash,
  faCircleCheck,
  faCircle,
  faArrowRight
} from '@fortawesome/free-solid-svg-icons'
import { useToast } from '../../context/ToastContext'
import './SignupPage.css'

const hostels = ['Alfred Noble-A', 'Alfred Noble-B', 'Archimedes-A', 'Archimedes-B', 'Franklin-A', 'Franklin-B', 'Magellan']

export default function SignupPage({ onNavigate }) {
  const [form, setForm] = useState({
    fullName: '', hostel: '', userType: '',
    rollNo: '', staffId: '', room: '', messId: '', email: '', password: ''
  })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { addToast } = useToast()

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  // Password requirements: min 8 chars, at least 1 lowercase, 1 uppercase, 1 digit, 1 special character
  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

  const passwordRules = [
    { id: 'len',     label: 'At least 8 characters',                      met: form.password.length >= 8 },
    { id: 'upper',   label: 'At least one uppercase letter (A-Z)',         met: /[A-Z]/.test(form.password) },
    { id: 'lower',   label: 'At least one lowercase letter (a-z)',         met: /[a-z]/.test(form.password) },
    { id: 'num',     label: 'At least one number (0-9)',                   met: /\d/.test(form.password) },
    { id: 'special', label: 'At least one special character (!@#$%...)',   met: /[^A-Za-z0-9]/.test(form.password) }
  ]

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!form.email.endsWith('@chitkara.edu.in')) {
      setError('Please enter your Chitkara email ending in @chitkara.edu.in')
      return
    }
    if (!PASSWORD_REGEX.test(form.password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      // Check for duplicate email in the registered users list
      const existing = JSON.parse(localStorage.getItem('plateSyncUsers') || '[]')
      if (existing.find(u => u.email === form.email)) {
        setError('An account with this email already exists. Please log in instead.')
        setLoading(false)
        return
      }

      // Build the user record — role comes from the userType field
      const newUser = {
        fullName:  form.fullName,
        hostel:    form.hostel,
        role:      form.userType,      // 'student' | 'admin'
        email:     form.email,
        password:  form.password,      // demo-only; plaintext is fine here
        ...(form.userType === 'student'
          ? { rollNo: form.rollNo, room: form.room }
          : { staffId: form.staffId, messId: form.messId })
      }

      localStorage.setItem('plateSyncUsers', JSON.stringify([...existing, newUser]))
      setLoading(false)

      // Toast on successful signup
      addToast({
        message: `Account created! Welcome to PlateSync, ${form.fullName?.split(' ')[0] || 'there'}!`,
        type: 'success',
        duration: 5000,
      })

      // Navigate to Login and pass a flag so it can display a success banner
      if (onNavigate) onNavigate('login', { signupSuccess: true })
    }, 800)
  }

  const isStudent = form.userType === 'student'
  const isAdmin   = form.userType === 'admin'
  const roleLabel = isAdmin ? 'MESS ADMIN ACCOUNT' : 'STUDENT ACCOUNT'

  return (
    <section className="sp-page">
      <div className="sp-card">
        {/* Logo */}
        <div className="sp-logo">
          <span className="sp-logo-icon">P</span>
          <span className="sp-logo-name">PlateSync</span>
        </div>

        <p className="sp-role-label">{roleLabel}</p>
        <h1 className="sp-heading">Create your account</h1>
        <p className="sp-subtitle">Join the change, one plate at a time.</p>

        <form className="sp-form" onSubmit={handleSubmit} id="signup-page-form">

          {/* Full name */}
          <label>
            Full name
            <input
              type="text"
              name="fullName"
              id="sp-fullname"
              value={form.fullName}
              onChange={update}
              placeholder="Enter your full name"
              required
            />
          </label>

          {/* Hostel */}
          <label>
            Hostel name
            <select name="hostel" id="sp-hostel" value={form.hostel} onChange={update} required>
              <option value="">Select hostel</option>
              {hostels.map(h => <option key={h}>{h}</option>)}
            </select>
          </label>

          {/* User type */}
          <label>
            User type
            <select name="userType" id="sp-usertype" value={form.userType} onChange={update} required>
              <option value="">Select user type</option>
              <option value="student">Student</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          {/* Dynamic: Roll No (student only) */}
          {isStudent && (
            <label className="sp-dynamic-field">
              Roll No
              <input
                type="text"
                name="rollNo"
                id="sp-rollno"
                value={form.rollNo}
                onChange={update}
                placeholder="Enter your roll number"
                required
              />
            </label>
          )}

          {/* Dynamic: Staff ID (admin only) */}
          {isAdmin && (
            <label className="sp-dynamic-field">
              Staff ID
              <input
                type="text"
                name="staffId"
                id="sp-staffid"
                value={form.staffId}
                onChange={update}
                placeholder="Enter staff ID"
                required
              />
            </label>
          )}

          {/* Student-only: Room number */}
          {isStudent && (
            <label className="sp-dynamic-field">
              Room number
              <input
                type="text"
                name="room"
                id="sp-room"
                value={form.room}
                onChange={update}
                placeholder="Enter room number"
                required
              />
            </label>
          )}

          {/* Admin-only: Mess ID */}
          {isAdmin && (
            <label className="sp-dynamic-field">
              Mess ID
              <input
                type="text"
                name="messId"
                id="sp-messid"
                value={form.messId}
                onChange={update}
                placeholder="Enter mess ID"
                required
              />
            </label>
          )}

          {/* Email */}
          <label>
            Chitkara email
            <input
              type="email"
              name="email"
              id="sp-email"
              value={form.email}
              onChange={update}
              placeholder="name@chitkara.edu.in"
              autoComplete="email"
              required
            />
          </label>

          {/* Password */}
          <label className="sp-password-label">
            Password
            <div className="sp-password-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                name="password"
                id="sp-password"
                value={form.password}
                onChange={update}
                placeholder="Create a strong password"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="sp-show-pass"
                onClick={() => setShowPass(p => !p)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                <FontAwesomeIcon icon={showPass ? faEyeSlash : faEye} />
              </button>
            </div>

            {form.password.length > 0 && (
              <div className="sp-password-rules" aria-live="polite">
                {passwordRules.map(rule => (
                  <div key={rule.id} className={`sp-rule-item${rule.met ? ' met' : ''}`}>
                    <span className="sp-rule-icon">
                      <FontAwesomeIcon icon={rule.met ? faCircleCheck : faCircle} style={{ fontSize: 10 }} />
                    </span>
                    <span>{rule.label}</span>
                  </div>
                ))}
              </div>
            )}
          </label>

          {error && <p className="sp-error" role="alert">{error}</p>}

          <button
            type="submit"
            className="sp-submit"
            id="sp-submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating account...' : (
              <>
                Create account
                <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 6 }} />
              </>
            )}
          </button>
        </form>

        <div className="sp-divider"><span>or</span></div>

        <p className="sp-footer">
          Already have an account?
          <button
            className="sp-link-btn"
            id="go-to-login"
            onClick={() => onNavigate && onNavigate('login')}
          >
            Log in
          </button>
        </p>
      </div>
    </section>
  )
}
