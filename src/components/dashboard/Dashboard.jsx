import { useEffect, useMemo, useRef, useState } from 'react'
import MealCard from '../shared/MealCard'
import { useNotifications } from '../../context/NotificationContext'
import { syncAdminReportNotifications } from '../../utils/reportsStorage'
import {
  DEFAULT_MEALS,
  getMealsForToday,
  getNextEligibleMeal,
  getMealTimes,
  getAttendancePeriodInfo,
  saveMealMenu,
  parseDishesFromMenu,
  getDishNutrition,
  saveDishNutrition,
  COMMON_ALLERGENS,
  getAllMenuDishes,
} from '../../utils/menuStorage'
import {
  getAllLiveDemand,
  DEFAULT_BOOKINGS,
} from '../../utils/attendanceStorage'
import IssueReportView from '../issues/IssueReportView'
import AdminIssueView from '../issues/AdminIssueView'
import './Dashboard.css'

const studentTabs = ['Today\u2019s meals', 'My attendance', 'My impact', 'Report issue']
const adminTabs   = ['Live demand', 'Mark attendance', 'Menu management', 'Waste analysis', 'Issue reports']

// A booking is possible only during the 45 minutes before a meal starts.
function getBookingInfo(meal, now) {
  const [hour, minute] = meal.startTime.split(':').map(Number)
  const mealStart = new Date(now)
  mealStart.setHours(hour, minute, 0, 0)
  const bookingStart = new Date(mealStart.getTime() - 45 * 60 * 1000)
  if (now < bookingStart) return { open: false, message: `Booking opens at ${formatTime(bookingStart)} (45 minutes before the meal).` }
  if (now >= mealStart) return { open: false, message: 'Booking is closed because this meal has started.' }
  const minutesLeft = Math.ceil((mealStart - now) / 60000)
  return { open: true, message: `Booking is open now. ${minutesLeft} minutes left to confirm.` }
}
function formatTime(time) { return time.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) }

// Build a stable event key for today's booking/cancel event
function todayBookingKey(user, mealId, action) {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  return `${user?.email}_${mealId}_${action}_${today}`
}

