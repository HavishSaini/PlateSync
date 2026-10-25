import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function storageKey(user) {
  if (!user) return null
  // Namespace by email so notifications are user-specific
  return `plateSyncNotifs_${user.email}`
}

function loadNotifs(user) {
  const key = storageKey(user)
  if (!key) return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveNotifs(user, notifs) {
  const key = storageKey(user)
  if (!key) return
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

  // Re-load when the logged-in user changes (login / logout)
  useEffect(() => {
    userRef.current = user
    setNotifications(loadNotifs(user))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

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
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
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
