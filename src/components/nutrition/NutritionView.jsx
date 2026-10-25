import { useEffect, useMemo, useState } from 'react'
import {
  getAllMenuDishes,
} from '../../utils/menuStorage'
import './NutritionView.css'

export default function NutritionView({ onNavigate }) {
  const [dishes, setDishes] = useState(() => getAllMenuDishes())
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMeal, setSelectedMeal] = useState('All')
  const [selectedAllergenFilter, setSelectedAllergenFilter] = useState('All')
  const [onlyVerified, setOnlyVerified] = useState(false)
  const [highProteinOnly, setHighProteinOnly] = useState(false)
  const [highFiberOnly, setHighFiberOnly] = useState(false)
  const [lowFatOnly, setLowFatOnly] = useState(false)
  const [expandedDish, setExpandedDish] = useState(null)

  // Listen for live updates when admin edits menu or dish nutrition
  useEffect(() => {
    const handleSync = () => {
      setDishes(getAllMenuDishes())
    }
    window.addEventListener('plateSyncNutritionUpdate', handleSync)
    window.addEventListener('plateSyncMenuUpdate', handleSync)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('plateSyncNutritionUpdate', handleSync)
      window.removeEventListener('plateSyncMenuUpdate', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [])

  // Calculate summary counts
  const totalCount = dishes.length
  const verifiedCount = useMemo(() => dishes.filter(d => d.verified).length, [dishes])
  const unverifiedCount = totalCount - verifiedCount
  const highProteinCount = useMemo(() => dishes.filter(d => d.protein && d.protein >= 10).length, [dishes])
  const highFiberCount = useMemo(() => dishes.filter(d => d.fiber !== null && d.fiber !== undefined && d.fiber >= 5).length, [dishes])
  const lowFatCount = useMemo(() => dishes.filter(d => d.fat !== null && d.fat !== undefined && d.fat <= 5).length, [dishes])

  // Filter logic
  const filteredDishes = useMemo(() => {
    return dishes.filter(dish => {
      // 1. High protein filter (>= 10g protein)
      if (highProteinOnly) {
        if (dish.protein === null || dish.protein === undefined || dish.protein < 10) {
          return false
        }
      }

      // 2. High fiber filter (>= 5g fiber)
      if (highFiberOnly) {
        if (dish.fiber === null || dish.fiber === undefined || dish.fiber < 5) {
          return false
        }
      }

      // 3. Low fat filter (<= 5g fat)
      if (lowFatOnly) {
        if (dish.fat === null || dish.fat === undefined || dish.fat > 5) {
          return false
        }
      }

      // 4. Meal category filter
      if (selectedMeal !== 'All') {
        const matchesPrimary = dish.primaryMeal === selectedMeal
        const matchesInMeals = Array.isArray(dish.meals) && dish.meals.includes(selectedMeal)
        const matchesCategory = dish.mealCategory === selectedMeal
        if (!matchesPrimary && !matchesInMeals && !matchesCategory) return false
      }

      // 5. Verified only filter
      if (onlyVerified && !dish.verified) return false

      // 6. Search query (dish name or ingredients)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const nameMatch = dish.name.toLowerCase().includes(q)
        const ingMatch = typeof dish.ingredients === 'string' && dish.ingredients.toLowerCase().includes(q)
        if (!nameMatch && !ingMatch) return false
      }

      // 7. Allergen exclusion filter (e.g., exclude Gluten, exclude Dairy, etc.)
      if (selectedAllergenFilter !== 'All') {
        const allergens = Array.isArray(dish.confirmedAllergens) ? dish.confirmedAllergens : []
        const cross = Array.isArray(dish.crossContact) ? dish.crossContact : []
        const hasAllergen = allergens.some(a => a.toLowerCase().includes(selectedAllergenFilter.toLowerCase()))
        const hasCross = cross.some(c => c.toLowerCase().includes(selectedAllergenFilter.toLowerCase()))

        // If user wants to avoid this allergen, filter out any dish with confirmed or cross-contact risk
        if (hasAllergen || hasCross) return false

        // For safety: if allergen status is unknown and dish is unverified, don't claim it's free of the allergen!
        if (!dish.verified && allergens.length === 0 && !dish.ingredients) {
          return false
        }
      }

      return true
    })
  }, [dishes, highProteinOnly, highFiberOnly, lowFatOnly, selectedMeal, onlyVerified, searchQuery, selectedAllergenFilter])

  const mealOptions = ['All', 'Breakfast', 'Lunch', 'Snacks', 'Dinner']

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedMeal('All')
    setSelectedAllergenFilter('All')
    setOnlyVerified(false)
    setHighProteinOnly(false)
    setHighFiberOnly(false)
    setLowFatOnly(false)
  }

  const isFiltered = searchQuery || selectedMeal !== 'All' || selectedAllergenFilter !== 'All' || onlyVerified || highProteinOnly || highFiberOnly || lowFatOnly

  return (
    <section className="page-container nutrition-page">
      {/* Sub-navigation tabs between Weekly Menu and Nutrition */}
      <div className="nutrition-nav-pills" role="tablist" aria-label="Menu Views">
        <button
          className="nutrition-nav-pill"
          onClick={() => onNavigate && onNavigate('menu')}
          type="button"
          id="tab-weekly-menu"
        >
          <span>📅</span> Weekly Mess Menu
        </button>
        <button
          className="nutrition-nav-pill active"
          type="button"
          aria-selected="true"
          id="tab-nutrition-guide"
        >
          <span>🥗</span> Nutrition & Allergens
        </button>
      </div>

      <header className="nutrition-header">
        <p className="section-label">CHITKARA MESS · DIETARY & NUTRITIONAL INTELLIGENCE</p>
        <h1 className="page-title">Nutrition & Allergen Guide</h1>
        <p className="page-description">
          Review nutritional profiles, macronutrient distributions, ingredient declarations,
          and confirmed allergen risks for dishes served across the hostel mess.
        </p>
      </header>

      {/* Safety Advisory Banner */}
      <aside className="allergen-advisory-banner" role="alert" aria-label="Important Dietary and Allergen Notice">
        <div className="advisory-icon-wrap" aria-hidden="true">⚠️</div>
        <div className="advisory-content">
          <h3>Mess Kitchen Dietary & Cross-Contact Advisory</h3>
          <p>
            Chitkara hostel kitchens operate in high-volume communal environments where steam kettles,
            tandoors, griddles, and cookware are shared.
          </p>
          <ul className="advisory-bullets">
            <li>
              <strong>🔴 Confirmed Allergens:</strong> Explicitly present ingredients identified by mess staff.
            </li>
            <li>
              <strong>🟡 Cross-Contact Risk:</strong> Dishes prepared on shared surfaces where trace amounts of gluten, dairy, or nuts may transfer.
            </li>
            <li>
              <strong>⚪ Unverified Status:</strong> Dishes without official laboratory confirmation are labeled unverified estimates. <em>Never assume an unverified dish is allergen-free.</em>
            </li>
            <li>
              <strong>👨‍🍳 Staff Confirmation:</strong> If you have food allergies or severe dietary sensitivities, please consult the on-duty Mess Supervisor or Head Chef before consuming.
            </li>
          </ul>
        </div>
      </aside>

      {/* Stats Summary Strip */}
      <div className="nutrition-stats-grid">
        <div className="nutrition-stat-card">
          <small>MENU DISHES</small>
          <strong>{totalCount}</strong>
          <span>in active weekly cycle</span>
        </div>
        <div className="nutrition-stat-card">
          <small>KITCHEN VERIFIED</small>
          <strong className="stat-highlight-green">{verifiedCount}</strong>
          <span>dietitian sign-offs</span>
        </div>
        <div className="nutrition-stat-card">
          <small>ILLUSTRATIVE / PENDING</small>
          <strong className="stat-highlight-amber">{unverifiedCount}</strong>
          <span>estimates or pending</span>
        </div>
        <div
          className={`nutrition-stat-card clickable ${highProteinOnly ? 'active' : ''}`}
          onClick={() => setHighProteinOnly(prev => !prev)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setHighProteinOnly(prev => !prev) }}
          title="Click to toggle high protein dishes"
        >
          <small>HIGH PROTEIN DISHES</small>
          <strong>{highProteinCount}</strong>
          <span>≥ 10g protein (click to filter)</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="nutrition-toolbar">
        {/* Search Input */}
        <div className="nutrition-search-wrap">
          <span className="search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            className="nutrition-search-input"
            placeholder="Search by dish name or ingredient (e.g. Parantha, Paneer, Soya)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search dishes"
            id="dish-search-input"
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* Quick Filter Buttons below search bar */}
        <div className="nutrition-quick-actions">
          <button
            type="button"
            className={`quick-nutrient-btn ${highProteinOnly ? 'active' : ''}`}
            onClick={() => setHighProteinOnly(prev => !prev)}
            aria-pressed={highProteinOnly}
            id="high-protein-meals-btn"
          >
            <span className="nutrient-btn-icon" aria-hidden="true">💪</span>
            <span className="nutrient-btn-label">High Protein (≥ 10g)</span>
            <span className="nutrient-btn-count">{highProteinCount}</span>
            {highProteinOnly && <span className="nutrient-active-tag">Active ✓</span>}
          </button>

          <button
            type="button"
            className={`quick-nutrient-btn ${highFiberOnly ? 'active' : ''}`}
            onClick={() => setHighFiberOnly(prev => !prev)}
            aria-pressed={highFiberOnly}
            id="high-fiber-meals-btn"
          >
            <span className="nutrient-btn-icon" aria-hidden="true">🌾</span>
            <span className="nutrient-btn-label">High Fiber (≥ 5g)</span>
            <span className="nutrient-btn-count">{highFiberCount}</span>
            {highFiberOnly && <span className="nutrient-active-tag">Active ✓</span>}
          </button>

          <button
            type="button"
            className={`quick-nutrient-btn ${lowFatOnly ? 'active' : ''}`}
            onClick={() => setLowFatOnly(prev => !prev)}
            aria-pressed={lowFatOnly}
            id="low-fat-meals-btn"
          >
            <span className="nutrient-btn-icon" aria-hidden="true">🥑</span>
            <span className="nutrient-btn-label">Low Fat (≤ 5g)</span>
            <span className="nutrient-btn-count">{lowFatCount}</span>
            {lowFatOnly && <span className="nutrient-active-tag">Active ✓</span>}
          </button>
        </div>

        {/* Filter Controls */}
        <div className="nutrition-filters-row">
          {/* Meal Category Filters */}
          <div className="meal-filter-group" role="group" aria-label="Filter by meal">
            {mealOptions.map(m => (
              <button
                key={m}
                className={`meal-filter-btn ${selectedMeal === m ? 'active' : ''}`}
                onClick={() => setSelectedMeal(m)}
                type="button"
                id={`filter-meal-${m.toLowerCase()}`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Allergen Avoidance Filter */}
          <div className="allergen-select-wrap">
            <label htmlFor="allergen-avoid-select" className="filter-dropdown-label">
              Dietary Avoidance:
            </label>
            <select
              id="allergen-avoid-select"
              className="allergen-select"
              value={selectedAllergenFilter}
              onChange={(e) => setSelectedAllergenFilter(e.target.value)}
            >
              <option value="All">All Dishes (No exclusions)</option>
              <option value="Gluten">Avoid Wheat / Gluten</option>
              <option value="Dairy">Avoid Milk / Dairy</option>
              <option value="Peanuts">Avoid Peanuts</option>
              <option value="Tree Nuts">Avoid Tree Nuts</option>
              <option value="Soy">Avoid Soy</option>
              <option value="Eggs">Avoid Eggs</option>
            </select>
          </div>

          {/* Verified Only Toggle */}
          <label className="verified-toggle-label">
            <input
              type="checkbox"
              checked={onlyVerified}
              onChange={(e) => setOnlyVerified(e.target.checked)}
              id="filter-verified-toggle"
            />
            <span>Verified only</span>
          </label>

          {/* Reset Filters Button */}
          {isFiltered && (
            <button
              className="reset-filters-btn"
              onClick={handleResetFilters}
              type="button"
            >
              Reset filters ✕
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="nutrition-results-header">
        <p className="results-count">
          Showing <strong>{filteredDishes.length}</strong> of {totalCount} dishes
          {highProteinOnly && <span> · <strong>💪 High Protein (≥ 10g)</strong></span>}
          {highFiberOnly && <span> · <strong>🌾 High Fiber (≥ 5g)</strong></span>}
          {lowFatOnly && <span> · <strong>🥑 Low Fat (≤ 5g)</strong></span>}
          {selectedMeal !== 'All' && <span> in <em>{selectedMeal}</em></span>}
          {selectedAllergenFilter !== 'All' && <span> (excluding <em>{selectedAllergenFilter}</em>)</span>}
          {onlyVerified && <span> (<em>Verified only</em>)</span>}
        </p>
      </div>

      {/* Dishes Cards Grid */}
      {filteredDishes.length === 0 ? (
        <div className="nutrition-empty-state">
          <div className="empty-icon">🥗</div>
          <h3>No dishes match your filter criteria</h3>
          <p>
            No menu items match your current search query or allergen exclusion filter.
            Try loosening your filters or resetting the search.
          </p>
          <button className="primary-button" onClick={handleResetFilters}>
            View All Dishes
          </button>
        </div>
      ) : (
        <div className="dishes-grid">
          {filteredDishes.map((dish) => {
            const hasNutrition = dish.calories !== null && dish.calories !== undefined
            const isExpanded = expandedDish === dish.norm
            const confirmed = Array.isArray(dish.confirmedAllergens) ? dish.confirmedAllergens : []
            const cross = Array.isArray(dish.crossContact) ? dish.crossContact : []
            const hasIngredients = Boolean(dish.ingredients && dish.ingredients.trim())

            // Macronutrient percentage for visual representation
            const totalMacros = (dish.protein || 0) + (dish.carbs || 0) + (dish.fat || 0)
            const pPct = totalMacros > 0 ? Math.round(((dish.protein || 0) / totalMacros) * 100) : 0
            const cPct = totalMacros > 0 ? Math.round(((dish.carbs || 0) / totalMacros) * 100) : 0
            const fPct = totalMacros > 0 ? Math.max(0, 100 - pPct - cPct) : 0

            return (
              <article
                key={dish.norm || dish.name}
                className={`dish-card ${dish.verified ? 'dish-verified' : ''}`}
                id={`dish-card-${dish.norm}`}
              >
                {/* Card Top: Name, Meal Category, Status */}
                <div className="dish-card-header">
                  <div>
                    <div className="dish-meta-tags">
                      <span className="dish-meal-badge">{dish.primaryMeal || dish.mealCategory || 'Mess Dish'}</span>
                      {dish.isToday && <span className="dish-today-tag">On Today's Menu</span>}
                    </div>
                    <h2 className="dish-name">{dish.name}</h2>
                  </div>

                  {/* Verification Status Badge */}
                  <div className="dish-verification-badge-wrap">
                    {dish.verified ? (
                      <span className="v-badge verified" title="Kitchen and dietitian verified">
                        ✓ Kitchen Verified
                      </span>
                    ) : hasNutrition ? (
                      <span className="v-badge unverified" title="Illustrative estimate only — unverified">
                        ⚠️ Illustrative Estimate
                      </span>
                    ) : (
                      <span className="v-badge pending" title="Nutrition information not available">
                        ❓ Data Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Serving Size */}
                <div className="dish-serving-row">
                  <span className="serving-label">Serving Size:</span>
                  <span className="serving-value">{dish.servingSize || 'Standard mess portion'}</span>
                </div>

                {/* Nutrition Facts Section */}
                <div className="dish-nutrition-section">
                  {hasNutrition ? (
                    <>
                      <div className="macros-grid">
                        <div className="macro-cell macro-cal">
                          <span className="macro-num">{dish.calories}</span>
                          <span className="macro-label">Calories (kcal)</span>
                        </div>
                        <div className="macro-cell macro-protein">
                          <span className="macro-num">{dish.protein}g</span>
                          <span className="macro-label">Protein</span>
                        </div>
                        <div className="macro-cell macro-carbs">
                          <span className="macro-num">{dish.carbs}g</span>
                          <span className="macro-label">Carbs</span>
                        </div>
                        <div className="macro-cell macro-fat">
                          <span className="macro-num">{dish.fat}g</span>
                          <span className="macro-label">Total Fat</span>
                        </div>
                        {dish.fiber !== null && dish.fiber !== undefined && (
                          <div className="macro-cell macro-fiber">
                            <span className="macro-num">{dish.fiber}g</span>
                            <span className="macro-label">Fiber</span>
                          </div>
                        )}
                      </div>

                      {/* Macro balance bar */}
                      {totalMacros > 0 && (
                        <div className="macro-bar-wrap" title={`Protein: ${pPct}% | Carbs: ${cPct}% | Fat: ${fPct}%`}>
                          <div className="macro-bar-fill protein" style={{ width: `${pPct}%` }} />
                          <div className="macro-bar-fill carbs" style={{ width: `${cPct}%` }} />
                          <div className="macro-bar-fill fat" style={{ width: `${fPct}%` }} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="nutrition-unavailable-box">
                      <span className="unavailable-icon" aria-hidden="true">ℹ️</span>
                      <div>
                        <strong>Nutrition information not available</strong>
                        <p>Macronutrient values and calorie counts have not yet been submitted or verified for this dish.</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Allergen Status Box */}
                <div className="dish-allergen-section">
                  {confirmed.length > 0 ? (
                    <div className="allergen-alert-confirmed">
                      <span className="allergen-heading-icon">⚠️</span>
                      <div className="allergen-alert-body">
                        <strong>Confirmed Allergens:</strong>
                        <div className="allergen-chips">
                          {confirmed.map(allergen => (
                            <span key={allergen} className="allergen-chip confirmed">
                              {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : dish.verified ? (
                    <div className="allergen-alert-none">
                      <span>✓ No common allergens reported by kitchen</span>
                      <small>(Cross-contact risk may still exist in communal kitchens)</small>
                    </div>
                  ) : (
                    <div className="allergen-alert-unknown">
                      <span className="allergen-heading-icon">⚠️</span>
                      <div className="allergen-alert-body">
                        <strong>Unknown Allergen Status:</strong>
                        <p>
                          Ingredients and prep methods have not been verified. Do not assume allergen-free.
                          Always confirm with mess staff.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Possible Cross-Contact Warnings */}
                  {cross.length > 0 && (
                    <div className="allergen-cross-contact-box">
                      <span className="cross-icon" aria-hidden="true">⚡</span>
                      <div>
                        <strong>Cross-Contact Advisory:</strong>
                        <ul>
                          {cross.map((note, idx) => (
                            <li key={idx}>{note}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ingredients Expandable Area */}
                <div className="dish-ingredients-wrap">
                  <button
                    className="ingredients-toggle-btn"
                    onClick={() => setExpandedDish(isExpanded ? null : dish.norm)}
                    type="button"
                    aria-expanded={isExpanded}
                  >
                    <span>Ingredients & Preparation Notes</span>
                    <span className="toggle-caret">{isExpanded ? '▲' : '▼'}</span>
                  </button>

                  {isExpanded && (
                    <div className="ingredients-dropdown-content">
                      <p className="ingredients-heading">Declared Ingredients:</p>
                      {hasIngredients ? (
                        <p className="ingredients-text">{dish.ingredients}</p>
                      ) : (
                        <p className="ingredients-pending">Ingredients pending kitchen submission.</p>
                      )}

                      {dish.verificationNotes && (
                        <div className="verification-notes-box">
                          <strong>Note from Mess Staff / Dietitian:</strong>
                          <p>{dish.verificationNotes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Footer Navigation */}
      <div className="nutrition-footer-nav">
        <button
          className="secondary-button"
          onClick={() => onNavigate && onNavigate('menu')}
          type="button"
        >
          ← Return to Weekly Mess Menu
        </button>
      </div>
    </section>
  )
}
