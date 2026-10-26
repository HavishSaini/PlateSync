import { useSelector } from 'react-redux'
import { Navigate, useLocation } from 'react-router-dom'

/**
 * State-Aware Route Guard (Protected Route)
 *
 * 1. Checks Redux auth state for authenticated user.
 * 2. If unauthenticated, redirects to /login and saves the intended location in state.
 * 3. Supports optional role authorization (e.g., requiredRole="admin").
 */
export default function ProtectedRoute({ children, requiredRole }) {
  const user = useSelector((state) => state.auth.user)
  const location = useLocation()

  // Not logged in -> redirect to login, preserving intended path
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Optional: check specific role permissions
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}