export default function Dashboard({ user, onHome, onLogout: _onLogout }) {
  const [bookings, setBookings] = useState(() => JSON.parse(localStorage.getItem('plateSyncBookings')) || [])
  const [activeTab, setActiveTab] = useState(user?.role === 'admin' ? 'Live demand' : 'Today\u2019s meals')
  const [message, setMessage] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [todayMeals, setTodayMeals] = useState(() => getMealsForToday(new Date()))

  useEffect(() => localStorage.setItem('plateSyncBookings', JSON.stringify(bookings)), [bookings])
  useEffect(() => {
    const clock = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)
      setTodayMeals(getMealsForToday(now))
    }, 30000)
    return () => clearInterval(clock)
  }, [])

  // Listen for live menu updates dispatched by the Admin
  useEffect(() => {
    const handleMenuUpdate = () => {
      setTodayMeals(getMealsForToday(new Date()))
    }
    window.addEventListener('plateSyncMenuUpdate', handleMenuUpdate)
    window.addEventListener('storage', handleMenuUpdate)
    return () => {
      window.removeEventListener('plateSyncMenuUpdate', handleMenuUpdate)
      window.removeEventListener('storage', handleMenuUpdate)
    }
  }, [])

  // Notifications
  const { addNotification } = useNotifications()

  // Seed one-time welcome notification for new users
  const welcomeSeeded = useRef(false)
  useEffect(() => {
    if (!user || welcomeSeeded.current) return
    welcomeSeeded.current = true
    if (user.role === 'student') {
      addNotification({
        title: 'Welcome to PlateSync!',
        message: `Hi ${user.fullName?.split(' ')[0] || 'there'}! Book your meals in the 45-minute window before each serving to help reduce food waste.`,
        category: 'general',
        eventKey: `welcome_${user.email}`,
        actionLabel: 'View Today\'s Meals',
        actionPage: 'dashboard',
      })
      addNotification({
        title: 'Booking Reminder',
        message: 'Meal bookings open 45 minutes before each meal. Next: Breakfast opens at 7:15 AM, Lunch at 11:45 AM.',
        category: 'reminder',
        eventKey: `booking_reminder_${user.email}_first`,
      })
    } else if (user.role === 'admin') {
      syncAdminReportNotifications(user.email)
      addNotification({
        title: 'Admin Dashboard Active',
        message: `Welcome, ${user.fullName?.split(' ')[0] || 'Admin'}! Live demand data is ready. Use the Mark Attendance tab to track meal service.`,
        category: 'general',
        eventKey: `admin_welcome_${user.email}`,
        actionLabel: 'View Live Demand',
        actionPage: 'dashboard',
      })
      addNotification({
        title: 'Menu Update Published',
        message: "Today's menu has been confirmed: Breakfast — Mix Parantha, Lunch — Soya Chaap, Snacks — Pasta, Dinner — Hari Dal.",
        category: 'menu',
        eventKey: `menu_update_${user.email}_${new Date().toISOString().slice(0, 10)}`,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email])

  if (!user) return <section className="page-container"><h1 className="page-title">Please create an account first.</h1><button className="primary-button" onClick={onHome}>Go home</button></section>

  const changeBooking = (id) => {
    const meal = todayMeals.find(item => item.id === id)
    if (!getBookingInfo(meal, new Date()).open) {
      setMessage('This booking window is closed. You can only book in the 45 minutes before serving starts.')
      return
    }
    const exists = bookings.includes(id)
    setBookings(exists ? bookings.filter(item => item !== id) : [...bookings, id])
    setMessage(exists ? 'Booking cancelled. The mess can update its estimate.' : 'Meal booked! Your plate is included in the demand estimate.')

    if (exists) {
      addNotification({
        title: `${meal.name} Booking Cancelled`,
        message: `Your ${meal.name.toLowerCase()} booking has been cancelled. The mess demand estimate has been updated.`,
        category: 'booking',
        eventKey: todayBookingKey(user, id, 'cancel_' + Date.now()),
        actionLabel: 'View Dashboard',
        actionPage: 'dashboard',
      })
    } else {
      addNotification({
        title: `${meal.name} Booked Successfully`,
        message: `You've confirmed your ${meal.name.toLowerCase()} — ${meal.time}. Your plate is counted in today's demand estimate.`,
        category: 'booking',
        eventKey: todayBookingKey(user, id, 'book'),
        actionLabel: 'View Dashboard',
        actionPage: 'dashboard',
      })
    }
  }

  const tabs = user.role === 'admin' ? adminTabs : studentTabs
  return (
    <section className="page-container dashboard">
      <div className="dashboard-welcome">
        <div>
          <p className="section-label">CHITKARA MESS · PLATESYNC PORTAL</p>
          <h1 className="page-title">Hello, {user.fullName || 'Student'}!</h1>
          <p className="page-description">{user.role === 'admin' ? 'Use today\'s demand to prepare food with less waste.' : `Your decisions help reduce excess cooking in ${user.hostel}.`}</p>
        </div>
        <div className="user-card">
          <b>{user.role === 'admin' ? `Mess ID: ${user.messId}` : user.rollNo}</b>
          <span>{user.hostel}{user.role === 'admin' ? ` · Staff: ${user.staffId}` : ` · Room ${user.room}`}</span>
        </div>
      </div>
      <div className="dashboard-tabs" role="tablist">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={activeTab === tab ? 'selected' : ''}>
            {tab}
          </button>
        ))}
      </div>
      {user.role === 'admin'
        ? <AdminView activeTab={activeTab} user={user} currentTime={currentTime} />
        : <StudentView activeTab={activeTab} bookings={bookings} message={message} onBook={changeBooking} currentTime={currentTime} user={user} meals={todayMeals} />
      }
    </section>
  )
}

function StudentView({ activeTab, bookings, message, onBook, currentTime, user, meals }) {
  const savedFood = useMemo(() => (bookings.length * 0.35).toFixed(2), [bookings])
  if (activeTab === 'My attendance') return <Attendance bookings={bookings} meals={meals} />
  if (activeTab === 'My impact') return <section className="impact-view"><p className="section-label">YOUR RESPONSIBILITY SCORE</p><h2>Every booking makes a difference.</h2><div className="impact-score"><strong>{Math.min(100, 80 + bookings.length * 5)}<small>/100</small></strong><p>Your score grows when you book thoughtfully and attend your confirmed meals.</p></div><div className="summary-grid"><Summary title="MEALS BOOKED" value={`${bookings.length} / 4`} detail="for today"/><Summary title="ESTIMATED FOOD SAVED" value={`${savedFood} kg`} detail="from your bookings"/><Summary title="DAILY HOSTEL TARGET" value="194 kg" detail="average waste to reduce"/></div></section>
  if (activeTab === 'Report issue') return <IssueReportView user={user} />
  return <><div className="summary-grid"><Summary title="MEALS BOOKED" value={`${bookings.length} / 4`} detail="for today"/><Summary title="ESTIMATED FOOD SAVED" value={`${savedFood} kg`} detail="based on your bookings"/><Summary title="BOOKING WINDOW" value="45 min" detail="only before the meal starts"/></div>{message && <p className="notice">{message}</p>}<div className="dashboard-head"><div><p className="section-label">TODAY'S MESS MENU</p><h2>Choose meals responsibly</h2></div><p>Real-time booking opens only during the 45 minutes before each meal.</p></div><div className="dashboard-meals">{meals.map(meal => <MealCard key={meal.id} meal={meal} booked={bookings.includes(meal.id)} onBook={onBook} bookingInfo={getBookingInfo(meal, currentTime)} />)}</div></>
}

