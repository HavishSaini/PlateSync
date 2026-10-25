import { useState, useMemo } from 'react'
import { useNotifications } from '../../context/NotificationContext'
import './NotificationCenter.css'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const CATEGORY_LABELS = {
  booking:      'Booking',
  announcement: 'Announcement',
  reminder:     'Reminder',
  menu:         'Menu Update',
  general:      'General',
}

const CATEGORY_ICONS = {
  booking:      '🍽️',
  announcement: '📢',
  reminder:     '⏰',
  menu:         '📋',
  general:      'ℹ️',
}

const FILTERS = ['All', 'Unread', 'Bookings', 'Announcements', 'Reminders', 'Menu']

function filterMap(filter) {
  switch (filter) {
    case 'Unread':        return n => !n.read
    case 'Bookings':      return n => n.category === 'booking'
    case 'Announcements': return n => n.category === 'announcement'
    case 'Reminders':     return n => n.category === 'reminder'
    case 'Menu':          return n => n.category === 'menu'
    default:              return () => true
  }
}

function formatDate(isoString) {
  try {
    const d = new Date(isoString)
    const now = new Date()
    const diffMs = now - d
    const diffMin = Math.floor(diffMs / 60000)
    if (diffMin < 1)   return 'Just now'
    if (diffMin < 60)  return `${diffMin}m ago`
    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24)   return `${diffHr}h ago`
    const diffDay = Math.floor(diffHr / 24)
    if (diffDay < 7)   return `${diffDay}d ago`
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

// ---------------------------------------------------------------------------
// Notification Card
// ---------------------------------------------------------------------------
function NotifCard({ notif, onRead, onDelete, onAction }) {
  return (
    <article
      className={`nc-card${notif.read ? '' : ' nc-card--unread'}`}
      onClick={() => !notif.read && onRead(notif.id)}
    >
      <div className="nc-card-icon" aria-hidden="true">
        {CATEGORY_ICONS[notif.category] || '🔔'}
      </div>
      <div className="nc-card-body">
        <div className="nc-card-header">
          <span className="nc-card-title">{notif.title}</span>
          {!notif.read && <span className="nc-unread-dot" aria-label="Unread" />}
        </div>
        <p className="nc-card-message">{notif.message}</p>
        <div className="nc-card-meta">
          <span className={`nc-category-badge nc-cat-${notif.category}`}>
            {CATEGORY_LABELS[notif.category] || 'General'}
          </span>
          <time className="nc-card-time" dateTime={notif.timestamp} title={new Date(notif.timestamp).toLocaleString()}>
            {formatDate(notif.timestamp)}
          </time>
        </div>
        {notif.actionLabel && notif.actionPage && (
          <button
            className="nc-action-btn"
            onClick={(e) => { e.stopPropagation(); onAction(notif) }}
            aria-label={notif.actionLabel}
          >
            {notif.actionLabel} →
          </button>
        )}
      </div>
      <button
        className="nc-delete-btn"
        onClick={(e) => { e.stopPropagation(); onDelete(notif.id) }}
        aria-label="Delete notification"
        title="Delete"
      >
        ✕
      </button>
    </article>
  )
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------
function EmptyState({ filter }) {
  const msgs = {
    All:           { icon: '🔔', title: 'No notifications yet', sub: 'You\'ll see booking confirmations, announcements, and menu updates here.' },
    Unread:        { icon: '✅', title: 'All caught up!', sub: 'No unread notifications.' },
    Bookings:      { icon: '🍽️', title: 'No booking notifications', sub: 'Book a meal and the confirmation will appear here.' },
    Announcements: { icon: '📢', title: 'No announcements', sub: 'Admin announcements will appear here.' },
    Reminders:     { icon: '⏰', title: 'No reminders', sub: 'Upcoming meal deadlines will be shown here.' },
    Menu:          { icon: '📋', title: 'No menu updates', sub: 'When the mess menu changes, you\'ll be notified here.' },
  }
  const { icon, title, sub } = msgs[filter] || msgs.All
  return (
    <div className="nc-empty">
      <span className="nc-empty-icon" aria-hidden="true">{icon}</span>
      <h3>{title}</h3>
      <p>{sub}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main NotificationCenter page
// ---------------------------------------------------------------------------
export default function NotificationCenter({ onNavigate }) {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification, clearAll } = useNotifications()
  const [activeFilter, setActiveFilter] = useState('All')

  const filtered = useMemo(
    () => notifications.filter(filterMap(activeFilter)),
    [notifications, activeFilter]
  )

  function handleAction(notif) {
    markRead(notif.id)
    if (notif.actionPage && onNavigate) onNavigate(notif.actionPage)
  }

  return (
    <section className="page-container nc-page">
      {/* Header */}
      <div className="nc-page-header">
        <div>
          <p className="section-label">PLATESYNC PORTAL</p>
          <h1 className="page-title nc-heading">
            Notifications
            {unreadCount > 0 && (
              <span className="nc-heading-badge">{unreadCount} unread</span>
            )}
          </h1>
        </div>
        <div className="nc-header-actions">
          {unreadCount > 0 && (
            <button className="secondary-button nc-btn" onClick={markAllRead}>
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button className="secondary-button nc-btn nc-btn-danger" onClick={clearAll}>
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="nc-filters" role="tablist" aria-label="Filter notifications">
        {FILTERS.map(f => {
          const count = f === 'Unread'
            ? unreadCount
            : f === 'All'
            ? notifications.length
            : notifications.filter(filterMap(f)).length
          return (
            <button
              key={f}
              role="tab"
              aria-selected={activeFilter === f}
              className={`nc-filter-btn${activeFilter === f ? ' nc-filter-active' : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
              {count > 0 && <span className="nc-filter-count">{count}</span>}
            </button>
          )
        })}
      </div>

      {/* Notice: frontend-only */}
      <p className="nc-disclaimer">
        ℹ️ Notifications are saved locally in this browser. Cross-device sync requires a backend.
      </p>

      {/* List */}
      <div className="nc-list" role="list">
        {filtered.length === 0 ? (
          <EmptyState filter={activeFilter} />
        ) : (
          filtered.map(notif => (
            <NotifCard
              key={notif.id}
              notif={notif}
              onRead={markRead}
              onDelete={deleteNotification}
              onAction={handleAction}
            />
          ))
        )}
      </div>
    </section>
  )
}
