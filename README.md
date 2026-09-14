# 🍽️ PlateSync

> **Every meal booked. Less food wasted.**

PlateSync is a hostel mess meal-booking web app built for **Chitkara University**. It bridges the gap between students and kitchen staff — students book their meals in advance, and the mess gets a clear, data-driven demand estimate to prepare the right amount of food, reducing daily food waste.

---

## 🌟 The Problem

Chitkara University hostels produce approximately **194 kg of food waste every day**:

| Meal      | Estimated Daily Waste |
|-----------|-----------------------|
| Breakfast | ~60 kg                |
| Lunch     | ~60 kg                |
| Dinner    | ~60 kg                |
| Snacks    | ~14 kg                |

The root cause is simple: the kitchen has no reliable way to know how many students will actually show up. PlateSync fixes that.

---

## ✨ Features

### 👨‍🎓 Student Portal
- **Meal Booking** — Book or cancel meals during the 45-minute window before each serving
- **Today's Menu** — View the day's mess menu with timing and waste context per meal
- **My Attendance** — See your booking status for each meal with a countdown timer
- **My Impact** — Track your Responsibility Score and estimated food saved through smart booking

### 🧑‍🍳 Mess Admin Portal
- **Live Demand** — Real-time view of total bookings, predicted attendance, and recommended servings per meal
- **Smart Estimation** — Formula-based calculation: `booked × historical attendance rate + safety buffer`
- **Mark Attendance** — Roll-number-based student check-in for mess staff
- **Waste Analysis** — Side-by-side comparison of past vs. estimated waste with projected savings

### 📋 Weekly Mess Menu
- Full 7-day mess menu (Breakfast, Lunch, Snacks, Dinner) displayed in a clean table
- Matches real Chitkara hostel menu items

---

## 🗂️ Project Structure

```
PlateSync/
├── src/
│   ├── App.jsx                  # Root component — page routing via useState
│   ├── App.css                  # Global shell styles
│   ├── main.jsx                 # React DOM entry point
│   ├── index.css                # Base reset & typography
│   └── components/
│       ├── common/
│       │   ├── Navbar.jsx       # Top navigation bar
│       │   └── Footer.jsx       # Site footer
│       ├── home/
│       │   └── Home.jsx         # Landing page with hero & waste stats
│       ├── role/
│       │   └── RoleSelector.jsx # Student / Admin role picker
│       ├── signup/
│       │   └── Signup.jsx       # Registration form (role-aware)
│       ├── dashboard/
│       │   └── Dashboard.jsx    # Main dashboard (student & admin views)
│       ├── menu/
│       │   └── Menu.jsx         # Weekly mess menu table
│       └── shared/
│           └── MealCard.jsx     # Reusable meal booking card
├── public/                      # Static assets
├── index.html                   # HTML entry point
├── vite.config.js               # Vite + React plugin config
├── package.json
└── .oxlintrc.json               # Oxlint rules
```

---

## 🧭 App Flow

```
Home  →  Role Selector  →  Signup  →  Dashboard
                                    ↳  Menu (via Navbar)
```

The entire routing is managed through a single `page` state in `App.jsx` — no external router needed.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | UI components and state management |
| **Vite 8** | Lightning-fast dev server and bundler |
| **Vanilla CSS** | All styling — no utility frameworks |
| **localStorage** | Persists user profile and meal bookings in-browser |
| **Oxlint** | Fast JavaScript/JSX linting |

> ℹ️ This project intentionally uses only **core React concepts** — `useState`, `useEffect`, `useMemo`, props, and components. No external state library, no router.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or later
- **npm** v9 or later

### Installation

```bash
# Clone the repository
git clone https://github.com/HavishSaini/PlateSync.git
cd PlateSync

# Install dependencies
npm install
```

### Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Other Scripts

```bash
npm run build    # Production build → dist/
npm run preview  # Preview the production build locally
npm run lint     # Run Oxlint checks
```

---

## 🔐 Authentication

PlateSync uses a **localStorage-based demo session** — no backend or database is required.

- Student signup requires a valid `@chitkara.edu.in` email address.
- Supported hostels: Alfred Noble-A/B, Archimedes-A/B, Franklin-A/B.
- User data and bookings persist across browser sessions automatically.

---

## ⏱️ Booking Window

Meal booking is only available during the **45 minutes before each meal starts**:

| Meal      | Serving Time        | Booking Opens |
|-----------|---------------------|---------------|
| Breakfast | 8:00 AM – 9:30 AM   | 7:15 AM       |
| Lunch     | 12:30 PM – 2:30 PM  | 11:45 AM      |
| Snacks    | 4:30 PM – 5:30 PM   | 3:45 PM       |
| Dinner    | 7:30 PM – 9:30 PM   | 6:45 PM       |

This constraint enforces responsible, timely booking behavior.

---

## 📊 Admin Demand Formula

The mess admin's Live Demand view uses this transparent estimation:

```
Recommended Servings = (Bookings × Historical Attendance Rate) + Safety Buffer
```

**Example for Lunch:**
```
238 booked × 91% attendance + 5 buffer = 222 servings
```

---

## 💡 Why PlateSync?

| Without PlateSync | With PlateSync |
|---|---|
| Kitchen guesses demand | Kitchen sees real bookings |
| ~194 kg wasted daily | Est. ~63 kg saved daily |
| No student accountability | Students track their impact |
| No attendance data | Roll-number check-in by staff |

---

## 📄 License

This project is a **student demo project** created for Chitkara University. All menu data and waste figures are approximate, based on hostel mess observations.

---

<p align="center">
  Made with ❤️ to fight food waste, one plate at a time.
</p>
