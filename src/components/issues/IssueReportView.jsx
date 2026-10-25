import { useCallback, useRef, useState } from 'react'
import {
  addReport,
  getStudentReports,
  notifyAdminsOnNewReport,
  CATEGORIES,
  SEVERITIES,
  MEALS,
  OPEN_STATUSES,
  CLOSED_STATUSES,
} from '../../utils/reportsStorage'
import { useNotifications } from '../../context/NotificationContext'
import './IssueReportView.css'

// ─── Helpers ────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}

function formatDateTime(iso) {
  try { return new Date(iso).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) }
  catch { return iso }
}

const FILTER_TABS = ['All', 'Open', 'Resolved']

function filterReports(reports, tab) {
  if (tab === 'Open') return reports.filter(r => OPEN_STATUSES.includes(r.status))
  if (tab === 'Resolved') return reports.filter(r => CLOSED_STATUSES.includes(r.status))
  return reports
}

// ─── Sub-view: Report Form ───────────────────────────────────────────────────
function ReportForm({ user, onSuccess, onCancel }) {
  const { addNotification } = useNotifications()
  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    relatedMeal: 'Not applicable',
    incidentDate: todayStr(),
    severity: 'Low',
  })
  const [attachment, setAttachment] = useState(null) // { name, dataUrl }
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)
  const isDirty = form.category || form.title || form.description || attachment

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, attachment: 'Only image files are allowed.' }))
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, attachment: 'Image must be smaller than 2 MB.' }))
      return
    }
    setErrors(prev => ({ ...prev, attachment: null }))
    const reader = new FileReader()
    reader.onload = (ev) => setAttachment({ name: file.name, dataUrl: ev.target.result })
    reader.readAsDataURL(file)
  }

  const validate = () => {
    const errs = {}
    if (!form.category) errs.category = 'Please select a category.'
    if (!form.title.trim()) errs.title = 'Please enter a short title.'
    if (form.title.length > 100) errs.title = 'Title must be 100 characters or fewer.'
    if (!form.description.trim()) errs.description = 'Please describe the issue.'
    if (form.description.trim().length < 20) errs.description = 'Please provide at least 20 characters.'
    if (form.description.length > 1000) errs.description = 'Description must be 1000 characters or fewer.'
    if (!form.incidentDate) errs.incidentDate = 'Please select the date of the incident.'
    if (form.incidentDate > todayStr()) errs.incidentDate = 'Incident date cannot be in the future.'
    return errs
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    if (submitting) return
    setSubmitting(true)
    setErrors({})

    setTimeout(() => {
      const report = addReport({
        reporterEmail: user?.email || '',
        reporterName: user?.fullName || user?.name || 'Student',
        reporterRollNo: user?.rollNo || '',
        hostel: user?.hostel || '',
        category: form.category,
        title: form.title.trim(),
        description: form.description.trim(),
        relatedMeal: form.relatedMeal,
        incidentDate: form.incidentDate,
        severity: form.severity,
        attachmentDataUrl: attachment?.dataUrl || null,
        attachmentName: attachment?.name || null,
      })

      // Notify the student
      addNotification({
        title: 'Report Submitted',
        message: `Your report "${report.title}" has been filed successfully. Reference: ${report.id}`,
        category: 'announcement',
        eventKey: `report_submit_${report.id}`,
        actionLabel: 'View My Reports',
        actionPage: 'dashboard',
      })

      // Notify the mess admin(s)
      notifyAdminsOnNewReport(report)

      setSubmitting(false)
      onSuccess(report)
    }, 400)
  }

  const handleReset = () => {
    if (isDirty && !window.confirm('Discard this report? Any entered information will be lost.')) return
    setForm({ category: '', title: '', description: '', relatedMeal: 'Not applicable', incidentDate: todayStr(), severity: 'Low' })
    setAttachment(null)
    setErrors({})
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const field = (name) => ({
    className: `ir-field${errors[name] ? ' ir-field--error' : ''}`,
  })

  const descLen = form.description.length
  const descClass = descLen > 1000 ? 'ir-char-over' : descLen > 900 ? 'ir-char-warn' : ''

  return (
    <form className="ir-form" onSubmit={handleSubmit} noValidate id="issue-report-form">
      <div className="ir-topbar">
        <h2>📋 New Report</h2>
        <div className="ir-topbar-actions">
          <button type="button" className="secondary-button" onClick={() => { if (isDirty && !window.confirm('Discard this report?')) return; onCancel() }}>
            Cancel
          </button>
        </div>
      </div>

      <p className="ir-disclaimer">
        ℹ️ Your hostel and identity are taken from your profile. Reports are stored locally in this browser — cross-device sync requires a backend.
      </p>

      <div className="ir-form-grid">

        {/* Category */}
        <div {...field('category')}>
          <label htmlFor="ir-category">
            Issue category <span style={{ color: '#b9423b' }}>*</span>
          </label>
          <select id="ir-category" value={form.category} onChange={set('category')} required>
            <option value="">Select category</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
          {errors.category && <span className="ir-field-error">{errors.category}</span>}
        </div>

        {/* Severity */}
        <div className="ir-field">
          <label htmlFor="ir-severity">Severity</label>
          <select id="ir-severity" value={form.severity} onChange={set('severity')}>
            {SEVERITIES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        {/* Title */}
        <div {...field('title')} className={`ir-field ir-field-full${errors.title ? ' ir-field--error' : ''}`}>
          <label htmlFor="ir-title">
            Issue title <span style={{ color: '#b9423b' }}>*</span>
            <span className="ir-field-hint"> — short summary (max 100 chars)</span>
          </label>
          <input
            id="ir-title"
            type="text"
            value={form.title}
            onChange={set('title')}
            placeholder="e.g. Rice was undercooked at dinner"
            maxLength={110}
            required
          />
          {errors.title && <span className="ir-field-error">{errors.title}</span>}
        </div>

        {/* Description */}
        <div className={`ir-field ir-field-full${errors.description ? ' ir-field--error' : ''}`}>
          <label htmlFor="ir-description">
            Description <span style={{ color: '#b9423b' }}>*</span>
            <span className="ir-field-hint"> — 20 to 1000 characters</span>
          </label>
          <textarea
            id="ir-description"
            value={form.description}
            onChange={set('description')}
            placeholder="Describe what happened, when, and any other relevant details…"
            required
          />
          <span className={`ir-char-count ${descClass}`}>{descLen} / 1000</span>
          {errors.description && <span className="ir-field-error">{errors.description}</span>}
        </div>

        {/* Hostel — read-only */}
        <div className="ir-field">
          <label htmlFor="ir-hostel">Hostel / Mess</label>
          <input id="ir-hostel" type="text" value={user?.hostel || '—'} readOnly />
        </div>

        {/* Related meal */}
        <div className="ir-field">
          <label htmlFor="ir-meal">Related meal</label>
          <select id="ir-meal" value={form.relatedMeal} onChange={set('relatedMeal')}>
            {MEALS.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>

        {/* Incident date */}
        <div className={`ir-field${errors.incidentDate ? ' ir-field--error' : ''}`}>
          <label htmlFor="ir-date">Date of incident</label>
          <input
            id="ir-date"
            type="date"
            value={form.incidentDate}
            max={todayStr()}
            onChange={set('incidentDate')}
          />
          {errors.incidentDate && <span className="ir-field-error">{errors.incidentDate}</span>}
        </div>

        {/* Photo attachment */}
        <div className={`ir-field${errors.attachment ? ' ir-field--error' : ''}`}>
          <label>Photo (optional, max 2 MB)</label>
          <div className="ir-file-wrap" onClick={() => fileInputRef.current?.click()} role="button" tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} aria-label="Upload photo" />
            {attachment ? '📎 Photo attached — click to change' : '📷 Click to attach a photo'}
          </div>
          {errors.attachment && <span className="ir-field-error">{errors.attachment}</span>}
          {attachment && (
            <div className="ir-file-preview">
              <img src={attachment.dataUrl} alt="Attachment preview" />
              <span>{attachment.name}</span>
              <button type="button" className="ir-file-remove" onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = '' }} aria-label="Remove attachment">✕</button>
            </div>
          )}
        </div>

      </div>

      <div className="ir-form-actions">
        <button type="submit" className="primary-button" disabled={submitting} id="ir-submit-btn">
          {submitting ? 'Submitting…' : 'Submit Report →'}
        </button>
        <button type="button" className="secondary-button" onClick={handleReset}>
          Reset
        </button>
      </div>
    </form>
  )
}

