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

// ─── Nutrition & Allergen Storage & Data System ──────────────────────────────
// Stores dish-level macronutrients, ingredients, confirmed allergens,
// cross-contact warnings, and verification states.
// -----------------------------------------------------------------------------

export const DISH_NUTRITION_KEY = 'plateSyncDishNutrition'

export const COMMON_ALLERGENS = [
  'Wheat / Gluten',
  'Milk / Dairy',
  'Peanuts',
  'Tree Nuts',
  'Soy',
  'Sesame',
  'Eggs',
]

export const DEFAULT_DISH_NUTRITION = {
  'mix parantha': {
    name: 'Mix Parantha',
    mealCategory: 'Breakfast',
    servingSize: '1 parantha (130g)',
    calories: 280,
    protein: 6.0,
    carbs: 42.0,
    fat: 10.0,
    fiber: 4.5,
    ingredients: 'Whole wheat flour (atta), boiled potatoes, grated cauliflower, green chili, coriander, carom seeds (ajwain), refined vegetable oil',
    confirmedAllergens: ['Wheat / Gluten'],
    crossContact: ['Shared griddle used for items with dairy and sesame'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative hostel kitchen estimate — pending dietitian lab sign-off. Confirm with mess staff if allergic.',
  },
  'curd': {
    name: 'Curd',
    mealCategory: 'Breakfast',
    servingSize: '1 bowl (100g)',
    calories: 98,
    protein: 4.0,
    carbs: 5.0,
    fat: 4.3,
    fiber: 0.0,
    ingredients: 'Pasteurized toned cow milk, active lactic cultures',
    confirmedAllergens: ['Milk / Dairy'],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative hostel kitchen estimate — pending dietitian lab sign-off.',
  },
  'butter': {
    name: 'Butter',
    mealCategory: 'Breakfast',
    servingSize: '1 chiplet (10g)',
    calories: 72,
    protein: 0.1,
    carbs: 0.1,
    fat: 8.1,
    fiber: 0.0,
    ingredients: 'Pasteurized cream, iodized salt',
    confirmedAllergens: ['Milk / Dairy'],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Commercial packaged butter — illustrative nutrition estimate.',
  },
  'chutney': {
    name: 'Chutney',
    mealCategory: 'Breakfast',
    servingSize: '2 tbsp (30g)',
    calories: 25,
    protein: 0.8,
    carbs: 3.2,
    fat: 0.5,
    fiber: 1.2,
    ingredients: 'Fresh mint leaves, fresh coriander, green chilies, ginger, lemon juice, rock salt, roasted cumin',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Kitchen prepared daily fresh — illustrative estimate.',
  },
  'tea': {
    name: 'Tea',
    mealCategory: 'Breakfast',
    servingSize: '1 cup (150ml)',
    calories: 85,
    protein: 2.5,
    carbs: 12.0,
    fat: 2.8,
    fiber: 0.0,
    ingredients: 'Water, pasteurized milk, black tea leaves, cane sugar, crushed green cardamom, ginger',
    confirmedAllergens: ['Milk / Dairy'],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative estimate — sugar content may vary per batch.',
  },
  'milk': {
    name: 'Milk',
    mealCategory: 'Breakfast',
    servingSize: '1 glass (200ml)',
    calories: 124,
    protein: 6.4,
    carbs: 9.8,
    fat: 6.2,
    fiber: 0.0,
    ingredients: 'Pasteurized toned cow milk, boiled',
    confirmedAllergens: ['Milk / Dairy'],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Standard dairy estimate.',
  },
  'aloo paratha': {
    name: 'Aloo Paratha',
    mealCategory: 'Breakfast',
    servingSize: '1 parantha (140g)',
    calories: 295,
    protein: 5.5,
    carbs: 45.0,
    fat: 10.5,
    fiber: 4.2,
    ingredients: 'Whole wheat flour, boiled potatoes, green chili, onion, fresh coriander, spices, vegetable oil',
    confirmedAllergens: ['Wheat / Gluten'],
    crossContact: ['Shared tawa with butter/ghee'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative hostel kitchen estimate — confirm with staff.',
  },
  'poha': {
    name: 'Poha',
    mealCategory: 'Breakfast',
    servingSize: '1 plate (160g)',
    calories: 215,
    protein: 4.2,
    carbs: 37.0,
    fat: 6.0,
    fiber: 3.1,
    ingredients: 'Flattened rice (poha), roasted peanuts, mustard seeds, curry leaves, green chilies, turmeric, onion, fresh lemon',
    confirmedAllergens: ['Peanuts'],
    crossContact: ['Mustard seeds present'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Contains peanuts — illustrative estimate.',
  },
  'vegetable sandwich': {
    name: 'Vegetable Sandwich',
    mealCategory: 'Breakfast',
    servingSize: '2 triangles (130g)',
    calories: 210,
    protein: 5.8,
    carbs: 32.0,
    fat: 6.8,
    fiber: 3.0,
    ingredients: 'White and brown wheat bread, cucumber, tomato, green bell pepper, mint-coriander spread, butter',
    confirmedAllergens: ['Wheat / Gluten', 'Milk / Dairy'],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative estimate.',
  },
  'fruit': {
    name: 'Fruit',
    mealCategory: 'Breakfast',
    servingSize: '1 medium piece (banana/apple)',
    calories: 89,
    protein: 1.1,
    carbs: 22.8,
    fat: 0.3,
    fiber: 2.6,
    ingredients: 'Fresh seasonal whole fruit (washed banana, apple, or orange)',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Natural whole fruit — standard agricultural estimate.',
  },
  'macaroni': {
    name: 'Macaroni',
    mealCategory: 'Breakfast',
    servingSize: '1 bowl (180g)',
    calories: 250,
    protein: 7.2,
    carbs: 44.0,
    fat: 5.0,
    fiber: 3.0,
    ingredients: 'Durum wheat semolina macaroni, tomatoes, onions, capsicum, tomato puree, spices, oil',
    confirmedAllergens: ['Wheat / Gluten'],
    crossContact: ['May contain dairy traces from shared utensil handling'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative hostel kitchen estimate.',
  },
  'garlic bread': {
    name: 'Garlic Bread',
    mealCategory: 'Breakfast',
    servingSize: '2 slices (60g)',
    calories: 180,
    protein: 4.5,
    carbs: 24.0,
    fat: 7.5,
    fiber: 1.5,
    ingredients: 'Refined wheat bread, butter, minced fresh garlic, parsley, oregano seasoning',
    confirmedAllergens: ['Wheat / Gluten', 'Milk / Dairy'],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative estimate.',
  },
  'sweet daliya': {
    name: 'Sweet Daliya',
    mealCategory: 'Breakfast',
    servingSize: '1 bowl (180g)',
    calories: 220,
    protein: 6.5,
    carbs: 40.0,
    fat: 3.8,
    fiber: 4.5,
    ingredients: 'Broken cracked wheat (daliya), pasteurized milk, sugar, cardamom',
    confirmedAllergens: ['Wheat / Gluten', 'Milk / Dairy'],
    crossContact: ['May contain traces of tree nuts from shared boiling vessel'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative hostel estimate.',
  },
  'ajwain paratha': {
    name: 'Ajwain Paratha',
    mealCategory: 'Breakfast',
    servingSize: '1 parantha (110g)',
    calories: 260,
    protein: 5.2,
    carbs: 38.0,
    fat: 9.5,
    fiber: 3.8,
    ingredients: 'Whole wheat flour, carom seeds (ajwain), salt, refined vegetable oil',
    confirmedAllergens: ['Wheat / Gluten'],
    crossContact: ['Shared tawa griddle'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative estimate.',
  },
  'pav bhaji': {
    name: 'Pav Bhaji',
    mealCategory: 'Breakfast',
    servingSize: '2 pav buns + 150g bhaji',
    calories: 390,
    protein: 8.5,
    carbs: 58.0,
    fat: 14.0,
    fiber: 5.8,
    ingredients: 'Refined wheat pav buns, potatoes, cauliflower, green peas, capsicum, tomatoes, pav bhaji masala, butter',
    confirmedAllergens: ['Wheat / Gluten', 'Milk / Dairy'],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative hostel estimate — contains butter.',
  },
  'bread toast & jam': {
    name: 'Bread Toast & Jam',
    mealCategory: 'Breakfast',
    servingSize: '2 slices toast with 20g mixed fruit jam',
    calories: 195,
    protein: 4.2,
    carbs: 41.0,
    fat: 1.8,
    fiber: 2.0,
    ingredients: 'White wheat bread, commercial mixed fruit jam (sugar, apple pulp, pectin)',
    confirmedAllergens: ['Wheat / Gluten'],
    crossContact: ['Toaster shared with buttered bread'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Commercial packaged ingredients — illustrative estimate.',
  },
  'sunday special poori': {
    name: 'Sunday Special Poori',
    mealCategory: 'Breakfast',
    servingSize: '3 pooris (100g)',
    calories: 340,
    protein: 5.8,
    carbs: 42.0,
    fat: 16.5,
    fiber: 3.0,
    ingredients: 'Whole wheat flour, semolina (sooji), salt, vegetable oil for deep frying',
    confirmedAllergens: ['Wheat / Gluten'],
    crossContact: ['Shared deep fryer oil'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Deep fried item — illustrative hostel estimate.',
  },
  'aloo bhaji': {
    name: 'Aloo Bhaji',
    mealCategory: 'Breakfast',
    servingSize: '1 bowl (150g)',
    calories: 145,
    protein: 2.4,
    carbs: 22.0,
    fat: 5.5,
    fiber: 2.8,
    ingredients: 'Boiled potatoes, cumin seeds, mustard seeds, turmeric, green chilies, coriander, vegetable oil',
    confirmedAllergens: [],
    crossContact: ['Mustard seeds present'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative hostel kitchen estimate.',
  },
  'saboot mix dal': {
    name: 'Saboot Mix Dal',
    mealCategory: 'Lunch',
    servingSize: '1 bowl (160g)',
    calories: 175,
    protein: 9.0,
    carbs: 24.5,
    fat: 4.5,
    fiber: 6.2,
    ingredients: 'Whole black gram (urad saboot), rajma, chana dal, onions, tomatoes, ginger, garlic, cumin, coriander, oil',
    confirmedAllergens: [],
    crossContact: ['Prepared in kitchen that uses dairy (ghee/butter)'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative hostel kitchen estimate — high fiber.',
  },
  'tawa soya chaap': {
    name: 'Tawa Soya Chaap',
    mealCategory: 'Lunch',
    servingSize: '1 plate (160g)',
    calories: 240,
    protein: 18.0,
    carbs: 14.0,
    fat: 12.0,
    fiber: 3.8,
    ingredients: 'Defatted soya flour, vital wheat gluten, tomato-onion gravy, ginger-garlic paste, kasuri methi, garam masala, refined oil',
    confirmedAllergens: ['Soy', 'Wheat / Gluten'],
    crossContact: ['Cookware shared with dairy gravies'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Contains soy & wheat gluten — illustrative estimate.',
  },
  'rice': {
    name: 'Rice',
    mealCategory: 'Lunch',
    servingSize: '1 plate (150g cooked)',
    calories: 130,
    protein: 2.7,
    carbs: 28.2,
    fat: 0.4,
    fiber: 0.4,
    ingredients: 'Steamed basmati rice grain, filtered water',
    confirmedAllergens: [],
    crossContact: ['Cooked in communal steam kettles'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Plain steamed rice — naturally gluten-free grain.',
  },
  'roti': {
    name: 'Roti',
    mealCategory: 'Lunch',
    servingSize: '2 rotis (70g)',
    calories: 155,
    protein: 5.0,
    carbs: 31.0,
    fat: 1.2,
    fiber: 4.4,
    ingredients: '100% whole wheat stone-ground flour (atta), water',
    confirmedAllergens: ['Wheat / Gluten'],
    crossContact: ['Dusting flour contains wheat'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Freshly puffed Indian flatbread — illustrative estimate.',
  },
  'raita': {
    name: 'Raita',
    mealCategory: 'Lunch',
    servingSize: '1 bowl (120g)',
    calories: 88,
    protein: 3.6,
    carbs: 6.2,
    fat: 3.9,
    fiber: 0.6,
    ingredients: 'Fresh churned curd, diced cucumber, roasted cumin powder, black salt, coriander',
    confirmedAllergens: ['Milk / Dairy'],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative hostel kitchen estimate.',
  },
  'boondi raita': {
    name: 'Boondi Raita',
    mealCategory: 'Lunch',
    servingSize: '1 bowl (120g)',
    calories: 125,
    protein: 4.1,
    carbs: 11.5,
    fat: 6.8,
    fiber: 0.8,
    ingredients: 'Curd, crispy fried chickpea flour boondi, roasted cumin, black salt, mint',
    confirmedAllergens: ['Milk / Dairy'],
    crossContact: ['Boondi prepared in facility handling wheat and mustard'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Contains dairy — illustrative estimate.',
  },
  'rajmah rasela': {
    name: 'Rajmah Rasela',
    mealCategory: 'Lunch',
    servingSize: '1 bowl (170g)',
    calories: 195,
    protein: 9.8,
    carbs: 28.0,
    fat: 5.0,
    fiber: 7.2,
    ingredients: 'Red kidney beans (rajmah), tomato puree, onions, ginger, garlic, degi mirch, garam masala, oil',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative estimate — naturally protein and fiber rich.',
  },
  'jeera aloo': {
    name: 'Jeera Aloo',
    mealCategory: 'Lunch',
    servingSize: '1 bowl (140g)',
    calories: 160,
    protein: 2.5,
    carbs: 24.0,
    fat: 6.5,
    fiber: 3.0,
    ingredients: 'Diced boiled potatoes, whole cumin seeds, turmeric, green chili, rock salt, vegetable oil',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative hostel kitchen estimate.',
  },
  'dal makhani': {
    name: 'Dal Makhani',
    mealCategory: 'Lunch',
    servingSize: '1 bowl (170g)',
    calories: 285,
    protein: 10.5,
    carbs: 27.0,
    fat: 14.5,
    fiber: 7.0,
    ingredients: 'Whole black lentils (urad), rajmah, pasteurized dairy butter, fresh cream, tomato puree, ginger, garlic, kasuri methi',
    confirmedAllergens: ['Milk / Dairy'],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Contains butter and dairy cream — illustrative estimate.',
  },
  'mix vegetable': {
    name: 'Mix Vegetable',
    mealCategory: 'Lunch',
    servingSize: '1 bowl (150g)',
    calories: 140,
    protein: 3.2,
    carbs: 18.0,
    fat: 6.2,
    fiber: 4.5,
    ingredients: 'Carrots, green peas, beans, cauliflower, potatoes, onions, tomato, cumin, turmeric, spices, oil',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative hostel estimate.',
  },
  'pindi channa': {
    name: 'Pindi Channa',
    mealCategory: 'Lunch',
    servingSize: '1 bowl (160g)',
    calories: 210,
    protein: 10.2,
    carbs: 32.0,
    fat: 5.2,
    fiber: 7.8,
    ingredients: 'White chickpeas, dried pomegranate seeds (anardana), black tea leaves for coloration, ginger juliennes, carom, chana masala, oil',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative hostel estimate — rich in plant protein.',
  },
  'kadhi': {
    name: 'Kadhi',
    mealCategory: 'Lunch',
    servingSize: '1 bowl (160g)',
    calories: 185,
    protein: 6.2,
    carbs: 17.5,
    fat: 10.0,
    fiber: 2.1,
    ingredients: 'Sour curd, chickpea flour (besan), fried besan pakodas, fenugreek seeds, mustard seeds, curry leaves, turmeric, oil',
    confirmedAllergens: ['Milk / Dairy'],
    crossContact: ['Mustard seeds present, pakoda oil shared'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Contains curd (dairy) — illustrative estimate.',
  },
  'aloo mutter': {
    name: 'Aloo Mutter',
    mealCategory: 'Lunch',
    servingSize: '1 bowl (150g)',
    calories: 155,
    protein: 3.8,
    carbs: 23.0,
    fat: 5.5,
    fiber: 3.8,
    ingredients: 'Potatoes, tender green peas, tomato gravy, onions, ginger, turmeric, coriander powder, oil',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative estimate.',
  },
  'black chana': {
    name: 'Black Chana',
    mealCategory: 'Lunch',
    servingSize: '1 bowl (160g)',
    calories: 190,
    protein: 9.5,
    carbs: 28.0,
    fat: 4.8,
    fiber: 8.5,
    ingredients: 'Kala chana (black Bengal gram), ginger, garlic, tomatoes, cumin, coriander, spices, vegetable oil',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'High fiber Indian legume curry — illustrative estimate.',
  },
  'chinese nutri': {
    name: 'Chinese Nutri',
    mealCategory: 'Lunch',
    servingSize: '1 bowl (150g)',
    calories: 220,
    protein: 16.5,
    carbs: 16.0,
    fat: 9.5,
    fiber: 4.0,
    ingredients: 'Soya chunks (nutri), capsicum, onions, soy sauce, green chili sauce, vinegar, garlic, cornflour, oil',
    confirmedAllergens: ['Soy', 'Wheat / Gluten'],
    crossContact: ['Soy sauce contains wheat and soy'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Contains soy & wheat — illustrative estimate.',
  },
  'white channa': {
    name: 'White Channa',
    mealCategory: 'Lunch',
    servingSize: '1 bowl (160g)',
    calories: 205,
    protein: 10.0,
    carbs: 31.0,
    fat: 5.0,
    fiber: 7.5,
    ingredients: 'Kabuli chana (chickpeas), onions, tomato gravy, tea bags for color, ginger, amchur, oil',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative estimate.',
  },
  'roti kulcha': {
    name: 'Roti Kulcha',
    mealCategory: 'Lunch',
    servingSize: '1 kulcha (80g)',
    calories: 185,
    protein: 5.2,
    carbs: 35.0,
    fat: 2.8,
    fiber: 2.6,
    ingredients: 'Wheat flour, curd, baking powder, coriander, nigella seeds (kalonji), butter wash',
    confirmedAllergens: ['Wheat / Gluten', 'Milk / Dairy'],
    crossContact: ['Sesame seeds processed in same prep table'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Contains wheat gluten and curd — illustrative estimate.',
  },
  'vegetable jalfrezi': {
    name: 'Vegetable Jalfrezi',
    mealCategory: 'Lunch',
    servingSize: '1 bowl (150g)',
    calories: 150,
    protein: 3.5,
    carbs: 19.0,
    fat: 6.8,
    fiber: 4.2,
    ingredients: 'Julienne capsicum, carrots, baby corn, paneer cubes, onions, sweet and sour tomato gravy, oil',
    confirmedAllergens: ['Milk / Dairy'],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Contains paneer (dairy) — illustrative estimate.',
  },
  'vegetable pasta': {
    name: 'Vegetable Pasta',
    mealCategory: 'Snacks',
    servingSize: '1 bowl (180g)',
    calories: 260,
    protein: 7.5,
    carbs: 46.0,
    fat: 5.2,
    fiber: 3.2,
    ingredients: 'Semolina durum wheat pasta, red & green bell peppers, sweet corn, onion, tomato-herb sauce, refined oil',
    confirmedAllergens: ['Wheat / Gluten'],
    crossContact: ['Cheese/milk cross-contact possible from snack counter'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Contains durum wheat semolina — illustrative estimate.',
  },
  'cold coffee': {
    name: 'Cold Coffee',
    mealCategory: 'Snacks',
    servingSize: '1 glass (220ml)',
    calories: 170,
    protein: 4.8,
    carbs: 24.0,
    fat: 6.2,
    fiber: 0.0,
    ingredients: 'Pasteurized toned milk, instant brewed coffee powder, cane sugar, ice cubes',
    confirmedAllergens: ['Milk / Dairy'],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Contains dairy milk — illustrative estimate.',
  },
  'samosa': {
    name: 'Samosa',
    mealCategory: 'Snacks',
    servingSize: '1 piece (80g)',
    calories: 255,
    protein: 3.8,
    carbs: 31.0,
    fat: 13.5,
    fiber: 2.2,
    ingredients: 'Refined wheat flour (maida), potatoes, green peas, cumin, coriander seeds, ajwain, refined frying oil',
    confirmedAllergens: ['Wheat / Gluten'],
    crossContact: ['Shared deep fryer oil with other wheat snacks'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Deep-fried wheat snack — illustrative estimate.',
  },
  'patty': {
    name: 'Patty',
    mealCategory: 'Snacks',
    servingSize: '1 piece (85g)',
    calories: 275,
    protein: 4.5,
    carbs: 29.0,
    fat: 16.0,
    fiber: 2.0,
    ingredients: 'Puff pastry (refined wheat flour, bakery shortening/margarine), potato, green peas, spices',
    confirmedAllergens: ['Wheat / Gluten'],
    crossContact: ['Margarine / dairy traces possible in commercial puff pastry'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative hostel snack estimate.',
  },
  'cake': {
    name: 'Cake',
    mealCategory: 'Snacks',
    servingSize: '1 slice (65g)',
    calories: 230,
    protein: 3.2,
    carbs: 34.0,
    fat: 9.0,
    fiber: 0.8,
    ingredients: 'Refined wheat flour, sugar, vegetable oil, condensed milk, baking powder, vanilla essence',
    confirmedAllergens: ['Wheat / Gluten', 'Milk / Dairy'],
    crossContact: ['Eggless commercial recipe; prepared in bakery handling eggs and tree nuts'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Contains wheat & dairy — illustrative estimate.',
  },
  'hari dal': {
    name: 'Hari Dal',
    mealCategory: 'Dinner',
    servingSize: '1 bowl (160g)',
    calories: 165,
    protein: 8.5,
    carbs: 22.0,
    fat: 4.2,
    fiber: 5.5,
    ingredients: 'Whole green moong beans, garlic, ginger, tomatoes, turmeric, cumin seeds, green chili, oil',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative hostel kitchen estimate — naturally nutrient dense.',
  },
  'chilli potato': {
    name: 'Chilli Potato',
    mealCategory: 'Dinner',
    servingSize: '1 plate (150g)',
    calories: 215,
    protein: 3.0,
    carbs: 33.0,
    fat: 8.5,
    fiber: 2.8,
    ingredients: 'Crisp fried potatoes, capsicum, sliced onion, soy sauce, green chili sauce, garlic, cornflour, oil',
    confirmedAllergens: ['Soy'],
    crossContact: ['Shared deep fryer oil with wheat snacks; soy sauce may contain wheat'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Contains soy — illustrative estimate.',
  },
  'laddoo': {
    name: 'Laddoo',
    mealCategory: 'Dinner',
    servingSize: '1 piece (45g)',
    calories: 185,
    protein: 3.0,
    carbs: 26.0,
    fat: 8.0,
    fiber: 1.2,
    ingredients: 'Chickpea flour (besan), sugar syrup, clarified butter (ghee), cardamom powder, melon seeds (magaz)',
    confirmedAllergens: ['Milk / Dairy'],
    crossContact: ['May contain traces of Tree Nuts (almonds/cashews) from sweet shop packaging'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Traditional Indian sweet — contains dairy ghee.',
  },
  'moong masoor dal': {
    name: 'Moong Masoor Dal',
    mealCategory: 'Dinner',
    servingSize: '1 bowl (160g)',
    calories: 160,
    protein: 9.0,
    carbs: 23.0,
    fat: 3.8,
    fiber: 5.2,
    ingredients: 'Yellow split moong dal, red masoor dal, tomatoes, onions, garlic, cumin tadka, oil',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative hostel estimate.',
  },
  'kadhai paneer': {
    name: 'Kadhai Paneer',
    mealCategory: 'Dinner',
    servingSize: '1 bowl (160g)',
    calories: 280,
    protein: 15.0,
    carbs: 9.5,
    fat: 21.0,
    fiber: 2.2,
    ingredients: 'Fresh cottage cheese (paneer), green bell peppers, onions, crushed coriander seeds, dry red chilies, kasuri methi, vegetable oil',
    confirmedAllergens: ['Milk / Dairy'],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'High protein vegetarian dish — contains dairy.',
  },
  'rasgulla': {
    name: 'Rasgulla',
    mealCategory: 'Dinner',
    servingSize: '1 piece (50g)',
    calories: 125,
    protein: 2.8,
    carbs: 26.0,
    fat: 1.5,
    fiber: 0.0,
    ingredients: 'Cottage cheese (chhena / dairy milk solids), semolina binder, refined sugar syrup, rose water',
    confirmedAllergens: ['Milk / Dairy', 'Wheat / Gluten'],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Contains milk and semolina wheat binder — illustrative estimate.',
  },
  'mah chana dal': {
    name: 'Mah Chana Dal',
    mealCategory: 'Dinner',
    servingSize: '1 bowl (160g)',
    calories: 180,
    protein: 9.2,
    carbs: 25.0,
    fat: 4.8,
    fiber: 6.5,
    ingredients: 'Split black urad dal, chana dal, onions, tomatoes, ginger, cumin, coriander, oil',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative hostel estimate.',
  },
  'aloo shimla mirch': {
    name: 'Aloo Shimla Mirch',
    mealCategory: 'Dinner',
    servingSize: '1 bowl (140g)',
    calories: 145,
    protein: 2.6,
    carbs: 21.0,
    fat: 5.8,
    fiber: 3.2,
    ingredients: 'Diced potatoes, green capsicum, onions, turmeric, cumin, vegetable oil',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative estimate.',
  },
  'ice cream': {
    name: 'Ice Cream',
    mealCategory: 'Dinner',
    servingSize: '1 cup (80ml)',
    calories: 160,
    protein: 2.8,
    carbs: 19.0,
    fat: 8.2,
    fiber: 0.0,
    ingredients: 'Pasteurized milk, cream, sugar, stabilizer (INS 412), vanilla flavoring',
    confirmedAllergens: ['Milk / Dairy'],
    crossContact: ['Facility processes peanuts, tree nuts, and gluten'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Commercial packaged ice cream — contains dairy.',
  },
  'yellow dal tadka': {
    name: 'Yellow Dal Tadka',
    mealCategory: 'Dinner',
    servingSize: '1 bowl (160g)',
    calories: 155,
    protein: 8.2,
    carbs: 22.5,
    fat: 3.9,
    fiber: 5.0,
    ingredients: 'Yellow arhar/toor dal, tomatoes, onions, garlic, cumin, mustard seeds, dry red chili, oil',
    confirmedAllergens: [],
    crossContact: ['Mustard seeds present in tadka'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative estimate.',
  },
  'malai kofta': {
    name: 'Malai Kofta',
    mealCategory: 'Dinner',
    servingSize: '1 bowl (170g)',
    calories: 320,
    protein: 8.5,
    carbs: 24.0,
    fat: 22.0,
    fiber: 2.5,
    ingredients: 'Paneer and potato dumplings (koftas), cornflour, cashew paste, melon seed paste, dairy cream, tomato gravy, butter, spices',
    confirmedAllergens: ['Milk / Dairy', 'Tree Nuts'],
    crossContact: ['Cashew nut paste integral to gravy; contains wheat flour dusting'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Contains tree nuts (cashews) and dairy — illustrative estimate.',
  },
  'moong saboot dal': {
    name: 'Moong Saboot Dal',
    mealCategory: 'Dinner',
    servingSize: '1 bowl (160g)',
    calories: 165,
    protein: 8.8,
    carbs: 22.5,
    fat: 4.0,
    fiber: 5.8,
    ingredients: 'Whole green moong dal, ginger, garlic, tomatoes, cumin, turmeric, vegetable oil',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative estimate.',
  },
  'mix vegetables': {
    name: 'Mix Vegetables',
    mealCategory: 'Dinner',
    servingSize: '1 bowl (150g)',
    calories: 140,
    protein: 3.2,
    carbs: 18.0,
    fat: 6.2,
    fiber: 4.5,
    ingredients: 'Carrots, green peas, beans, cauliflower, potatoes, spices, vegetable oil',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative estimate.',
  },
  'halwa': {
    name: 'Halwa',
    mealCategory: 'Dinner',
    servingSize: '1 small bowl (80g)',
    calories: 280,
    protein: 3.5,
    carbs: 42.0,
    fat: 11.5,
    fiber: 1.5,
    ingredients: 'Semolina (sooji), clarified butter (ghee), sugar, cardamom, water',
    confirmedAllergens: ['Wheat / Gluten', 'Milk / Dairy'],
    crossContact: ['May contain traces of tree nuts (almonds)'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Contains wheat gluten and dairy ghee — illustrative estimate.',
  },
  'saboot masoor dal': {
    name: 'Saboot Masoor Dal',
    mealCategory: 'Dinner',
    servingSize: '1 bowl (160g)',
    calories: 170,
    protein: 9.4,
    carbs: 24.0,
    fat: 4.0,
    fiber: 6.0,
    ingredients: 'Whole brown masoor lentils, onions, garlic, tomatoes, turmeric, cumin, oil',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative estimate.',
  },
  'paneer bhurji': {
    name: 'Paneer Bhurji',
    mealCategory: 'Dinner',
    servingSize: '1 bowl (150g)',
    calories: 275,
    protein: 16.0,
    carbs: 6.5,
    fat: 21.0,
    fiber: 1.8,
    ingredients: 'Crumbled cottage cheese (paneer), onions, tomatoes, green chilies, ginger, butter, turmeric, fresh coriander',
    confirmedAllergens: ['Milk / Dairy'],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'High protein dairy dish — illustrative estimate.',
  },
  'egg curry': {
    name: 'Egg Curry',
    mealCategory: 'Dinner',
    servingSize: '2 boiled eggs in gravy (180g)',
    calories: 215,
    protein: 14.5,
    carbs: 7.0,
    fat: 14.5,
    fiber: 1.2,
    ingredients: 'Boiled poultry eggs, onion-tomato gravy, ginger-garlic paste, garam masala, turmeric, vegetable oil',
    confirmedAllergens: ['Eggs'],
    crossContact: ['Prepared in designated non-veg section of kitchen'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Contains eggs — illustrative estimate.',
  },
  'gulab jamun': {
    name: 'Gulab Jamun',
    mealCategory: 'Dinner',
    servingSize: '1 piece (45g)',
    calories: 175,
    protein: 3.0,
    carbs: 30.0,
    fat: 5.5,
    fiber: 0.5,
    ingredients: 'Milk solids (khoya), refined wheat flour (maida), sugar syrup, cardamom, rose water',
    confirmedAllergens: ['Milk / Dairy', 'Wheat / Gluten'],
    crossContact: ['May contain traces of tree nuts (pistachios/almonds)'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Contains milk and wheat gluten — illustrative estimate.',
  },
  'mix dal': {
    name: 'Mix Dal',
    mealCategory: 'Dinner',
    servingSize: '1 bowl (160g)',
    calories: 170,
    protein: 8.9,
    carbs: 23.5,
    fat: 4.2,
    fiber: 5.6,
    ingredients: 'Blend of toor, moong, and masoor dals, onions, garlic, tomatoes, cumin, turmeric, oil',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'Illustrative hostel estimate.',
  },

  // ── Dishes with intentionally MISSING nutrition information ─────────────────
  // These demonstrate transparent handling: "Nutrition information not available"
  // and safety notice: "Unknown allergen status - confirm with mess staff"
  'seasonal vegetables': {
    name: 'Seasonal Vegetables',
    mealCategory: 'Lunch',
    servingSize: 'Standard mess serving',
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
    ingredients: '',
    confirmedAllergens: [],
    crossContact: ['Prepared in communal kitchen prep area'],
    verified: false,
    verificationStatus: 'pending',
    verificationNotes: 'Seasonal recipe varies depending on market procurement. Nutrition data not yet submitted by kitchen.',
  },
  'nacho chips': {
    name: 'Nacho Chips',
    mealCategory: 'Snacks',
    servingSize: '1 portion (40g)',
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
    ingredients: '',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'pending',
    verificationNotes: 'Packaged snack — detailed lab values not yet logged in hostel records.',
  },
  'tikki chaat': {
    name: 'Tikki Chaat',
    mealCategory: 'Snacks',
    servingSize: '1 plate (150g)',
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
    ingredients: '',
    confirmedAllergens: [],
    crossContact: ['Street snack counter — potential gluten and dairy cross-contact'],
    verified: false,
    verificationStatus: 'pending',
    verificationNotes: 'Nutrition and allergen data pending kitchen submission.',
  },
  'chaat': {
    name: 'Chaat',
    mealCategory: 'Breakfast',
    servingSize: '1 portion (120g)',
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
    ingredients: '',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'pending',
    verificationNotes: 'Nutrition information not available.',
  },
  'tamater aloo': {
    name: 'Tamater Aloo',
    mealCategory: 'Breakfast',
    servingSize: '1 bowl (140g)',
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
    ingredients: '',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'pending',
    verificationNotes: 'Nutrition information not available.',
  },
  'namkeen': {
    name: 'Namkeen',
    mealCategory: 'Snacks',
    servingSize: '1 bowl (40g)',
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
    ingredients: '',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'pending',
    verificationNotes: 'Assorted commercial namkeen — nutrition data pending.',
  },
  'biscuits': {
    name: 'Biscuits',
    mealCategory: 'Snacks',
    servingSize: '3 biscuits (30g)',
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
    ingredients: '',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'pending',
    verificationNotes: 'Commercial tea biscuits — nutrition information not available.',
  },
  'giya masala': {
    name: 'Giya Masala',
    mealCategory: 'Dinner',
    servingSize: '1 bowl (150g)',
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
    ingredients: '',
    confirmedAllergens: [],
    crossContact: [],
    verified: false,
    verificationStatus: 'pending',
    verificationNotes: 'Bottle gourd curry — nutrition information not available.',
  },
}

/**
 * Normalize dish name for index lookup.
 */
export function normalizeDishName(name) {
  if (!name || typeof name !== 'string') return ''
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Split menu text (e.g. "Mix Parantha · Curd · Chutney · Tea" or "Tikki Chaat / Samosa")
 * into distinct dish names.
 */
export function parseDishesFromMenu(menuText) {
  if (!menuText || typeof menuText !== 'string') return []
  // Split on middle dots, slashes, or commas
  const rawParts = menuText.split(/[·/,+]/)
  const seen = new Set()
  const dishes = []

  rawParts.forEach(part => {
    const clean = part.trim()
    if (!clean) return
    const norm = normalizeDishName(clean)
    if (!seen.has(norm)) {
      seen.add(norm)
      dishes.push(clean)
    }
  })

  return dishes
}

/**
 * Retrieve all custom stored dish nutrition overrides.
 */
export function getStoredDishNutrition() {
  try {
    const raw = localStorage.getItem(DISH_NUTRITION_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * Save custom dish nutrition overrides.
 */
function saveStoredDishNutrition(dict) {
  try {
    localStorage.setItem(DISH_NUTRITION_KEY, JSON.stringify(dict))
  } catch {
    // quota exceeded or disabled
  }
}

/**
 * Get nutrition and allergen information for a single dish.
 * Always returns a valid object; never throws.
 */
export function getDishNutrition(dishName) {
  if (!dishName) return null
  const norm = normalizeDishName(dishName)
  const stored = getStoredDishNutrition()

  if (stored[norm]) {
    return { ...stored[norm] }
  }

  if (DEFAULT_DISH_NUTRITION[norm]) {
    return { ...DEFAULT_DISH_NUTRITION[norm] }
  }

  // Graceful fallback for newly introduced dish without prior data
  return {
    name: dishName.trim(),
    mealCategory: 'Other',
    servingSize: 'Standard mess serving',
    calories: null,
    protein: null,
    carbs: null,
    fat: null,
    fiber: null,
    ingredients: '',
    confirmedAllergens: [],
    crossContact: ['Communal mess kitchen — potential cross-contact risk with gluten, dairy, nuts'],
    verified: false,
    verificationStatus: 'unverified',
    verificationNotes: 'No nutrition or allergen data submitted yet for this dish. Confirm with mess staff before consuming.',
  }
}

/**
 * Update and persist dish nutrition & allergen record.
 * Broadcasts sync events so Student views update instantly.
 */
export function saveDishNutrition(dishName, data) {
  if (!dishName || typeof dishName !== 'string') {
    return { success: false, error: 'Valid dish name is required.' }
  }

  const norm = normalizeDishName(dishName)
  const stored = getStoredDishNutrition()

  const existing = stored[norm] || DEFAULT_DISH_NUTRITION[norm] || {}

  const updated = {
    ...existing,
    name: dishName.trim(),
    mealCategory: data.mealCategory || existing.mealCategory || 'Other',
    servingSize: data.servingSize !== undefined ? data.servingSize : existing.servingSize,
    calories: data.calories !== undefined && data.calories !== '' ? Number(data.calories) : null,
    protein: data.protein !== undefined && data.protein !== '' ? Number(data.protein) : null,
    carbs: data.carbs !== undefined && data.carbs !== '' ? Number(data.carbs) : null,
    fat: data.fat !== undefined && data.fat !== '' ? Number(data.fat) : null,
    fiber: data.fiber !== undefined && data.fiber !== '' ? Number(data.fiber) : null,
    ingredients: typeof data.ingredients === 'string' ? data.ingredients.trim() : existing.ingredients || '',
    confirmedAllergens: Array.isArray(data.confirmedAllergens) ? data.confirmedAllergens : existing.confirmedAllergens || [],
    crossContact: Array.isArray(data.crossContact)
      ? data.crossContact
      : typeof data.crossContact === 'string'
      ? data.crossContact.split('\n').map(s => s.trim()).filter(Boolean)
      : existing.crossContact || [],
    verified: Boolean(data.verified),
    verificationStatus: data.verified ? 'verified' : (data.verificationStatus || 'unverified'),
    verificationNotes: data.verificationNotes || (data.verified ? 'Verified by Chitkara Mess Dietitian / Staff' : 'Illustrative estimate only — unverified'),
    updatedAt: new Date().toISOString(),
  }

  stored[norm] = updated
  saveStoredDishNutrition(stored)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('plateSyncNutritionUpdate', { detail: { dishName, data: updated } }))
    window.dispatchEvent(new CustomEvent('plateSyncMenuUpdate', { detail: { type: 'nutrition' } }))
  }

  return { success: true, dish: updated }
}

/**
 * Collect all dishes appearing in today's menu and the weekly schedule,
 * joined with their nutrition data.
 */
export function getAllMenuDishes(now = new Date()) {
  const weekly = getWeeklyMenu(now)
  const todayMeals = getMealsForToday(now)
  const dishMap = new Map() // normalizedName -> { dish, meals: Set(), days: Set() }

  // 1. Process weekly menu
  const mealHeaders = ['Breakfast', 'Lunch', 'Snacks', 'Dinner']
  weekly.forEach(row => {
    const day = row[0]
    for (let i = 1; i <= 4; i++) {
      const mealName = mealHeaders[i - 1]
      const menuText = row[i] || ''
      const dishes = parseDishesFromMenu(menuText)
      dishes.forEach(dish => {
        const norm = normalizeDishName(dish)
        if (!dishMap.has(norm)) {
          dishMap.set(norm, {
            originalName: dish,
            norm,
            meals: new Set(),
            days: new Set(),
          })
        }
        const item = dishMap.get(norm)
        item.meals.add(mealName)
        item.days.add(day)
      })
    }
  })

  // 2. Process today's meals (includes live overrides)
  todayMeals.forEach(meal => {
    const dishes = parseDishesFromMenu(meal.menu)
    dishes.forEach(dish => {
      const norm = normalizeDishName(dish)
      if (!dishMap.has(norm)) {
        dishMap.set(norm, {
          originalName: dish,
          norm,
          meals: new Set(),
          days: new Set(),
        })
      }
      const item = dishMap.get(norm)
      item.meals.add(meal.name)
      item.isToday = true
    })
  })

  // 3. Assemble complete dish objects with nutrition information
  const results = []
  dishMap.forEach(info => {
    const nutrition = getDishNutrition(info.originalName)
    const mealList = Array.from(info.meals)
    const primaryMeal = mealList[0] || nutrition.mealCategory || 'General'

    results.push({
      ...nutrition,
      name: nutrition.name || info.originalName,
      norm: info.norm,
      meals: mealList,
      primaryMeal,
      days: Array.from(info.days),
      isToday: Boolean(info.isToday),
    })
  })

  // Sort: today dishes first, then by primary meal, then alphabetically
  const mealOrder = { Breakfast: 1, Lunch: 2, Snacks: 3, Dinner: 4, Other: 5 }
  return results.sort((a, b) => {
    const orderA = mealOrder[a.primaryMeal] || 9
    const orderB = mealOrder[b.primaryMeal] || 9
    if (orderA !== orderB) return orderA - orderB
    return a.name.localeCompare(b.name)
  })
}

