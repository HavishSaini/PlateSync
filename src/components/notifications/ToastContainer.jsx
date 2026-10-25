import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCircleCheck,
  faCircleXmark,
  faTriangleExclamation,
  faCircleInfo,
  faXmark
} from '@fortawesome/free-solid-svg-icons'
import { useToast } from '../../context/ToastContext'
import './ToastContainer.css'

const ICONS = {
  success: faCircleCheck,
  error: faCircleXmark,
  warning: faTriangleExclamation,
  info: faCircleInfo,
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToast()
  if (toasts.length === 0) return null
  return (
    <div className="toast-container" role="region" aria-label="Notifications" aria-live="polite">
      {toasts.map(toast => (
        <div key={toast.id} className={`toast toast-${toast.type}`} role="alert">
          <span className="toast-icon">
            <FontAwesomeIcon icon={ICONS[toast.type] || faCircleInfo} />
          </span>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-close"
            onClick={() => removeToast(toast.id)}
            aria-label="Dismiss notification"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>
      ))}
    </div>
  )
}
