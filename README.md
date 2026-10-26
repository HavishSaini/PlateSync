# 🍽️ PlateSync

> **Smart Hostel Mess Meal Management — Zero Guesswork. Less Waste. Informed Dining.**

PlateSync is a modern cafeteria and hostel mess management web application built for universities. It connects students and mess administrators through **time-gated meal pre-booking**, **real-time dynamic menu updates**, **deep nutritional & allergen transparency**, and **automated waste analytics**.

---

## 🌟 The Problem

Hostel messes cook in bulk based on rough assumptions, producing significant food waste daily (~194 kg across meals) or sudden shortages:

| Meal Period | Serving Time | Estimated Daily Waste |
| :--- | :--- | :--- |
| **Breakfast** | 08:00 AM – 10:00 AM | ~60 kg |
| **Lunch** | 12:30 PM – 02:30 PM | ~60 kg |
| **Snacks** | 05:00 PM – 06:30 PM | ~14 kg |
| **Dinner** | 07:30 PM – 09:30 PM | ~60 kg |

The root cause is a lack of advance headcounts and disconnected communication between students and kitchen operators. PlateSync bridges that gap.

---

## ✨ Features & Modules

### 👨‍🎓 Student Portal
- **45-Minute Pre-Booking Window** — Confirm or cancel upcoming meals within the 45 minutes before serving begins (`07:15` for Breakfast, `11:45` for Lunch, etc.).
- **Live Menu & Countdown** — Real-time indicator for active/upcoming meals, countdown timers, and serving schedules.
- **Nutrition & Allergen Guide** —
  - Detailed macronutrients per dish: Calories, Protein (g), Carbohydrates (g), Fiber (g), and Fat (g).
  - Quick-filter pills: **High Protein**, **High Fiber**, and **Low Fat**.
  - Interactive Allergen Safety Shield: instantly flag dishes containing Dairy, Gluten, Nuts, Soy, etc.
- **My Impact Dashboard** — Track personal attendance, meals saved from waste, and equivalent CO₂ footprint reductions.
- **Issue Reporting Hub** — Submit quality, hygiene, or shortage complaints with photos, priority levels, and track administrative resolution in real-time.

### 🧑‍🍳 Mess Admin Portal
- **Live Demand Forecasting** — Real-time verified booking counts vs. historical baselines to calibrate kitchen production batches.
- **Dynamic Menu Management** —
  - Safely edit upcoming meal menus for the next eligible meal.
  - Automatic time-locking once student pre-booking commences to protect kitchen prep integrity.
  - Date-isolated overrides (`YYYY-MM-DD_mealId`) preventing today's completed meals from bleeding into tomorrow's schedule.
- **Attendance Marker** — Roll-number-based check-in system for cafeteria staff at dining counters.
- **Waste & Impact Analysis** — Log daily cooked vs. wasted kilograms to visualize cost losses and greenhouse benchmarks.
- **Admin Issue Resolution Center** — Review, filter, update statuses (*Open ➔ In Progress ➔ Resolved*), and post official admin remarks on student issue tickets.

### 🔔 System-Wide Real-Time Notifications
- **Broadcast Notification Engine** — When an admin saves a menu change or updates nutrition records, an event broadcast dispatches to all student notification centers and displays toast popups.
- **Bell Notification Center** — Dedicated notification history panel with unread badge counters, time-ago formatting, category tags, and action shortcuts.

### 📖 "How to Use" Interactive Guide
- Accessible directly from the top-right hamburger menu and navigation bar.
- Role-specific step-by-step interactive workflows for both **Students** and **Mess Admins**.
- Reference guide for meal timings and booking windows.
- Collapsible FAQ addressing common booking, menu duration, and allergy questions.

### ✉️ Mess Administration Contact Hub
- Interactive contact form with local message persistence and category triage.
- Campus office location, direct administration support email, and emergency contact details.
- Working dining hall operating hours and support response SLAs.

### 🌓 Premium Dual-Theme System
- Light and dark themes built using bespoke CSS design tokens with instantaneous toggling.
- Dark theme designed with deep charcoal backgrounds (`#101716`, `#151D1B`), elevated cards (`#1B2422`, `#222D29`), emerald accents (`#36B887`), and warm ambient amber highlights (`#D9B879`).

---

## 🧭 App Navigation & Routes (React Router SPA)

| Route Path | Key Purpose | Access / Guard |
| :--- | :--- | :--- |
| `/` | Landing page showcasing sustainability metrics, meal booking blueprint, and live demand preview. | Public |
| `/menu` | Full 7-day weekly schedule with date-specific overrides. | Public |
| `/nutrition` | Dietary breakdown, macro filters (High Protein / High Fiber / Low Fat), and interactive allergen shields. | Public |
| `/how-to-use` | Comprehensive interactive operational guide and FAQs for students and mess managers. | Public |
| `/contact` | Mess administration contact form with campus office hours, phone, and inquiry dispatch. | Public |
| `/login` | User authentication via Chitkara university email (`@chitkara.edu.in`). | Guest only (auto-redirects to `/dashboard` if logged in) |
| `/signup` | Multi-role account registration with live password requirement validation. | Guest only (auto-redirects to `/dashboard` if logged in) |
| `/dashboard` | Student meal bookings & sustainability impact or Mess Admin demand forecasting & menu management. | **Protected Route** (redirects guests to `/login`) |
| `/notifications`| Notification center with real-time alerts, unread counts, and category badges. | **Protected Route** (redirects guests to `/login`) |

