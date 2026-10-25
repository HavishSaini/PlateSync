// ─── Menu Storage & Scheduling Utility ───────────────────────────────────────
// Manages meal schedules, booking lock validation, and menu overrides.
// Provides shared logic between Admin (menu editing) and Student (today's meals & weekly menu).
// ---------------------------------------------------------------------------

const MENU_OVERRIDES_KEY = 'plateSyncMenuOverrides'

export const DEFAULT_MEALS = [
  { id: 'breakfast', name: 'Breakfast', icon: '☀', startTime: '08:00', endTime: '09:30', time: '8:00 AM – 9:30 AM', waste: '60 kg', menu: 'Mix Parantha · Curd · Chutney · Tea' },
  { id: 'lunch',     name: 'Lunch',     icon: '◐', startTime: '12:30', endTime: '14:30', time: '12:30 PM – 2:30 PM', waste: '60 kg', menu: 'Saboot Mix Dal · Tawa Soya Chaap · Rice · Roti · Raita' },
  { id: 'snacks',    name: 'Snacks',    icon: '☕', startTime: '16:30', endTime: '17:30', time: '4:30 PM – 5:30 PM', waste: '14 kg', menu: 'Vegetable Pasta · Cold Coffee' },
  { id: 'dinner',    name: 'Dinner',    icon: '◑', startTime: '19:30', endTime: '21:30', time: '7:30 PM – 9:30 PM', waste: '60 kg', menu: 'Hari Dal · Chilli Potato · Rice · Roti · Chutney · Laddoo' },
]

export const DEFAULT_WEEKLY_MENU = [
  ['Monday',    'Aloo Paratha · Curd · Butter · Chutney · Tea',            'Rajmah Rasela · Jeera Aloo · Rice · Roti · Boondi Raita',    'Tikki Chaat / Samosa · Tea',  'Moong Masoor Dal · Kadhai Paneer · Rice · Roti · Rasgulla'],
  ['Tuesday',   'Poha · Vegetable Sandwich · Fruit · Tea · Milk',          'Dal Makhani · Mix Vegetable · Rice · Roti · Raita',           'Patty · Tea',                'Mah Chana Dal · Aloo Shimla Mirch · Rice · Roti · Ice Cream'],
  ['Wednesday', 'Macaroni · Garlic Bread · Sweet Daliya · Chaat · Tea',    'Pindi Channa · Seasonal Vegetables · Rice · Roti · Raita',    'Gol Gappe / Cake · Tea',     'Yellow Dal Tadka · Malai Kofta · Rice · Roti · Salad'],
  ['Thursday',  'Ajwain Paratha · Tamater Aloo · Curd · Butter · Tea',     'Kadhi · Aloo Mutter · Rice · Roti · Onion Salad',             'Nacho Chips · Tea',          'Moong Saboot Dal · Mix Vegetables · Rice · Roti · Papad · Halwa'],
  ['Friday',    'Pav Bhaji · Bread Toast & Jam · Tea · Fruit',             'Black Chana · Chinese Nutri · Rice · Roti · Raita',           'Namkeen / Pastry · Tea',     'Saboot Masoor Dal · Paneer Bhurji / Egg Curry · Rice · Roti · Gulab Jamun'],
  ['Saturday',  'Mix Parantha · Curd · Chutney · Tea',                     'Saboot Mix Dal · Tawa Soya Chaap · Rice · Roti · Raita',      'Vegetable Pasta · Cold Coffee', 'Hari Dal · Chilli Potato · Rice · Roti · Chutney · Laddoo'],
  ['Sunday',    'Sunday Special Poori · Aloo Bhaji · Tea',                 'White Channa · Roti Kulcha · Vegetable Jalfrezi · Rice · Raita', 'Biscuits · Tea',        'Mix Dal · Aloo Nutri / Giya Masala · Rice · Roti · Gulab Jamun'],
]

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MEAL_INDEX_MAP = {
  breakfast: 1,
  lunch: 2,
  snacks: 3,
  dinner: 4,
}

// ── Persistence Helpers ──────────────────────────────────────────────────────

