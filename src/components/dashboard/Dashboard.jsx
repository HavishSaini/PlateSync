import { useEffect, useMemo, useRef, useState } from 'react'
import MealCard from '../shared/MealCard'
import { useNotifications } from '../../context/NotificationContext'
import { syncAdminReportNotifications } from '../../utils/reportsStorage'
import IssueReportView from '../issues/IssueReportView'
import AdminIssueView from '../issues/AdminIssueView'
import './Dashboard.css'

const meals = [
  { id:'breakfast', name:'Breakfast', icon:'☀', startTime:'08:00', time:'8:00 AM – 9:30 AM', waste:'60 kg', menu:'Mix Parantha · Curd · Chutney · Tea' },
  { id:'lunch', name:'Lunch', icon:'◐', startTime:'12:30', time:'12:30 PM – 2:30 PM', waste:'60 kg', menu:'Saboot Mix Dal · Tawa Soya Chaap · Rice · Roti · Raita' },
  { id:'snacks', name:'Snacks', icon:'☕', startTime:'16:30', time:'4:30 PM – 5:30 PM', waste:'14 kg', menu:'Vegetable Pasta · Cold Coffee' },
  { id:'dinner', name:'Dinner', icon:'◑', startTime:'19:30', time:'7:30 PM – 9:30 PM', waste:'60 kg', menu:'Hari Dal · Chilli Potato · Rice · Roti · Chutney · Laddoo' },
]
const studentTabs = ['Today\u2019s meals', 'My attendance', 'My impact', 'Report issue']
const adminTabs   = ['Live demand', 'Mark attendance', 'Waste analysis', 'Issue reports']

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
  useEffect(() => localStorage.setItem('plateSyncBookings', JSON.stringify(bookings)), [bookings])
  useEffect(() => { const clock = setInterval(() => setCurrentTime(new Date()), 30000); return () => clearInterval(clock) }, [])

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
    const meal = meals.find(item => item.id === id)
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
        ? <AdminView activeTab={activeTab} user={user} />
        : <StudentView activeTab={activeTab} bookings={bookings} message={message} onBook={changeBooking} currentTime={currentTime} user={user} />
      }
    </section>
  )
}

function StudentView({ activeTab, bookings, message, onBook, currentTime, user }) {
  const savedFood = useMemo(() => (bookings.length * 0.35).toFixed(2), [bookings])
  if (activeTab === 'My attendance') return <Attendance bookings={bookings} />
  if (activeTab === 'My impact') return <section className="impact-view"><p className="section-label">YOUR RESPONSIBILITY SCORE</p><h2>Every booking makes a difference.</h2><div className="impact-score"><strong>{Math.min(100, 80 + bookings.length * 5)}<small>/100</small></strong><p>Your score grows when you book thoughtfully and attend your confirmed meals.</p></div><div className="summary-grid"><Summary title="MEALS BOOKED" value={`${bookings.length} / 4`} detail="for today"/><Summary title="ESTIMATED FOOD SAVED" value={`${savedFood} kg`} detail="from your bookings"/><Summary title="DAILY HOSTEL TARGET" value="194 kg" detail="average waste to reduce"/></div></section>
  if (activeTab === 'Report issue') return <IssueReportView user={user} />
  return <><div className="summary-grid"><Summary title="MEALS BOOKED" value={`${bookings.length} / 4`} detail="for today"/><Summary title="ESTIMATED FOOD SAVED" value={`${savedFood} kg`} detail="based on your bookings"/><Summary title="BOOKING WINDOW" value="45 min" detail="only before the meal starts"/></div>{message && <p className="notice">{message}</p>}<div className="dashboard-head"><div><p className="section-label">TODAY'S MESS MENU</p><h2>Choose meals responsibly</h2></div><p>Real-time booking opens only during the 45 minutes before each meal.</p></div><div className="dashboard-meals">{meals.map(meal => <MealCard key={meal.id} meal={meal} booked={bookings.includes(meal.id)} onBook={onBook} bookingInfo={getBookingInfo(meal, currentTime)} />)}</div></>
}