---

## 🛠️ Tech Stack & Architecture

- **Frontend Core:** [React 19](https://react.dev/) (Functional components, custom hooks, and modern hooks discipline)
- **Routing & Navigation:** [React Router 7](https://reactrouter.com/) (`BrowserRouter`, declarative `<Routes>`, `<Route>`, `<NavLink>`, `<Link>`, and state-aware `<ProtectedRoute>` route guards)
- **Global State Management:** [Redux Toolkit (RTK)](https://redux-toolkit.js.org/) + `react-redux`
  - Centralized store configuration (`configureStore`)
  - Authentication & session slice (`authSlice`) with Immer immutability and `localStorage` synchronization
  - Redux DevTools enabled for time-travel debugging
- **Context API & Events:** React Context (`NotificationContext`, `ToastContext`) + Custom Event-driven bus (`plateSyncMenuUpdate`, `plateSyncNotificationAdded`)
- **Tooling & Bundler:** [Vite 8](https://vite.dev/) (Instant HMR and production bundle optimization)
- **Typography & Icons:** [Inter Variable Font](https://fontsource.org/fonts/inter) + [Font Awesome](https://fontawesome.com/) icons
- **Styling:** Premium Vanilla CSS with tailored design tokens, modern charcoal & emerald dark mode palette, glassmorphism, and responsive clamp typography
- **Linter & Static Analysis:** [Oxlint](https://oxc.rs/) (High-performance Rust-based linter)

---

## 📁 Project Directory Structure

```
PlateSync/
├── public/                       # Favicon and static assets
├── src/
│   ├── App.jsx                   # Central declarative router (<Routes>, <Route>) & theme coordinator
│   ├── App.css                   # Global shell styles
│   ├── index.css                 # CSS variables, color tokens, and base typography resets
│   ├── main.jsx                  # React DOM entry point (<Provider>, <BrowserRouter>)
│   ├── store/                    # Redux Toolkit store architecture
│   │   ├── index.js              # Central Redux store configuration
│   │   └── slices/
│   │       └── authSlice.js      # User authentication slice (login, logout, updateUser)
│   ├── components/
│   │   ├── common/
│   │   │   ├── Navbar.jsx        # Navigation bar with NavLinks, active indicator & theme switch
│   │   │   ├── Navbar.css
│   │   │   ├── Footer.jsx        # Application footer with React Router Links
│   │   │   ├── Footer.css
│   │   │   ├── ProtectedRoute.jsx# State-aware route guard with redirect memory
│   │   │   ├── HowToUse.jsx      # Interactive guide page (Students & Admins)
│   │   │   ├── HowToUse.css
│   │   │   ├── ContactUs.jsx     # Contact administration inquiry view
│   │   │   └── ContactUs.css
│   │   ├── home/                 # Landing page
│   │   ├── dashboard/            # Student & Admin operational dashboard
│   │   ├── menu/                 # Weekly mess menu view
│   │   ├── nutrition/            # Nutrition & allergen filtering view
│   │   ├── notifications/        # NotificationCenter & ToastContainer
│   │   ├── issues/               # IssueReportView & AdminIssueView
│   │   ├── login/                # Authentication views with Redux dispatch & redirect memory
│   │   ├── signup/
│   │   └── shared/               # Reusable components (MealCard, etc.)
│   ├── context/
│   │   ├── NotificationContext.jsx # Notification persistence & unread state
│   │   └── ToastContext.jsx        # Dynamic toast dispatch system
│   └── utils/
│       ├── menuStorage.js        # Menu data, date-bound overrides & broadcast queue
│       ├── attendanceStorage.js  # Demand forecasting & attendance records
│       └── reportsStorage.js     # Issue reporting & resolution tracking
├── package.json
└── vite.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18.0.0 or later)
- **npm** (v9.0.0 or later)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/HavishSaini/PlateSync.git
   cd PlateSync
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Start local development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

4. **Lint and production build checks:**
   ```bash
   npm run lint     # Check code formatting & React rules with Oxlint
   npm run build    # Compile production bundle to /dist
   npm run preview  # Preview production build locally
   ```

---

## ⏱️ Meal Timings & Booking Windows

| Meal | Serving Hours | 45-Min Booking Window |
| :--- | :--- | :--- |
| **🥐 Breakfast** | 08:00 AM – 10:00 AM | **07:15 AM – 08:00 AM** |
| **🍛 Lunch** | 12:30 PM – 02:30 PM | **11:45 AM – 12:30 PM** |
| **☕ Snacks** | 05:00 PM – 06:30 PM | **04:15 PM – 05:00 PM** |
| **🍲 Dinner** | 07:30 PM – 09:30 PM | **06:45 PM – 07:30 PM** |

---

## 📄 License & Attribution

This project is developed as a campus sustainability and mess optimization platform.  
Built with ❤️ to eliminate food waste, one plate at a time.
