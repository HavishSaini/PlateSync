import { useCallback, useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPaperclip,
  faCommentDots,
  faCircleCheck,
  faCircleInfo,
  faInbox,
  faMagnifyingGlass,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons'
import {
  getAllReports,
  updateReport,
  addNotificationForUser,
  STATUS_TRANSITIONS,
  ALL_STATUSES,
  CATEGORIES,
  SEVERITIES,
  OPEN_STATUSES,
  CLOSED_STATUSES,
} from '../../utils/reportsStorage'
import './IssueReportView.css'

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}
function formatDateTime(iso) {
  try { return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) }
  catch { return iso }
}

function countByStatus(reports, statuses) {
  return reports.filter(r => statuses.includes(r.status)).length
}

// ─── Status & Severity Pills ─────────────────────────────────────────────────
function StatusPill({ status }) {
  return <span className={`ir-status-pill ir-status-${status}`}>{status}</span>
}
function SeverityBadge({ severity }) {
  return <span className={`ir-severity-badge ir-sev-${severity}`}>{severity}</span>
}
function CategoryBadge({ category }) {
  return <span className="ir-category-badge">{category}</span>
}

// ─── Report Detail (admin) ───────────────────────────────────────────────────
function AdminReportDetail({ report, onBack, onUpdated }) {
  const allowedTransitions = STATUS_TRANSITIONS[report.status] || []
  const isTerminal = allowedTransitions.length === 0

  const [newStatus, setNewStatus]       = useState(report.status)
  const [adminResponse, setAdminResponse] = useState(report.adminResponse || '')
  const [saving, setSaving]             = useState(false)
  const [saveMsg, setSaveMsg]           = useState('')
  const [imgOpen, setImgOpen]           = useState(false)

  const statusChanged = newStatus !== report.status
  const responseChanged = adminResponse.trim() !== (report.adminResponse || '').trim()
  const hasChanges = statusChanged || responseChanged

  const handleSave = () => {
    if (!hasChanges || saving) return
    if (statusChanged && !allowedTransitions.includes(newStatus)) return
    setSaving(true)

    const now = new Date().toISOString()
    const patch = {
      adminResponse: adminResponse.trim() || null,
    }

    if (statusChanged) {
      patch.status = newStatus
      patch.statusHistoryEntry = {
        status: newStatus,
        timestamp: now,
        note: adminResponse.trim() || undefined,
      }
    }

    const updated = updateReport(report.id, patch)

    // Notify the student about the status change
    if (statusChanged) {
      addNotificationForUser(report.reporterEmail, {
        title: `Report ${newStatus === 'Resolved' ? 'Resolved' : 'Updated'}`,
        message: `Your report "${report.title}" (${report.id}) has been updated to: ${newStatus}.${adminResponse.trim() ? ` Admin note: "${adminResponse.trim().slice(0, 80)}"` : ''}`,
        category: 'announcement',
        eventKey: `report_status_${report.id}_${newStatus}`,
        actionLabel: 'View My Reports',
        actionPage: 'dashboard',
      })
    } else if (responseChanged && adminResponse.trim()) {
      addNotificationForUser(report.reporterEmail, {
        title: 'Admin Added a Response',
        message: `A response was added to your report "${report.title}": "${adminResponse.trim().slice(0, 80)}"`,
        category: 'announcement',
        eventKey: `report_response_${report.id}_${now}`,
        actionLabel: 'View My Reports',
        actionPage: 'dashboard',
      })
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('plateSyncNotifUpdate'))
    }

    setSaving(false)
    setSaveMsg('Changes saved.')
    setTimeout(() => setSaveMsg(''), 3000)
    if (onUpdated) onUpdated(updated)
  }

  return (
    <div className="ir-detail">
      <button className="ir-detail-back" onClick={onBack}>← Back to Issue Reports</button>

      {/* Reporter info (non-sensitive) */}
      <dl className="ir-reporter-card">
        <div className="ir-reporter-field"><dt>Student</dt><dd>{report.reporterName}</dd></div>
        <div className="ir-reporter-field"><dt>Roll No</dt><dd>{report.reporterRollNo || '—'}</dd></div>
        <div className="ir-reporter-field"><dt>Hostel</dt><dd>{report.hostel}</dd></div>
        <div className="ir-reporter-field"><dt>Submitted</dt><dd>{formatDateTime(report.createdAt)}</dd></div>
      </dl>

      <div className="ir-detail-header">
        <div className="ir-detail-header-top">
          <div>
            <p className="ir-detail-id">{report.id}</p>
            <h3 className="ir-detail-title">{report.title}</h3>
          </div>
          <div className="ir-detail-badges">
            <StatusPill status={report.status} />
            <SeverityBadge severity={report.severity} />
          </div>
        </div>
        <dl className="ir-detail-grid">
          <div className="ir-detail-field"><dt>Category</dt><dd><CategoryBadge category={report.category} /></dd></div>
          <div className="ir-detail-field"><dt>Related Meal</dt><dd>{report.relatedMeal}</dd></div>
          <div className="ir-detail-field"><dt>Incident Date</dt><dd>{formatDate(report.incidentDate)}</dd></div>
          <div className="ir-detail-field"><dt>Last Updated</dt><dd>{formatDateTime(report.updatedAt)}</dd></div>
        </dl>
      </div>

      {/* Description */}
      <div className="ir-detail-desc-card">
        <h4>Description</h4>
        <p>{report.description}</p>
        {report.attachmentDataUrl && (
          <div className="ir-detail-attachment">
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
              <FontAwesomeIcon icon={faPaperclip} style={{ marginRight: 6 }} />
              Attached photo:
            </p>
            <img src={report.attachmentDataUrl} alt="Attached" onClick={() => setImgOpen(true)} style={{ cursor: 'zoom-in' }} />
          </div>
        )}
      </div>

      {/* Admin update panel */}
      {!isTerminal && (
        <div className="ir-admin-update">
          <h4>Update Report</h4>
          <div className="ir-admin-update-grid">
            <div className="ir-field">
              <label htmlFor="admin-new-status">Change status to</label>
              <select id="admin-new-status" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
                <option value={report.status}>{report.status} (current)</option>
                {allowedTransitions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="ir-field">
              <label htmlFor="admin-response">Admin response / resolution note (optional)</label>
              <textarea
                id="admin-response"
                value={adminResponse}
                onChange={e => setAdminResponse(e.target.value)}
                placeholder="Add a note for the student…"
              />
            </div>
          </div>
          <div className="ir-admin-update-actions">
            <button
              className="primary-button"
              onClick={handleSave}
              disabled={!hasChanges || saving}
              id="admin-save-report-btn"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            {saveMsg && (
              <span style={{ fontSize: 13, color: 'var(--accent)' }}>
                <FontAwesomeIcon icon={faCircleCheck} style={{ marginRight: 5 }} />
                {saveMsg}
              </span>
            )}
          </div>
        </div>
      )}

      {isTerminal && (
        <div className="notice" style={{ marginBottom: 16 }}>
          This report is <strong>{report.status}</strong> — no further status changes are possible.
        </div>
      )}

      {/* Current admin response */}
      {report.adminResponse && (
        <div className="ir-admin-response">
          <h4>
            <FontAwesomeIcon icon={faCommentDots} style={{ marginRight: 6 }} />
            Current Admin Response
          </h4>
          <p>{report.adminResponse}</p>
        </div>
      )}

      {/* Status history */}
      <div className="ir-timeline">
        <h4>Status History</h4>
        <div className="ir-timeline-list">
          {(report.statusHistory || []).map((entry, i) => (
            <div key={i} className="ir-timeline-entry">
              <div className="ir-timeline-dot" />
              <div className="ir-timeline-content">
                <div className="ir-timeline-status">{entry.status}</div>
                <div className="ir-timeline-time">{formatDateTime(entry.timestamp)}</div>
                {entry.note && <div className="ir-timeline-note">"{entry.note}"</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {imgOpen && (
        <div
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setImgOpen(false)}
          role="dialog"
          aria-label="Full size photo"
        >
          <img src={report.attachmentDataUrl} alt="Full size" style={{ maxWidth:'92vw', maxHeight:'92vh', borderRadius:10 }} />
        </div>
      )}
    </div>
  )
}

// ─── Admin Report List ───────────────────────────────────────────────────────
function AdminReportList({ reports, onSelect }) {
  const [filterStatus,   setFilterStatus]   = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterSeverity, setFilterSeverity] = useState('')
  const [filterHostel,   setFilterHostel]   = useState('')

  const filtered = reports.filter(r => {
    if (filterStatus   && r.status   !== filterStatus)   return false
    if (filterCategory && r.category !== filterCategory) return false
    if (filterSeverity && r.severity !== filterSeverity) return false
    if (filterHostel   && !r.hostel?.toLowerCase().includes(filterHostel.toLowerCase())) return false
    return true
  })

  const clearFilters = () => { setFilterStatus(''); setFilterCategory(''); setFilterSeverity(''); setFilterHostel('') }
  const hasFilters = filterStatus || filterCategory || filterSeverity || filterHostel

  return (
    <div>
      {/* Stats */}
      <div className="ir-stats">
        <div className="ir-stat-card">
          <strong>{reports.length}</strong>
          <span>Total Reports</span>
        </div>
        <div className="ir-stat-card">
          <strong>{countByStatus(reports, OPEN_STATUSES)}</strong>
          <span>Open</span>
        </div>
        <div className="ir-stat-card ir-stat-urgent">
          <strong>{reports.filter(r => r.severity === 'Urgent').length}</strong>
          <span>Urgent</span>
        </div>
        <div className="ir-stat-card">
          <strong>{countByStatus(reports, CLOSED_STATUSES)}</strong>
          <span>Closed</span>
        </div>
      </div>

      {/* Filters */}
      <div className="ir-admin-filters">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All statuses</option>
          {ALL_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} aria-label="Filter by category">
          <option value="">All categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} aria-label="Filter by severity">
          <option value="">All severities</option>
          {SEVERITIES.map(s => <option key={s}>{s}</option>)}
        </select>
        <input
          type="text"
          value={filterHostel}
          onChange={e => setFilterHostel(e.target.value)}
          placeholder="Hostel…"
          aria-label="Filter by hostel"
          style={{ maxWidth: 130 }}
        />
        {hasFilters && (
          <button onClick={clearFilters}>Clear filters</button>
        )}
      </div>

      {/* Disclaimer */}
      <p className="ir-disclaimer">
        <FontAwesomeIcon icon={faCircleInfo} style={{ marginRight: 6 }} />
        Reports are stored locally in this browser. In this shared demo session (same browser), all student reports are visible to the admin. Cross-device sync and real-time updates require a backend.
      </p>

      {/* Report rows */}
      {filtered.length === 0 ? (
        <div className="ir-empty">
          <span className="ir-empty-icon">
            <FontAwesomeIcon icon={reports.length === 0 ? faInbox : faMagnifyingGlass} />
          </span>
          <h3>{reports.length === 0 ? 'No reports yet' : 'No reports match these filters'}</h3>
          <p>{reports.length === 0 ? 'Students can file issue reports from their dashboard.' : 'Try adjusting the filters above.'}</p>
        </div>
      ) : (
        <div className="ir-admin-list">
          {filtered.map(r => (
            <div
              key={r.id}
              className="ir-admin-row"
              data-severity={r.severity}
              onClick={() => onSelect(r.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onSelect(r.id)}
              aria-label={`Open report: ${r.title}`}
            >
              <div className="ir-admin-row-main">
                <div className="ir-admin-row-title">
                  {r.severity === 'Urgent' && (
                    <FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: 6, color: 'var(--red, #c0392b)' }} />
                  )}
                  {r.title}
                </div>
                <div className="ir-admin-row-sub">
                  <span>{r.reporterName}</span>
                  <span>·</span>
                  <span>{r.hostel}</span>
                  <span>·</span>
                  <span>{formatDate(r.incidentDate)}</span>
                  <span>·</span>
                  <span style={{ fontFamily: 'monospace', fontSize: 10 }}>{r.id}</span>
                </div>
              </div>
              <div className="ir-admin-row-badges">
                <CategoryBadge category={r.category} />
                <SeverityBadge severity={r.severity} />
                <StatusPill status={r.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function AdminIssueView({ user: _user }) {
  const [reports, setReports] = useState(() => getAllReports())
  const [selectedId, setSelectedId] = useState(null)

  const refreshReports = useCallback(() => {
    setReports(getAllReports())
  }, [])

  const selectedReport = reports.find(r => r.id === selectedId)

  if (selectedId && selectedReport) {
    return (
      <AdminReportDetail
        report={selectedReport}
        onBack={() => { setSelectedId(null); refreshReports() }}
        onUpdated={(updated) => {
          setReports(prev => prev.map(r => r.id === updated.id ? updated : r))
        }}
      />
    )
  }

  return (
    <div>
      <div className="ir-topbar">
        <div>
          <p className="section-label">MESS ADMIN · PLATESYNC PORTAL</p>
          <h2 style={{ margin: 0, fontSize: 22, color: 'var(--text-primary)' }}>Issue Reports</h2>
        </div>
        <button className="secondary-button" onClick={refreshReports} style={{ fontSize: 13 }}>
          ↻ Refresh
        </button>
      </div>
      <AdminReportList
        reports={reports}
        onSelect={(id) => setSelectedId(id)}
      />
    </div>
  )
}