export function getStoredOverrides() {
  try {
    const raw = localStorage.getItem(MENU_OVERRIDES_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

function saveOverrides(overrides) {
  try {
    localStorage.setItem(MENU_OVERRIDES_KEY, JSON.stringify(overrides))
  } catch {
    // quota exceeded or disabled
  }
}

// ── Timing & Next Eligible Meal Calculation ──────────────────────────────────

export function getMealTimes(meal, baseDate = new Date()) {
  const [hour, minute] = meal.startTime.split(':').map(Number)
  const mealStart = new Date(baseDate)
  mealStart.setHours(hour, minute, 0, 0)
  // Booking opens 45 minutes before serving begins
  const bookingStart = new Date(mealStart.getTime() - 45 * 60 * 1000)
  return { mealStart, bookingStart }
}

/**
 * Determine the next eligible meal and its lock status.
 *
 * Rules:
 * - Sequentially checks today's meals (Breakfast -> Lunch -> Snacks -> Dinner).
 * - The next upcoming meal is the first one where `now < mealStart`.
 * - If all today's meals have started, rolls over to tomorrow's Breakfast.
 * - `isLocked` is true if `now >= bookingStart` (student booking has opened).
 */
export function getNextEligibleMeal(now = new Date()) {
  for (const meal of DEFAULT_MEALS) {
    const { mealStart, bookingStart } = getMealTimes(meal, now)
    if (now < mealStart) {
      const isLocked = now >= bookingStart
      return {
        meal,
        dateStr: now.toISOString().slice(0, 10),
        isTomorrow: false,
        mealStart,
        bookingStart,
        isLocked,
        lockReason: isLocked ? 'Menu locked because student booking has started.' : null,
      }
    }
  }

  // After dinner has started, the next meal is tomorrow's Breakfast
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowBreakfast = DEFAULT_MEALS[0]
  const { mealStart, bookingStart } = getMealTimes(tomorrowBreakfast, tomorrow)
  const isLocked = now >= bookingStart // false: now is earlier the night before
  return {
    meal: tomorrowBreakfast,
    dateStr: tomorrow.toISOString().slice(0, 10),
    isTomorrow: true,
    mealStart,
    bookingStart,
    isLocked,
    lockReason: isLocked ? 'Menu locked because student booking has started.' : null,
  }
}

/**
 * Determine the current active meal period or upcoming meal period for attendance check-in.
 */
export function getAttendancePeriodInfo(now = new Date()) {
  const parseTime = (timeStr, baseDate) => {
    const [h, m] = timeStr.split(':').map(Number)
    const d = new Date(baseDate)
    d.setHours(h, m, 0, 0)
    return d
  }
  const formatHourMin = (d) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

  // 1. Check if any meal is currently active (serving in progress)
  for (const meal of DEFAULT_MEALS) {
    const mealStart = parseTime(meal.startTime, now)
    const mealEnd = parseTime(meal.endTime || meal.startTime, now)
    if (now >= mealStart && now < mealEnd) {
      return {
        status: 'active',
        meal,
        targetTime: mealEnd,
        label: `TIME LEFT FOR ${meal.name.toUpperCase()} SERVING`,
        detail: `Attendance can be marked at the mess counter until ${formatHourMin(mealEnd)} for ${meal.name}.`,
      }
    }
  }

  // 2. Check for upcoming meal today
  for (const meal of DEFAULT_MEALS) {
    const mealStart = parseTime(meal.startTime, now)
    if (now < mealStart) {
      return {
        status: 'upcoming',
        meal,
        targetTime: mealStart,
        label: `TIME UNTIL ${meal.name.toUpperCase()} CHECK-IN OPENS`,
        detail: `Attendance check-in for ${meal.name} opens at ${formatHourMin(mealStart)} (${meal.time}).`,
      }
    }
  }

  // 3. Past dinner: next is tomorrow's Breakfast
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowBreakfast = DEFAULT_MEALS[0]
  const breakfastStart = parseTime(tomorrowBreakfast.startTime, tomorrow)

  return {
    status: 'tomorrow',
    meal: tomorrowBreakfast,
    targetTime: breakfastStart,
    label: 'TIME UNTIL TOMORROW BREAKFAST CHECK-IN',
    detail: 'All meal periods for today have finished. Next check-in opens tomorrow at 8:00 AM for Breakfast.',
  }
}

// ── Retrieval ────────────────────────────────────────────────────────────────

export function getMealMenu(mealId, dateStr = new Date().toISOString().slice(0, 10)) {
  const overrides = getStoredOverrides()
  const dateKey = `${dateStr}_${mealId}`
  if (overrides[dateKey]) return overrides[dateKey]
  if (overrides[mealId]) return overrides[mealId]
  const defaultMeal = DEFAULT_MEALS.find(m => m.id === mealId)
  return defaultMeal ? defaultMeal.menu : ''
}

export function getMealsForToday(now = new Date()) {
  const dateStr = now.toISOString().slice(0, 10)
  return DEFAULT_MEALS.map(meal => ({
    ...meal,
    menu: getMealMenu(meal.id, dateStr),
  }))
}

export function getWeeklyMenu(now = new Date()) {
  const currentDayName = DAY_NAMES[now.getDay()]
  const dateStr = now.toISOString().slice(0, 10)
  return DEFAULT_WEEKLY_MENU.map(row => {
    const day = row[0]
    if (day !== currentDayName) {
      return [...row]
    }
    const updatedRow = [...row]
    DEFAULT_MEALS.forEach(meal => {
      const idx = MEAL_INDEX_MAP[meal.id]
      if (idx) {
        updatedRow[idx] = getMealMenu(meal.id, dateStr)
      }
    })
    return updatedRow
  })
}

// ── Mutation with Strict Shared Locking ───────────────────────────────────────

/**
 * Update the menu for the next eligible meal.
 *
 * Strict Shared Rules:
 * - Reject if mealId is NOT the next eligible meal.
 * - Reject if student booking has already opened (`now >= bookingStart`).
 * - Persist valid changes and emit event for live synchronization.
 */
export function saveMealMenu({ mealId, menuText, now = new Date() }) {
  const nextInfo = getNextEligibleMeal(now)

  if (nextInfo.meal.id !== mealId) {
    return {
      success: false,
      error: `Only the next eligible meal (${nextInfo.meal.name}) can be edited.`,
    }
  }

  if (nextInfo.isLocked) {
    return {
      success: false,
      error: 'Menu locked because student booking has started.',
    }
  }

  const cleanText = menuText?.trim()
  if (!cleanText) {
    return {
      success: false,
      error: 'Menu items cannot be empty.',
    }
  }

  const overrides = getStoredOverrides()
  const key = `${nextInfo.dateStr}_${mealId}`
  overrides[key] = cleanText
  overrides[mealId] = cleanText
  saveOverrides(overrides)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('plateSyncMenuUpdate', {
      detail: { mealId, dateStr: nextInfo.dateStr, menu: cleanText }
    }))
  }

  return {
    success: true,
    meal: nextInfo.meal,
    menu: cleanText,
    dateStr: nextInfo.dateStr,
  }
}