function Attendance({ bookings, meals = DEFAULT_MEALS }) {
  const [periodInfo, setPeriodInfo] = useState(() => getAttendancePeriodInfo(new Date()))
  const [diffSeconds, setDiffSeconds] = useState(() => {
    const info = getAttendancePeriodInfo(new Date())
    return Math.max(0, Math.floor((info.targetTime.getTime() - Date.now()) / 1000))
  })

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const info = getAttendancePeriodInfo(now)
      setPeriodInfo(info)
      const remaining = Math.max(0, Math.floor((info.targetTime.getTime() - now.getTime()) / 1000))
      setDiffSeconds(remaining)
    }

    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])

  const hours = String(Math.floor(diffSeconds / 3600)).padStart(2, '0')
  const minutes = String(Math.floor((diffSeconds % 3600) / 60)).padStart(2, '0')
  const seconds = String(diffSeconds % 60).padStart(2, '0')

  return (
    <section className="attendance-view">
      <p className="section-label">ATTENDANCE CHECK-IN</p>
      <h2>Your meal attendance</h2>
      <p>Show your booking at the mess counter. The staff marks you as attended during the meal period.</p>

      <div className="timer-card">
        <span>{periodInfo.label}</span>
        <strong>{hours}:{minutes}:{seconds}</strong>
        <small>{periodInfo.detail}</small>
      </div>

      <div className="attendance-list">
        {meals.map(meal => {
          const isBooked = bookings.includes(meal.id)
          const isCurrentActive = periodInfo.status === 'active' && periodInfo.meal.id === meal.id

          return (
            <div key={meal.id} style={isCurrentActive ? { borderColor: 'var(--accent)', background: 'rgba(19, 122, 80, 0.08)' } : undefined}>
              <span>
                <strong>{meal.name}</strong>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>({meal.time})</span>
                {isCurrentActive && <span style={{ marginLeft: 8, fontSize: 11, background: '#137a50', color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>Serving Now</span>}
              </span>
              <b className={isBooked ? 'confirmed' : 'pending'}>
                {isBooked ? 'Confirmed — show at counter' : 'Not booked'}
              </b>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function AdminView({ activeTab, user, currentTime }) {
  const [attendance, setAttendance] = useState(0)
  const [rollNo, setRollNo] = useState('')
  const [notice, setNotice] = useState('')
  const { addNotification } = useNotifications()

  const markAttendance = (event) => {
    event.preventDefault()
    if (!rollNo.trim()) return
    setAttendance(attendance + 1)
    setNotice(`${rollNo} marked as attended.`)
    addNotification({
      title: 'Attendance Marked',
      message: `Student ${rollNo.trim()} has been marked as attended for today's meal.`,
      category: 'announcement',
      eventKey: `attendance_${user?.email}_${rollNo.trim()}_${Date.now()}`,
    })
    setRollNo('')
  }

  if (activeTab === 'Issue reports') return <AdminIssueView user={user} />
  if (activeTab === 'Menu management') return <AdminMenuManagement currentTime={currentTime} user={user} />
  if (activeTab === 'Mark attendance') return <section className="admin-form"><p className="section-label">MESS STAFF ACTION</p><h2>Mark student attendance</h2><p>Enter the student roll number after serving their booked meal.</p><form onSubmit={markAttendance}><label>Student roll number<input value={rollNo} onChange={event => setRollNo(event.target.value)} placeholder="Enter roll number" /></label><button className="primary-button">Mark attended ✓</button></form>{notice && <p className="notice">{notice}</p>}<div className="attendance-total"><strong>{attendance}</strong><span>students marked attended in this session</span></div></section>
  if (activeTab === 'Waste analysis') return <WasteAnalysis />
  return <LiveDemand />
}

// ─── Admin Menu Management Component ─────────────────────────────────────────

function NextMealEditor({ meal, isLocked }) {
  const [menuText, setMenuText] = useState(meal.menu)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const { addNotification } = useNotifications()

  const handleSave = (e) => {
    e.preventDefault()
    if (isLocked) {
      setFeedback({ type: 'error', text: 'Menu locked because student booking has started.' })
      return
    }

    setSaving(true)
    setFeedback(null)

    const res = saveMealMenu({ mealId: meal.id, menuText, now: new Date() })
    setSaving(false)

    if (res.success) {
      setFeedback({ type: 'success', text: `Menu for ${meal.name} updated successfully!` })
      addNotification({
        title: 'Menu Update Published',
        message: `Admin updated ${meal.name} menu: "${menuText.trim()}"`,
        category: 'menu',
        eventKey: `admin_menu_change_${meal.id}_${Date.now()}`,
        actionLabel: 'View Menu',
        actionPage: 'menu',
      })
    } else {
      setFeedback({ type: 'error', text: res.error || 'Failed to save menu changes.' })
    }
  }

  return (
    <form onSubmit={handleSave} className="menu-mgmt-form">
      <label htmlFor="next-meal-menu-input">
        Menu items for {meal.name}
      </label>
      <textarea
        id="next-meal-menu-input"
        className="menu-mgmt-textarea"
        value={menuText}
        onChange={(e) => setMenuText(e.target.value)}
        disabled={isLocked || saving}
        placeholder="e.g. Saboot Mix Dal · Tawa Soya Chaap · Rice · Roti · Raita"
        rows={3}
        required
      />

      <div className="menu-mgmt-actions">
        <button
          type="submit"
          className="primary-button"
          disabled={isLocked || saving || !menuText.trim() || menuText.trim() === meal.menu}
          id="admin-save-menu-btn"
        >
          {saving ? 'Saving…' : 'Save Menu Changes ✓'}
        </button>
        {feedback && (
          <span className={feedback.type === 'success' ? 'menu-mgmt-success' : 'menu-mgmt-error'}>
            {feedback.text}
          </span>
        )}
      </div>
    </form>
  )
}

function DishEditModal({ dish, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: dish.name || '',
    mealCategory: dish.mealCategory || 'Breakfast',
    servingSize: dish.servingSize || '',
    calories: dish.calories !== null && dish.calories !== undefined ? dish.calories : '',
    protein: dish.protein !== null && dish.protein !== undefined ? dish.protein : '',
    carbs: dish.carbs !== null && dish.carbs !== undefined ? dish.carbs : '',
    fat: dish.fat !== null && dish.fat !== undefined ? dish.fat : '',
    fiber: dish.fiber !== null && dish.fiber !== undefined ? dish.fiber : '',
    ingredients: dish.ingredients || '',
    confirmedAllergens: Array.isArray(dish.confirmedAllergens) ? [...dish.confirmedAllergens] : [],
    otherAllergens: Array.isArray(dish.confirmedAllergens)
      ? dish.confirmedAllergens.filter(a => !COMMON_ALLERGENS.includes(a)).join(', ')
      : '',
    crossContact: Array.isArray(dish.crossContact)
      ? dish.crossContact.join('\n')
      : (dish.crossContact || ''),
    verified: Boolean(dish.verified),
    verificationNotes: dish.verificationNotes || '',
  })

  const [saving, setSaving] = useState(false)

  const handleAllergenToggle = (allergen) => {
    setFormData(prev => {
      const exists = prev.confirmedAllergens.includes(allergen)
      const next = exists
        ? prev.confirmedAllergens.filter(a => a !== allergen)
        : [...prev.confirmedAllergens, allergen]
      return { ...prev, confirmedAllergens: next }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setSaving(true)

    const customList = formData.otherAllergens
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const finalConfirmed = Array.from(new Set([
      ...formData.confirmedAllergens.filter(a => COMMON_ALLERGENS.includes(a)),
      ...customList,
    ]))

    const finalCrossContact = formData.crossContact
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)

    const payload = {
      ...formData,
      calories: formData.calories !== '' ? Number(formData.calories) : null,
      protein: formData.protein !== '' ? Number(formData.protein) : null,
      carbs: formData.carbs !== '' ? Number(formData.carbs) : null,
      fat: formData.fat !== '' ? Number(formData.fat) : null,
      fiber: formData.fiber !== '' ? Number(formData.fiber) : null,
      confirmedAllergens: finalConfirmed,
      crossContact: finalCrossContact,
      verified: formData.verified,
      verificationStatus: formData.verified ? 'verified' : 'unverified',
    }

    onSave(dish.name, payload)
    setSaving(false)
    onClose()
  }

  return (
    <div className="dish-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="dish-modal-title">
      <div className="dish-modal">
        <div className="dish-modal-header">
          <h3 id="dish-modal-title">Edit Nutrition & Allergens: {dish.name}</h3>
          <button className="dish-modal-close-btn" onClick={onClose} aria-label="Close dialog">×</button>
        </div>

        <form onSubmit={handleSubmit} className="dish-modal-body">
          {/* Serving Size & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="dish-form-field">
              <label htmlFor="dish-category">Meal Category</label>
              <select
                id="dish-category"
                className="dish-form-select"
                value={formData.mealCategory}
                onChange={e => setFormData({ ...formData, mealCategory: e.target.value })}
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Snacks">Snacks</option>
                <option value="Dinner">Dinner</option>
              </select>
            </div>
            <div className="dish-form-field">
              <label htmlFor="dish-serving">Serving Size</label>
              <input
                id="dish-serving"
                className="dish-form-input"
                value={formData.servingSize}
                onChange={e => setFormData({ ...formData, servingSize: e.target.value })}
                placeholder="e.g. 1 bowl (150g)"
                required
              />
            </div>
          </div>

          {/* Nutritional Values */}
          <div className="dish-form-field">
            <label>Nutritional Values (per serving — clear if unknown)</label>
            <div className="dish-form-macros">
              <div>
                <small style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Calories (kcal)</small>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="dish-form-input"
                  value={formData.calories}
                  onChange={e => setFormData({ ...formData, calories: e.target.value })}
                  placeholder="kcal"
                  id="dish-cal-input"
                />
              </div>
              <div>
                <small style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Protein (g)</small>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="dish-form-input"
                  value={formData.protein}
                  onChange={e => setFormData({ ...formData, protein: e.target.value })}
                  placeholder="g"
                />
              </div>
              <div>
                <small style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Carbs (g)</small>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="dish-form-input"
                  value={formData.carbs}
                  onChange={e => setFormData({ ...formData, carbs: e.target.value })}
                  placeholder="g"
                />
              </div>
              <div>
                <small style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Total Fat (g)</small>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="dish-form-input"
                  value={formData.fat}
                  onChange={e => setFormData({ ...formData, fat: e.target.value })}
                  placeholder="g"
                />
              </div>
              <div>
                <small style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Fiber (g)</small>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  className="dish-form-input"
                  value={formData.fiber}
                  onChange={e => setFormData({ ...formData, fiber: e.target.value })}
                  placeholder="g"
                />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="dish-form-field">
            <label htmlFor="dish-ingredients">Ingredient List</label>
            <textarea
              id="dish-ingredients"
              className="dish-form-textarea"
              rows={2}
              value={formData.ingredients}
              onChange={e => setFormData({ ...formData, ingredients: e.target.value })}
              placeholder="e.g. Whole wheat flour, boiled potatoes, green chili, spices, oil"
            />
          </div>

          {/* Confirmed Allergens */}
          <div className="dish-form-field">
            <label>Confirmed Allergens Present in Dish</label>
            <div className="dish-allergen-checkboxes">
              {COMMON_ALLERGENS.map(allergen => (
                <label key={allergen} className="allergen-check-item">
                  <input
                    type="checkbox"
                    checked={formData.confirmedAllergens.includes(allergen)}
                    onChange={() => handleAllergenToggle(allergen)}
                  />
                  <span>{allergen}</span>
                </label>
              ))}
            </div>
            <div style={{ marginTop: 6 }}>
              <input
                className="dish-form-input"
                style={{ width: '100%' }}
                value={formData.otherAllergens}
                onChange={e => setFormData({ ...formData, otherAllergens: e.target.value })}
                placeholder="Other allergens (comma separated, e.g. Mustard, Celery, Shellfish)"
              />
            </div>
          </div>

          {/* Cross Contact Warnings */}
          <div className="dish-form-field">
            <label htmlFor="dish-cross">Possible Cross-Contact Warnings (One per line)</label>
            <textarea
              id="dish-cross"
              className="dish-form-textarea"
              rows={2}
              value={formData.crossContact}
              onChange={e => setFormData({ ...formData, crossContact: e.target.value })}
              placeholder="e.g. Shared tawa used for dairy or gluten items"
            />
          </div>

          {/* Verification Status */}
          <div className="verification-toggle-box">
            <label className="verification-toggle-label">
              <input
                type="checkbox"
                checked={formData.verified}
                onChange={e => setFormData({ ...formData, verified: e.target.checked })}
                id="dish-verified-checkbox"
              />
              <span>Mark as Officially Verified by Kitchen Dietitian</span>
            </label>
            <input
              className="dish-form-input"
              value={formData.verificationNotes}
              onChange={e => setFormData({ ...formData, verificationNotes: e.target.value })}
              placeholder="Verification Notes (e.g. Verified by Hostel Mess Dietitian)"
            />
          </div>

          {/* Actions */}
          <div className="dish-modal-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={saving} id="dish-modal-save-btn">
              {saving ? 'Saving...' : 'Save Dish Details ✓'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MealDishesNutritionEditor({ meal, isLocked }) {
  const [editingDish, setEditingDish] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)
  const { addNotification } = useNotifications()

  // Extract dishes in the current target meal
  const dishesInMeal = useMemo(() => {
    return parseDishesFromMenu(meal.menu)
  }, [meal.menu])

  // Get nutrition data for dishes
  const [dishesData, setDishesData] = useState(() => {
    return dishesInMeal.map(name => getDishNutrition(name))
  })

  // Refresh dishes data when meal.menu changes or nutrition updates
  useEffect(() => {
    const handleUpdate = () => {
      setDishesData(dishesInMeal.map(name => getDishNutrition(name)))
    }
    handleUpdate()
    window.addEventListener('plateSyncNutritionUpdate', handleUpdate)
    return () => window.removeEventListener('plateSyncNutritionUpdate', handleUpdate)
  }, [dishesInMeal])

  const handleSaveDish = (dishName, data) => {
    const res = saveDishNutrition(dishName, data)
    if (res.success) {
      setDishesData(prev => prev.map(d => (d.name === dishName ? res.dish : d)))
      setSuccessMsg(`Nutrition details for "${dishName}" updated successfully!`)
      setTimeout(() => setSuccessMsg(null), 4000)

      addNotification({
        title: 'Dish Nutrition Updated',
        message: `Admin updated nutrition and allergen facts for "${dishName}". Live on student portal.`,
        category: 'menu',
        eventKey: `nutrition_edit_${dishName}_${Date.now()}`,
        actionLabel: 'View Nutrition',
        actionPage: 'nutrition',
      })
    }
  }

  return (
    <div className="dish-mgmt-section">
      <div className="dish-mgmt-header">
        <div>
          <h4>Dish Nutrition & Allergen Information for {meal.name}</h4>
          <small style={{ color: 'var(--text-secondary)' }}>
            Configure nutritional facts, confirmed allergens, and cross-contact advisories for dishes in this meal.
            {isLocked && ' (Note: Meal menu is locked for bookings; editing nutrition details does not alter confirmed meal bookings.)'}
          </small>
        </div>
        {successMsg && <span className="menu-mgmt-success">{successMsg}</span>}
      </div>

      <div className="dish-mgmt-grid">
        {dishesData.map(dish => {
          const hasNutrition = dish.calories !== null && dish.calories !== undefined
          const confirmed = Array.isArray(dish.confirmedAllergens) ? dish.confirmedAllergens : []

          return (
            <div
              key={dish.name}
              className={`dish-mgmt-item ${dish.verified ? 'verified-border' : ''}`}
            >
              <div className="dish-mgmt-item-header">
                <h5 className="dish-mgmt-item-name">{dish.name}</h5>
                {dish.verified ? (
                  <span className="v-badge verified" style={{ fontSize: 10 }}>✓ Verified</span>
                ) : (
                  <span className="v-badge unverified" style={{ fontSize: 10 }}>⚠️ Estimate</span>
                )}
              </div>

              <div className="dish-mgmt-nutri-line">
                {hasNutrition ? (
                  <span>
                    <strong>{dish.calories} kcal</strong> · P: {dish.protein}g · C: {dish.carbs}g · F: {dish.fat}g
                  </span>
                ) : (
                  <span style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                    Nutrition info not available
                  </span>
                )}
              </div>

              <div className="dish-mgmt-allergens-line">
                {confirmed.length > 0 ? (
                  confirmed.map(a => (
                    <span key={a} className="admin-allergen-tag confirmed">
                      ⚠️ {a}
                    </span>
                  ))
                ) : dish.verified ? (
                  <span className="admin-allergen-tag safe">✓ No common allergens</span>
                ) : (
                  <span className="admin-allergen-tag unknown">❓ Unknown allergen status</span>
                )}
              </div>

              <button
                type="button"
                className="dish-mgmt-edit-btn"
                onClick={() => setEditingDish(dish)}
                id={`edit-dish-${dish.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                Edit Nutrition & Allergens ✏️
              </button>
            </div>
          )
        })}
      </div>

      {editingDish && (
        <DishEditModal
          dish={editingDish}
          onClose={() => setEditingDish(null)}
          onSave={handleSaveDish}
        />
      )}
    </div>
  )
}

function HostelDishLibrary() {
  const [allDishes, setAllDishes] = useState(() => getAllMenuDishes())
  const [selectedDishName, setSelectedDishName] = useState('')
  const [editingDish, setEditingDish] = useState(null)
  const [statusMsg, setStatusMsg] = useState(null)
  const { addNotification } = useNotifications()

  useEffect(() => {
    const handleUpdate = () => setAllDishes(getAllMenuDishes())
    window.addEventListener('plateSyncNutritionUpdate', handleUpdate)
    return () => window.removeEventListener('plateSyncNutritionUpdate', handleUpdate)
  }, [])

  const selectedDish = useMemo(() => {
    if (!selectedDishName) return null
    return allDishes.find(d => d.name === selectedDishName) || null
  }, [allDishes, selectedDishName])

  const handleSave = (dishName, data) => {
    const res = saveDishNutrition(dishName, data)
    if (res.success) {
      setAllDishes(getAllMenuDishes())
      setStatusMsg(`Nutrition details for "${dishName}" saved successfully!`)
      setTimeout(() => setStatusMsg(null), 4000)

      addNotification({
        title: 'Dish Nutrition Updated',
        message: `Admin updated nutrition facts for "${dishName}".`,
        category: 'menu',
        eventKey: `nutrition_edit_lib_${dishName}_${Date.now()}`,
        actionLabel: 'View Nutrition',
        actionPage: 'nutrition',
      })
    }
  }

  return (
    <div className="dish-lib-card">
      <p className="section-label">CURATED MENU CATALOG</p>
      <h3 style={{ margin: '0 0 6px', fontSize: 18, color: 'var(--text-primary)' }}>
        Hostel Dish Nutrition & Allergen Library
      </h3>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
        Select any dish from the weekly mess schedule to configure or verify its nutritional profile, ingredients, and allergen warnings.
      </p>

      <div className="dish-lib-row">
        <select
          className="dish-form-select"
          style={{ minWidth: 260 }}
          value={selectedDishName}
          onChange={e => setSelectedDishName(e.target.value)}
          id="admin-dish-lib-select"
        >
          <option value="">-- Choose a dish to inspect or edit --</option>
          {allDishes.map(d => (
            <option key={d.norm} value={d.name}>
              {d.name} ({d.primaryMeal}) {d.verified ? '✓ Verified' : '⚠️ Unverified'}
            </option>
          ))}
        </select>

        {selectedDish && (
          <button
            type="button"
            className="primary-button"
            style={{ padding: '9px 16px', fontSize: 13 }}
            onClick={() => setEditingDish(selectedDish)}
            id="admin-edit-selected-dish-btn"
          >
            Edit {selectedDish.name} Details ✏️
          </button>
        )}

        {statusMsg && <span className="menu-mgmt-success">{statusMsg}</span>}
      </div>

      {editingDish && (
        <DishEditModal
          dish={editingDish}
          onClose={() => setEditingDish(null)}
          onSave={handleSave}
        />
      )}
    </div>
  )
}

function AdminMenuManagement({ currentTime, user }) {
  const nextInfo = getNextEligibleMeal(currentTime)
  const { meal, dateStr, isTomorrow, bookingStart, isLocked, lockReason } = nextInfo
  const minutesToBooking = Math.max(0, Math.ceil((bookingStart - currentTime) / 60000))

  return (
    <section className="menu-mgmt-view">
      <p className="section-label">MESS ADMIN · MENU SCHEDULING</p>
      <h2 style={{ margin: 0, fontSize: 24, color: 'var(--text-primary)' }}>Next Meal Menu Management</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: '8px 0 20px', lineHeight: 1.5 }}>
        Update the menu for the next eligible meal before student booking begins.
        Once student booking opens (45 minutes prior to meal serving), editing is locked to preserve confirmed bookings.
      </p>

      {/* Primary Target Meal Card */}
      <div className="menu-mgmt-card">
        <div className="menu-mgmt-card-top">
          <div className="menu-mgmt-card-title">
            <span style={{ fontSize: 26 }} aria-hidden="true">{meal.icon}</span>
            <div>
              <h3>Next Eligible Meal: {meal.name}</h3>
              <small>{isTomorrow ? 'Tomorrow' : 'Today'} ({dateStr}) · Serving: {meal.time}</small>
            </div>
          </div>
          <div>
            {isLocked ? (
              <span className="menu-badge menu-badge-locked">🔒 Booking Open (Locked)</span>
            ) : (
              <span className="menu-badge menu-badge-editable">✏️ Booking Closed (Editable)</span>
            )}
          </div>
        </div>

        {isLocked ? (
          <div className="menu-mgmt-notice locked" role="alert">
            ⚠️ {lockReason || 'Menu locked because student booking has started.'} Modifications to this meal menu are no longer accepted. Existing dish nutrition details can still be updated.
          </div>
        ) : (
          <div className="menu-mgmt-notice editable">
            ℹ️ Student booking opens in <strong>{minutesToBooking} minutes</strong> (at {formatTime(bookingStart)}). You can adjust and save menu items now.
          </div>
        )}

        <NextMealEditor
          key={`${meal.id}_${dateStr}`}
          meal={meal}
          isLocked={isLocked}
        />

        {/* Dish nutrition manager for this meal */}
        <MealDishesNutritionEditor
          meal={meal}
          isLocked={isLocked}
          user={user}
        />
      </div>

      {/* Full Hostel Menu Dish Nutrition Library */}
      <HostelDishLibrary user={user} />

      {/* Daily Schedule Overview */}
      <div style={{ marginTop: 24 }}>
        <p className="section-label">DAILY SCHEDULE OVERVIEW</p>
        <h3 style={{ margin: '0 0 6px', fontSize: 18, color: 'var(--text-primary)' }}>All Meals Status</h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 14px' }}>
          PlateSync rules permit editing only the next upcoming meal. Subsequent meals remain locked until their turn.
        </p>

        <div className="schedule-table-wrap">
          <div className="schedule-head">
            <span>Meal</span>
            <span>Serving Time</span>
            <span>Booking Window</span>
            <span>Status</span>
          </div>
          {DEFAULT_MEALS.map(m => {
            const isTarget = m.id === meal.id
            const { mealStart: mStart, bookingStart: mBookStart } = getMealTimes(m, currentTime)
            const isPast = !isTarget && (currentTime >= mStart)

            let badge
            if (isTarget) {
              badge = isLocked
                ? <span className="menu-badge menu-badge-locked">Locked (Booking open)</span>
                : <span className="menu-badge menu-badge-editable">Next Eligible (Editable)</span>
            } else if (isPast) {
              badge = <span className="menu-badge menu-badge-future">Completed / Past</span>
            } else {
              badge = <span className="menu-badge menu-badge-future">Upcoming (Locked until next)</span>
            }

            return (
              <div key={m.id} className={`schedule-row${isTarget ? ' active' : ''}`}>
                <strong>{m.icon} {m.name}</strong>
                <span>{m.time}</span>
                <span>Opens {formatTime(mBookStart)}</span>
                <span>{badge}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ─── Live Demand Component with 10% Historical Actual Attendance Buffer ───────

function LiveDemand() {
  const demandList = useMemo(() => getAllLiveDemand(DEFAULT_BOOKINGS, 0.91), [])

  const totalBookings = demandList.reduce((acc, row) => acc + row.bookings, 0)
  const totalExpected = demandList.reduce((acc, row) => acc + row.expectedAttendance, 0)
  const totalPrepare  = demandList.reduce((acc, row) => acc + row.recommendedServings, 0)

  // Find Lunch calculation for formula display
  const lunchData = demandList.find(r => r.mealId === 'lunch') || demandList[1]
  const hasEstimate = demandList.some(r => r.isEstimate)

  return (
    <>
      <div className="summary-grid">
        <Summary title="TOTAL BOOKINGS" value={totalBookings} detail="across all 4 meals" />
        <Summary title="EXPECTED ATTENDANCE" value={totalExpected} detail="based on 91% historical rate" />
        <Summary title="RECOMMENDED SERVINGS" value={totalPrepare} detail="includes 10% historical safety buffer" />
      </div>

      <div className="dashboard-head">
        <div>
          <p className="section-label">LIVE PREPARATION ESTIMATES</p>
          <h2>Recommended Servings per Meal</h2>
        </div>
        <p>10% safety buffer is dynamically calculated from average historical actual attendance.</p>
      </div>

      <div className="demand-table">
        <div className="demand-head live-demand">
          <span>Meal</span>
          <span>Bookings</span>
          <span>Att. Rate</span>
          <span>Expected</span>
          <span>Avg Past Actual</span>
          <span>10% Buffer</span>
          <span>Recommended</span>
        </div>
        {demandList.map(row => (
          <div className="demand-row live-demand" key={row.mealId}>
            <span>
              <strong>{row.mealName}</strong>
              {row.isEstimate && <span className="demand-estimate-tag">Estimate</span>}
            </span>
            <span>{row.bookings}</span>
            <span>{row.attendanceRatePercent}</span>
            <span>{row.expectedAttendance}</span>
            <span>{row.avgHistoricalAttendance !== null ? row.avgHistoricalAttendance : '—'}</span>
            <span>+{row.safetyBuffer}</span>
            <span>{row.recommendedServings} servings</span>
          </div>
        ))}
      </div>

      {hasEstimate && (
        <p className="notice" style={{ marginTop: 12 }}>
          ℹ️ Meals marked with <strong>Estimate</strong> do not have recorded historical actual attendance, so they reflect expected attendance without an added buffer.
        </p>
      )}

      {/* Dynamic formula demonstration */}
      <section className="simple-logic">
        <div>
          <p className="section-label">DYNAMIC SAFETY BUFFER</p>
          <h2>Transparent, data-backed estimate</h2>
          <p>
            The fixed buffer of 5 has been replaced by <strong>10% of average historical actual attendance</strong> for each meal:
            <br />
            <code>Recommended = CEIL(Bookings × 91%) + CEIL(Avg Past Actual × 10%)</code>
          </p>
        </div>
        <div className="formula">
          <span>{lunchData.bookings} booked</span>
          <b>×</b>
          <span>{lunchData.attendanceRatePercent} rate</span>
          <b>=</b>
          <span>{lunchData.expectedAttendance} expected</span>
          <b>+</b>
          <span>{lunchData.safetyBuffer} buffer (10% of {lunchData.avgHistoricalAttendance} actual)</span>
          <b>=</b>
          <strong>{lunchData.recommendedServings} lunch servings</strong>
        </div>
      </section>
    </>
  )
}

function WasteAnalysis() { const data=[['Breakfast','60 kg','42 kg','18 kg saved'],['Lunch','60 kg','39 kg','21 kg saved'],['Snacks','14 kg','9 kg','5 kg saved'],['Dinner','60 kg','41 kg','19 kg saved']]; return <section><p className="section-label">DAILY WASTE REVIEW</p><h2 className="analysis-title">Approximate food-waste analysis</h2><div className="demand-table"><div className="demand-head analysis"><span>Meal</span><span>Past waste</span><span>Estimated today</span><span>Potential saved</span></div>{data.map(row => <div className="demand-row analysis" key={row[0]}>{row.map(item => <span key={item}>{item}</span>)}</div>)}</div><p className="notice">Estimated daily saving with PlateSync: approximately 63 kg of food. These figures are project demo calculations based on your hostel's approximate data.</p></section> }
function Summary({ title, value, detail }) { return <article><small>{title}</small><strong>{value}</strong><span>{detail}</span></article> }
