import { useState } from 'react'
import './Login.css'

export default function Login({ onNavigate, onLogin, signupSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!form.email.endsWith('@chitkara.edu.in')) {
      setError('Please use your Chitkara email ending in @chitkara.edu.in')
      return
    }

    setLoading(true)
    setTimeout(() => {
      const users = JSON.parse(localStorage.getItem('plateSyncUsers') || '[]')
      const match = users.find(
        u => u.email === form.email && u.password === form.password
      )

      if (!match) {
        setError('Invalid email or password. Please check your credentials and try again.')
        setLoading(false)
        return
      }

      // Persist the active session (without the password)
      const { password: _pw, ...sessionUser } = match
      localStorage.setItem('plateSyncUser', JSON.stringify(sessionUser))
      setLoading(false)
      if (onLogin) onLogin(sessionUser)
    }, 600)
  }

  return (
    <section className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <span className="login-logo-icon">P</span>
          <span className="login-logo-name">PlateSync</span>
        </div>

        {signupSuccess && (
          <p className="login-success" role="status">
            ✓ Account created successfully! Please log in below.
          </p>
        )}

        <h1 className="login-heading">Welcome back</h1>
        <p className="login-subtitle">Log in to your PlateSync account</p>

        <form className="login-form" onSubmit={handleSubmit} id="login-form">
          <label>
            Chitkara email
            <input
              type="email"
              name="email"
              id="login-email"
              value={form.email}
              onChange={update}
              placeholder="name@chitkara.edu.in"
              autoComplete="email"
              required
            />
          </label>

          <label className="password-label">
            Password
            <input
              type="password"
              name="password"
              id="login-password"
              value={form.password}
              onChange={update}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </label>

          <a href="#" className="forgot-link" id="forgot-password">Forgot password?</a>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button
            type="submit"
            className="login-submit"
            id="login-submit-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Log in ->'}
          </button>
        </form>

        <div className="login-divider"><span>or</span></div>

        <p className="login-footer">
          Don't have an account?
          <button
            className="login-link-btn"
            id="go-to-signup"
            onClick={() => onNavigate && onNavigate('signup-page')}
          >
            Sign up
          </button>
        </p>
      </div>
    </section>
  )
}