// ─── Sub-view: Report List ───────────────────────────────────────────────────
function ReportList({ reports, onSelect, onNewReport }) {
  const [filter, setFilter] = useState('All')
  const visible = filterReports(reports, filter)

  return (
    <div>
      <div className="ir-topbar">
        <h2>📁 My Reports</h2>
        <button className="primary-button" onClick={onNewReport} id="ir-new-report-btn">
          + New Report
        </button>
      </div>

      <div className="ir-filters" role="tablist">
        {FILTER_TABS.map(tab => {
          const count = filterReports(reports, tab).length
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={filter === tab}
              className={`ir-filter-btn${filter === tab ? ' ir-filter-active' : ''}`}
              onClick={() => setFilter(tab)}
            >
              {tab}
              {count > 0 && <span className="ir-filter-count">{count}</span>}
            </button>
          )
        })}
      </div>

      {visible.length === 0 ? (
        <div className="ir-empty">
          <span className="ir-empty-icon">📭</span>
          <h3>{filter === 'All' ? 'No reports yet' : `No ${filter.toLowerCase()} reports`}</h3>
          <p>{filter === 'All' ? 'Submit a report to flag a mess issue. It will appear here.' : `You have no ${filter.toLowerCase()} reports at the moment.`}</p>
        </div>
      ) : (
        <div className="ir-cards">
          {visible.map(r => (
            <article
              key={r.id}
              className="ir-card"
              data-severity={r.severity}
              onClick={() => onSelect(r.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && onSelect(r.id)}
              aria-label={`View report: ${r.title}`}
            >
              <div className="ir-card-top">
                <span className="ir-card-title">{r.title}</span>
                <span className={`ir-status-pill ir-status-${r.status}`}>{r.status}</span>
              </div>
              <div className="ir-card-meta">
                <span className="ir-category-badge">{r.category}</span>
                <span className={`ir-severity-badge ir-sev-${r.severity}`}>{r.severity}</span>
                <span className="ir-card-date">📅 {formatDate(r.incidentDate)}</span>
                <span className="ir-card-id">{r.id}</span>
              </div>
              {r.adminResponse && (
                <p style={{ fontSize: 12, color: 'var(--notice-text)', margin: 0 }}>
                  💬 Admin replied: {r.adminResponse.slice(0, 80)}{r.adminResponse.length > 80 ? '…' : ''}
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sub-view: Report Detail ─────────────────────────────────────────────────
function ReportDetail({ report, onBack }) {
  const [imgOpen, setImgOpen] = useState(false)

  if (!report) return null
  return (
    <div className="ir-detail">
      <button className="ir-detail-back" onClick={onBack}>← Back to My Reports</button>

      <div className="ir-detail-header">
        <div className="ir-detail-header-top">
          <div>
            <p className="ir-detail-id">{report.id}</p>
            <h3 className="ir-detail-title">{report.title}</h3>
          </div>
          <div className="ir-detail-badges">
            <span className={`ir-status-pill ir-status-${report.status}`}>{report.status}</span>
            <span className={`ir-severity-badge ir-sev-${report.severity}`}>{report.severity}</span>
          </div>
        </div>
        <dl className="ir-detail-grid">
          <div className="ir-detail-field"><dt>Category</dt><dd>{report.category}</dd></div>
          <div className="ir-detail-field"><dt>Hostel</dt><dd>{report.hostel}</dd></div>
          <div className="ir-detail-field"><dt>Related Meal</dt><dd>{report.relatedMeal}</dd></div>
          <div className="ir-detail-field"><dt>Incident Date</dt><dd>{formatDate(report.incidentDate)}</dd></div>
          <div className="ir-detail-field"><dt>Submitted</dt><dd>{formatDateTime(report.createdAt)}</dd></div>
          <div className="ir-detail-field"><dt>Last Updated</dt><dd>{formatDateTime(report.updatedAt)}</dd></div>
        </dl>
      </div>

      {/* Description */}
      <div className="ir-detail-desc-card">
        <h4>Description</h4>
        <p>{report.description}</p>
        {report.attachmentDataUrl && (
          <div className="ir-detail-attachment">
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>📎 Attached photo:</p>
            <img
              src={report.attachmentDataUrl}
              alt="Attached photo"
              onClick={() => setImgOpen(true)}
              style={{ cursor: 'zoom-in' }}
            />
          </div>
        )}
      </div>

      {/* Admin response */}
      {report.adminResponse && (
        <div className="ir-admin-response">
          <h4>💬 Admin Response</h4>
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
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setImgOpen(false)}
          role="dialog"
          aria-label="Full size photo"
        >
          <img src={report.attachmentDataUrl} alt="Full size" style={{ maxWidth: '92vw', maxHeight: '92vh', borderRadius: 10 }} />
        </div>
      )}
    </div>
  )
}

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function IssueReportView({ user }) {
  const [subView, setSubView] = useState('list')  // 'form' | 'list' | 'detail'
  const [reports, setReports] = useState(() => getStudentReports(user?.email))
  const [selectedId, setSelectedId] = useState(null)
  const [successReport, setSuccessReport] = useState(null)

  const refreshReports = useCallback(() => {
    setReports(getStudentReports(user?.email))
  }, [user?.email])

  const handleSuccess = (report) => {
    setSuccessReport(report)
    refreshReports()
    setSubView('list')
    // Clear success banner after 6s
    setTimeout(() => setSuccessReport(null), 6000)
  }

  const selectedReport = reports.find(r => r.id === selectedId)

  if (subView === 'form') {
    return <ReportForm user={user} onSuccess={handleSuccess} onCancel={() => { refreshReports(); setSubView('list') }} />
  }

  if (subView === 'detail') {
    return (
      <ReportDetail
        report={selectedReport}
        onBack={() => { refreshReports(); setSubView('list'); setSelectedId(null) }}
      />
    )
  }

  // list
  return (
    <div>
      {successReport && (
        <div className="ir-success">
          <span className="ir-success-icon">✅</span>
          <div>
            <h3>Report submitted successfully!</h3>
            <p>Reference ID: <code>{successReport.id}</code>. The mess admin will review your report shortly.</p>
          </div>
        </div>
      )}
      <ReportList
        reports={reports}
        onSelect={(id) => { setSelectedId(id); setSubView('detail') }}
        onNewReport={() => setSubView('form')}
      />
    </div>
  )
}