function Attendance({ bookings }) {
  const [seconds, setSeconds] = useState(2700)
  useEffect(() => { const timer = setInterval(() => setSeconds(old => old > 0 ? old - 1 : 0), 1000); return () => clearInterval(timer) }, [])
  const minutes = String(Math.floor(seconds / 60)).padStart(2, '0'); const remainingSeconds = String(seconds % 60).padStart(2, '0')
  return <section className="attendance-view"><p className="section-label">ATTENDANCE CHECK-IN</p><h2>Your meal attendance</h2><p>Show your booking at the mess counter. The staff marks you as attended during the meal period.</p><div className="timer-card"><span>TIME LEFT FOR CURRENT MEAL PERIOD</span><strong>00:{minutes}:{remainingSeconds}</strong><small>Attendance can be marked from 12:30 PM to 2:30 PM for lunch.</small></div><div className="attendance-list">{meals.map(meal => <div key={meal.id}><span>{meal.name}</span><b className={bookings.includes(meal.id) ? 'confirmed' : 'pending'}>{bookings.includes(meal.id) ? 'Confirmed — show at counter' : 'Not booked'}</b></div>)}</div></section>
}

function AdminView({ activeTab, user }) {
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
  if (activeTab === 'Mark attendance') return <section className="admin-form"><p className="section-label">MESS STAFF ACTION</p><h2>Mark student attendance</h2><p>Enter the student roll number after serving their booked meal.</p><form onSubmit={markAttendance}><label>Student roll number<input value={rollNo} onChange={event => setRollNo(event.target.value)} placeholder="Enter roll number" /></label><button className="primary-button">Mark attended ✓</button></form>{notice && <p className="notice">{notice}</p>}<div className="attendance-total"><strong>{attendance}</strong><span>students marked attended in this session</span></div></section>
  if (activeTab === 'Waste analysis') return <WasteAnalysis />
  return <LiveDemand />
}

function LiveDemand() { return <><div className="summary-grid"><Summary title="EXPECTED STUDENTS" value="642" detail="from meal bookings"/><Summary title="PREDICTED ATTENDANCE" value="584" detail="91% historical attendance"/><Summary title="RECOMMENDED SERVINGS" value="590" detail="includes a small safety buffer"/></div><section className="demand-table"><div className="demand-head"><span>Meal</span><span>Booked</span><span>Expected</span><span>Prepare</span></div>{[['Breakfast','187','170','174'],['Lunch','238','217','222'],['Snacks','112','100','104'],['Dinner','194','177','182']].map(row => <div className="demand-row" key={row[0]}>{row.map(item => <span key={item}>{item}</span>)}</div>)}</section><section className="simple-logic"><div><p className="section-label">SMART PREPARATION</p><h2>Clear, explainable estimate</h2><p>Registered students × past attendance rate + a small safety buffer = recommended servings.</p></div><div className="formula"><span>238 booked</span><b>×</b><span>91% attendance</span><b>+</b><span>5 buffer</span><b>=</b><strong>222 lunch servings</strong></div></section></> }
function WasteAnalysis() { const data=[['Breakfast','60 kg','42 kg','18 kg saved'],['Lunch','60 kg','39 kg','21 kg saved'],['Snacks','14 kg','9 kg','5 kg saved'],['Dinner','60 kg','41 kg','19 kg saved']]; return <section><p className="section-label">DAILY WASTE REVIEW</p><h2 className="analysis-title">Approximate food-waste analysis</h2><div className="demand-table"><div className="demand-head analysis"><span>Meal</span><span>Past waste</span><span>Estimated today</span><span>Potential saved</span></div>{data.map(row => <div className="demand-row analysis" key={row[0]}>{row.map(item => <span key={item}>{item}</span>)}</div>)}</div><p className="notice">Estimated daily saving with PlateSync: approximately 63 kg of food. These figures are project demo calculations based on your hostel's approximate data.</p></section> }
function Summary({ title, value, detail }) { return <article><small>{title}</small><strong>{value}</strong><span>{detail}</span></article> }
