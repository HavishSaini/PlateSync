// ─── Reports Storage Utility ────────────────────────────────────────────────
// Pure JS module — no React. Handles all localStorage I/O for issue reports.
// Reports are stored in a SHARED key so the admin can see student submissions
// in the same browser demo session. Students filter by their own email.
//
// localStorage key: plateSyncReports  →  Report[]
// localStorage key: plateSyncNotifs_<email>  →  Notification[] (per-user)
// ---------------------------------------------------------------------------

const REPORTS_KEY = 'plateSyncReports'

// ── Helpers ─────────────────────────────────────────────────────────────────

export function generateId() {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase()
  return `RPT-${today}-${rand}`
}

function now() {
  return new Date().toISOString()
}

// ── Load / Save ──────────────────────────────────────────────────────────────

export function loadReports() {
  try {
    const raw = localStorage.getItem(REPORTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveReports(reports) {
  try {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports))
  } catch {
    // storage full — silently skip
  }
}

// ── CRUD ─────────────────────────────────────────────────────────────────────

/**
 * Create and persist a new report.
 * @param {object} fields  — all report fields except id/status/timestamps
 * @returns {object}       — the saved report
 */
export function addReport(fields) {
  const report = {
    id: generateId(),
    ...fields,
    status: 'Submitted',
    statusHistory: [{ status: 'Submitted', timestamp: now() }],
    adminResponse: null,
    createdAt: now(),
    updatedAt: now(),
  }
  const reports = loadReports()
  saveReports([report, ...reports])
  return report
}

/**
 * Update an existing report (admin use).
 * @param {string} id
 * @param {object} patch — { status?, adminResponse?, statusHistoryEntry? }
 * @returns {object|null} — updated report or null if not found
 */
export function updateReport(id, patch) {
  const reports = loadReports()
  const idx = reports.findIndex(r => r.id === id)
  if (idx === -1) return null

  const existing = reports[idx]
  const updated = {
    ...existing,
    ...patch,
    updatedAt: now(),
  }

  // Append status history entry if status changed
  if (patch.statusHistoryEntry) {
    updated.statusHistory = [...(existing.statusHistory || []), patch.statusHistoryEntry]
    delete updated.statusHistoryEntry
  }

  reports[idx] = updated
  saveReports(reports)
  return updated
}

/**
 * Get all reports (admin view), sorted newest first.
 */
export function getAllReports() {
  return loadReports().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

/**
 * Get reports for a specific student, sorted newest first.
 */
export function getStudentReports(email) {
  return loadReports()
    .filter(r => r.reporterEmail === email)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

// ── Cross-session notification delivery ─────────────────────────────────────
// When an admin updates a report, the student may not be logged in.
// We write directly into the student's notification bucket so they see
// the update on their next session.

function notifStorageKey(email) {
  return `plateSyncNotifs_${email}`
}

/**
 * Append a notification to a user's notification bucket.
 * Safe to call for any email, even if that user has never logged in.
 */
export function addNotificationForUser(recipientEmail, { title, message, category = 'announcement', eventKey, actionLabel, actionPage }) {
  const key = notifStorageKey(recipientEmail)
  let existing = []
  try {
    const raw = localStorage.getItem(key)
    if (raw) existing = JSON.parse(raw) || []
    if (!Array.isArray(existing)) existing = []
  } catch {
    existing = []
  }

  // Dedup by eventKey
  if (eventKey && existing.some(n => n.eventKey === eventKey)) return

  const notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title,
    message,
    category,
    eventKey: eventKey || null,
    actionLabel: actionLabel || null,
    actionPage: actionPage || null,
    timestamp: now(),
    read: false,
  }

  try {
    localStorage.setItem(key, JSON.stringify([notification, ...existing]))
  } catch {
    // storage full
  }
}

/**
 * Notify all admins that a student has submitted a new report.
 * Targets registered admins in `plateSyncUsers`, active admin sessions,
 * and the default admin email.
 */
export function notifyAdminsOnNewReport(report) {
  const adminEmails = new Set()

  // 1. Registered admins from plateSyncUsers
  try {
    const users = JSON.parse(localStorage.getItem('plateSyncUsers') || '[]')
    if (Array.isArray(users)) {
      users.filter(u => u.role === 'admin' && u.email).forEach(u => adminEmails.add(u.email))
    }
  } catch {
    // ignore
  }

  // 2. Active session if logged in as admin
  try {
    const current = JSON.parse(localStorage.getItem('plateSyncUser') || 'null')
    if (current && current.role === 'admin' && current.email) {
      adminEmails.add(current.email)
    }
  } catch {
    // ignore
  }

  // 3. Fallback default admin email so notifications are queued if admin hasn't signed up yet
  adminEmails.add('admin@chitkara.edu.in')

  const title = `New Report: ${report.title}`
  const message = `${report.reporterName || 'A student'} (${report.hostel || 'Hostel'}) submitted a report: "${report.title}" [${report.category} · ${report.severity} severity]. Reference: ${report.id}`

  adminEmails.forEach(email => {
    addNotificationForUser(email, {
      title,
      message,
      category: 'announcement',
      eventKey: `new_report_${report.id}_${email}`,
      actionLabel: 'Review Report',
      actionPage: 'dashboard',
    })
  })

  // Dispatch local custom event for immediate UI update in active session
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('plateSyncNotifUpdate', { detail: { report } }))
  }
}

/**
 * Ensure an admin receives notifications for any open reports submitted before account creation.
 */
export function syncAdminReportNotifications(adminEmail) {
  if (!adminEmail) return
  const reports = loadReports()
  reports.forEach(report => {
    addNotificationForUser(adminEmail, {
      title: `New Report: ${report.title}`,
      message: `${report.reporterName || 'A student'} (${report.hostel || 'Hostel'}) submitted a report: "${report.title}" [${report.category} · ${report.severity} severity]. Reference: ${report.id}`,
      category: 'announcement',
      eventKey: `new_report_${report.id}_${adminEmail}`,
      actionLabel: 'Review Report',
      actionPage: 'dashboard',
    })
  })
}

// ── Status transition rules ──────────────────────────────────────────────────

export const STATUS_TRANSITIONS = {
  'Submitted':    ['Under Review', 'Rejected'],
  'Under Review': ['In Progress', 'Rejected'],
  'In Progress':  ['Resolved', 'Rejected'],
  'Resolved':     [],
  'Rejected':     [],
}

export const OPEN_STATUSES = ['Submitted', 'Under Review', 'In Progress']
export const CLOSED_STATUSES = ['Resolved', 'Rejected']

export const ALL_STATUSES = ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected']
export const CATEGORIES   = ['Food Quality', 'Mess Hygiene', 'Food Safety', 'Staff Behavior', 'Infrastructure / Facilities', 'Other']
export const SEVERITIES   = ['Low', 'Medium', 'High', 'Urgent']
export const MEALS        = ['Breakfast', 'Lunch', 'Snacks', 'Dinner', 'Not applicable']
