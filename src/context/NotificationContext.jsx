import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useToast } from './ToastContext'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function storageKey(user) {
  if (!user) return 'plateSyncNotifs_guest'
  // Namespace by email so notifications are user-specific
  return `plateSyncNotifs_${user.email}`
}

function dismissedKey(user) {
  if (!user) return 'plateSyncDismissedNotifs_guest'
  return `plateSyncDismissedNotifs_${user.email}`
}

function loadDismissed(user) {
  const key = dismissedKey(user)
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function recordDismissed(user, identifier) {
  if (!identifier) return
  const key = dismissedKey(user)
  try {
    const set = loadDismissed(user)
    set.add(identifier)
    localStorage.setItem(key, JSON.stringify(Array.from(set)))
  } catch {
    // ignore
  }
}

function loadNotifs(user) {
  const key = storageKey(user)
  let userNotifs = []
  try {
    const raw = localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) userNotifs = parsed
    }
  } catch {
    userNotifs = []
  }

  // Merge any global broadcast notifications (e.g., admin menu updates)
  try {
    const rawBroadcasts = localStorage.getItem('plateSyncBroadcastNotifs')
    if (rawBroadcasts) {
      const broadcasts = JSON.parse(rawBroadcasts)
      if (Array.isArray(broadcasts)) {
        const dismissed = loadDismissed(user)
        const role = user?.role || 'student'
        let hasNew = false

        for (const b of broadcasts) {
          // If targeted to all or to user's role
          if (!b.targetRole || b.targetRole === 'all' || b.targetRole === role) {
            const ident = b.eventKey || b.id
            if (dismissed.has(ident)) continue
            const exists = userNotifs.some(n => (b.eventKey && n.eventKey === b.eventKey) || n.id === b.id)
            if (!exists) {
              userNotifs.push({
                ...b,
                read: false,
              })
              hasNew = true
            }
          }
        }

        if (hasNew) {
          userNotifs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          try {
            localStorage.setItem(key, JSON.stringify(userNotifs))
          } catch {
            // ignore
          }
        }
      }
    }
  } catch {
    // ignore
  }

  return userNotifs
}

function saveNotifs(user, notifs) {
  const key = storageKey(user)
  try {
    localStorage.setItem(key, JSON.stringify(notifs))
  } catch {
    // storage full — silently skip
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const NotificationContext = createContext(null)

export function NotificationProvider({ user, children }) {
  const [notifications, setNotifications] = useState(() => loadNotifs(user))
  const userRef = useRef(user)

  const { addToast } = useToast()

  // Re-load when the logged-in user changes (login / logout)
  useEffect(() => {
    userRef.current = user
    setNotifications(loadNotifs(user))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  // Sync notifications on storage updates or cross-session events
  useEffect(() => {
    const handleSync = (e) => {
      const updated = loadNotifs(userRef.current)
      setNotifications(updated)

      // Show real-time toast if a menu change notification was broadcast and user is student
      const notif = e?.detail?.notif
      if (notif && userRef.current?.role !== 'admin' && notif.category === 'menu') {
        addToast?.({
          message: `📢 ${notif.title}: Menu has been updated by the admin!`,
          type: 'info',
          duration: 5000,
        })
      }
    }

    window.addEventListener('storage', handleSync)
    window.addEventListener('plateSyncNotifUpdate', handleSync)
    window.addEventListener('plateSyncMenuUpdate', handleSync)
    return () => {
      window.removeEventListener('storage', handleSync)
      window.removeEventListener('plateSyncNotifUpdate', handleSync)
      window.removeEventListener('plateSyncMenuUpdate', handleSync)
    }
  }, [addToast])

  // Persist whenever notifications change
  useEffect(() => {
    saveNotifs(userRef.current, notifications)
  }, [notifications])

  // ------------------------------------------------------------------
  // Add a notification — dedup by eventKey
  // eventKey is an opaque string callers provide to prevent duplicates
  // ------------------------------------------------------------------
  const addNotification = useCallback(({
    title,
    message,
    category = 'general', // 'booking' | 'announcement' | 'reminder' | 'menu' | 'general'
    eventKey = null,       // unique key to prevent duplicate events
    actionLabel = null,
    actionPage = null,     // page name to navigate to
  }) => {
    setNotifications(prev => {
      // Dedup: if eventKey already exists, skip
      if (eventKey && prev.some(n => n.eventKey === eventKey)) return prev
      const newNotif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title,
        message,
        category,
        eventKey: eventKey || null,
        actionLabel,
        actionPage,
        timestamp: new Date().toISOString(),
        read: false,
      }
      return [newNotif, ...prev]
    })
  }, [])

  const markRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const deleteNotification = useCallback((id) => {
    setNotifications(prev => {
      const target = prev.find(n => n.id === id)
      if (target) {
        recordDismissed(userRef.current, target.eventKey || target.id)
      }
      return prev.filter(n => n.id !== id)
    })
  }, [])

  const clearAll = useCallback(() => {
    setNotifications(prev => {
      prev.forEach(n => recordDismissed(userRef.current, n.eventKey || n.id))
      return []
    })
  }, [])

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    addNotification,
    markRead,
    markAllRead,
    deleteNotification,
    clearAll,
  }), [notifications, unreadCount, addNotification, markRead, markAllRead, deleteNotification, clearAll])

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider')
  return ctx
}
