import { useState, useMemo } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarCheck,
  faChartColumn,
  faLeaf,
  faSun,
  faBowlFood,
  faMoon,
  faMugHot,
  faFireFlameCurved,
  faDumbbell,
  faTriangleExclamation,
  faArrowRight,
  faBell,
  faChartPie,
  faTrashCan,
  faSeedling
} from '@fortawesome/free-solid-svg-icons'
import mealBreakfastImg from '../../assets/meal_breakfast.jpg'
import mealLunchImg from '../../assets/meal_lunch.jpg'
import mealDinnerImg from '../../assets/meal_dinner.jpg'
import mealSnacksImg from '../../assets/meal_snacks.jpg'
import studentAvatarImg from '../../assets/student_avatar_aditi.jpg'
import './Home.css'

export default function Home({ onGetStarted, onNavigate }) {
  const [activePreviewMeal, setActivePreviewMeal] = useState('breakfast')

  const handleBookClick = () => {
    if (onGetStarted) {
      onGetStarted()
    } else if (onNavigate) {
      onNavigate('dashboard')
    }
  }

  const handleMenuClick = () => {
    if (onNavigate) {
      onNavigate('menu')
    }
  }

  const handleNutritionClick = () => {
    if (onNavigate) {
      onNavigate('nutrition')
    }
  }

  const handleAboutClick = () => {
    if (onNavigate) {
      onNavigate('how-to-use')
    }
  }

  // Today's Menu data matching the reference blueprint & authentic campus items
  const menuCards = useMemo(() => [
    {
      id: 'breakfast',
      name: 'Breakfast',
      time: '7:00 AM – 9:30 AM',
      icon: faSun,
      image: mealBreakfastImg,
      dishes: [
        'Poha with Peanuts',
        'Idli with Sambar',
        'Tea / Coffee',
      ],
      calories: '320 kcal',
      protein: '8g protein',
      tag: 'Nuts',
      tagType: 'allergen-nut',
    },
    {
      id: 'lunch',
      name: 'Lunch',
      time: '12:00 PM – 2:30 PM',
      icon: faBowlFood,
      image: mealLunchImg,
      dishes: [
        'Roti, Dal, Mixed Veg',
        'Jeera Rice',
        'Salad & Curd',
      ],
      calories: '450 kcal',
      protein: '16g protein',
      tag: 'Gluten',
      tagType: 'allergen-gluten',
    },
    {
      id: 'dinner',
      name: 'Dinner',
      time: '7:00 PM – 9:30 PM',
      icon: faMoon,
      image: mealDinnerImg,
      dishes: [
        'Roti, Rajma',
        'Seasonal Veg',
        'Salad & Buttermilk',
      ],
      calories: '420 kcal',
      protein: '14g protein',
      tag: 'Gluten',
      tagType: 'allergen-gluten',
    },
    {
      id: 'snacks',
      name: 'Snacks',
      time: '4:00 PM – 6:00 PM',
      icon: faMugHot,
      image: mealSnacksImg,
      dishes: [
        'Veg Sandwich',
        'Fruit (Banana)',
        'Tea / Coffee',
      ],
      calories: '220 kcal',
      protein: '6g protein',
      tag: 'Gluten',
      tagType: 'allergen-gluten',
    },
  ], [])

  return (
    <div className="home-wrapper">
      {/* ── 1. HERO SECTION ───────────────────────────────────────── */}
      <section className="hero-section">
        <div className="hero-container">
          {/* Left Column: Copy & Actions */}
          <div className="hero-left">
            <span className="hero-kicker">CHITKARA HOSTEL DINING</span>

            <h1 className="hero-heading">
              Book Smarter.<br />
              Eat Better.<br />
              <span className="hero-highlight">Waste Less.</span>
            </h1>

            <p className="hero-description">
              Plan your meals in advance, help the mess prepare better and be a part of a more sustainable campus.
            </p>

            <div className="hero-cta-group">
              <button
                type="button"
                className="hero-btn-primary"
                onClick={handleBookClick}
                id="hero-book-meal-btn"
              >
                Book Your Meal
                <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 4 }} />
              </button>
              <button
                type="button"
                className="hero-btn-secondary"
                onClick={handleMenuClick}
                id="hero-explore-menu-btn"
              >
                Explore Menu
              </button>
            </div>

            <div className="hero-benefits">
              <div className="benefit-item">
                <span className="benefit-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={faCalendarCheck} />
                </span>
                <span className="benefit-text">Easy meal bookings</span>
              </div>

              <div className="benefit-item">
                <span className="benefit-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={faChartColumn} />
                </span>
                <span className="benefit-text">Smarter mess planning</span>
              </div>

              <div className="benefit-item">
                <span className="benefit-icon" aria-hidden="true">
                  <FontAwesomeIcon icon={faLeaf} />
                </span>
                <span className="benefit-text">Less food wasted</span>
              </div>
            </div>
          </div>

          {/* Right Column: Multi-Device Showcase */}
          <div className="hero-right">
            <div className="showcase-stage">
              {/* Organic Soft Emerald Glows */}
              <div className="showcase-glow-bg" aria-hidden="true" />

              {/* Tablet Frame: Mess Admin Dashboard */}
              <div className="showcase-tablet">
                <div className="tablet-header">
                  <div>
                    <h4 className="tablet-title">Mess Dashboard</h4>
                  </div>
                  <span className="tablet-dropdown-badge">Today</span>
                </div>

                <div className="tablet-kpis">
                  <div className="kpi-card">
                    <span className="kpi-label">Expected Attendance</span>
                    <span className="kpi-val">412</span>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Recommended Servings</span>
                    <span className="kpi-val">430</span>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Meals Booked</span>
                    <span className="kpi-val highlight">386</span>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Est. Food Waste</span>
                    <span className="kpi-val text-green">~12 kg</span>
                    <span className="kpi-trend">↓ 68%</span>
                  </div>
                </div>

                {/* Demand Bar Chart */}
                <div className="tablet-chart-wrap">
                  <div className="chart-legend">
                    <span className="chart-heading">Meal-wise Expected Demand</span>
                    <div className="legend-items">
                      <span className="legend-dot booked">Booked</span>
                      <span className="legend-dot est">Estimated</span>
                    </div>
                  </div>

                  <div className="chart-bars">
                    <div className="chart-col">
                      <span className="bar-val">420</span>
                      <div className="bar-dual">
                        <div className="bar-fill bg-dark-green" style={{ height: '82%' }} />
                        <div className="bar-fill bg-light-green" style={{ height: '74%' }} />
                      </div>
                      <span className="bar-label">Breakfast</span>
                    </div>

                    <div className="chart-col">
                      <span className="bar-val">410</span>
                      <div className="bar-dual">
                        <div className="bar-fill bg-dark-green" style={{ height: '80%' }} />
                        <div className="bar-fill bg-light-green" style={{ height: '72%' }} />
                      </div>
                      <span className="bar-label">Lunch</span>
                    </div>

                    <div className="chart-col">
                      <span className="bar-val">395</span>
                      <div className="bar-dual">
                        <div className="bar-fill bg-dark-green" style={{ height: '76%' }} />
                        <div className="bar-fill bg-light-green" style={{ height: '69%' }} />
                      </div>
                      <span className="bar-label">Dinner</span>
                    </div>

                    <div className="chart-col">
                      <span className="bar-val">180</span>
                      <div className="bar-dual">
                        <div className="bar-fill bg-dark-green" style={{ height: '36%' }} />
                        <div className="bar-fill bg-light-green" style={{ height: '30%' }} />
                      </div>
                      <span className="bar-label">Snacks</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Smartphone Frame: Student Meal Booking App */}
              <div className="showcase-phone">
                <div className="phone-notch">
                  <div className="phone-speaker" />
                  <div className="phone-cam" />
                </div>

                <div className="phone-screen">
                  {/* Phone Header */}
                  <div className="phone-top-bar">
                    <div className="phone-logo">
                      <span>P</span> PlateSync
                    </div>
                    <span className="phone-icon-bell">
                      <FontAwesomeIcon icon={faBell} />
                    </span>
                  </div>

                  {/* Calendar Strip */}
                  <div className="phone-date-strip">
                    <div className="date-chip active">
                      <span>Mon</span>
                      <strong>20</strong>
                    </div>
                    <div className="date-chip">
                      <span>Tue</span>
                      <strong>21</strong>
                    </div>
                    <div className="date-chip">
                      <span>Wed</span>
                      <strong>22</strong>
                    </div>
                    <div className="date-chip">
                      <span>Thu</span>
                      <strong>23</strong>
                    </div>
                    <div className="date-chip">
                      <span>Fri</span>
                      <strong>24</strong>
                    </div>
                  </div>

                  {/* Phone Menu Tabs */}
                  <div className="phone-menu-head">
                    <span className="phone-section-title">Today's Menu</span>
                    <div className="phone-meal-pills">
                      <span
                        className={`p-pill ${activePreviewMeal === 'breakfast' ? 'active' : ''}`}
                        onClick={() => setActivePreviewMeal('breakfast')}
                      >
                        Breakfast
                      </span>
                      <span
                        className={`p-pill ${activePreviewMeal === 'lunch' ? 'active' : ''}`}
                        onClick={() => setActivePreviewMeal('lunch')}
                      >
                        Lunch
                      </span>
                      <span
                        className={`p-pill ${activePreviewMeal === 'dinner' ? 'active' : ''}`}
                        onClick={() => setActivePreviewMeal('dinner')}
                      >
                        Dinner
                      </span>
                      <span
                        className={`p-pill ${activePreviewMeal === 'snacks' ? 'active' : ''}`}
                        onClick={() => setActivePreviewMeal('snacks')}
                      >
                        Snacks
                      </span>
                    </div>
                  </div>

                  {/* Dish Cards inside Phone */}
                  <div className="phone-dish-list">
                    <div className="phone-dish-card">
                      <img src={mealBreakfastImg} alt="Poha with Peanuts" className="phone-dish-thumb" />
                      <div className="phone-dish-info">
                        <h5>Poha with Peanuts</h5>
                        <div className="phone-dish-macros">
                          <span className="macro-chip">320 kcal</span>
                          <span className="macro-chip">8g protein</span>
                        </div>
                        <div className="phone-dish-tags">
                          <span className="tag-veg">Vegetarian</span>
                          <span className="tag-allergen">Nuts</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="phone-book-action-btn"
                      onClick={handleBookClick}
                    >
                      Book Meal
                    </button>

                    <div className="phone-dish-card secondary">
                      <div className="phone-dish-thumb-placeholder">
                        <FontAwesomeIcon icon={faBowlFood} />
                      </div>
                      <div className="phone-dish-info">
                        <h5>Idli with Sambar</h5>
                        <div className="phone-dish-macros">
                          <span className="macro-chip">280 kcal</span>
                          <span className="macro-chip">7g protein</span>
                        </div>
                        <div className="phone-dish-tags">
                          <span className="tag-veg">Vegetarian</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. TODAY AT THE MESS / WHAT'S ON THE MENU? ──────────── */}
      <section className="menu-preview-section">
        <div className="section-inner">
          <div className="section-header-row">
            <div>
              <span className="section-kicker">TODAY AT THE MESS</span>
              <h2 className="section-title">What's on the menu?</h2>
              <p className="section-subtitle">
                Nutritious meals, clear information. Check what's cooking today and book your meal.
              </p>
            </div>
            <button
              type="button"
              className="view-full-menu-btn"
              onClick={handleMenuClick}
              id="home-view-full-menu-btn"
            >
              View Full Menu
              <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 6 }} />
            </button>
          </div>

          <div className="menu-cards-grid">
            {menuCards.map((card) => (
              <article className="home-meal-card" key={card.id}>
                <div className="meal-card-img-wrap">
                  <img src={card.image} alt={card.name} className="meal-card-img" />
                </div>

                <div className="meal-card-content">
                  <div className="meal-card-title-row">
                    <span className="meal-icon">
                      <FontAwesomeIcon icon={card.icon} />
                    </span>
                    <h3 className="meal-name">{card.name}</h3>
                    <span className="meal-timing">({card.time})</span>
                  </div>

                  <ul className="meal-dishes-list">
                    {card.dishes.map((dish, i) => (
                      <li key={i}>
                        <span className="dish-dot" /> {dish}
                      </li>
                    ))}
                  </ul>

                  <div className="meal-tags-row">
                    <span className="chip-cal">
                      <FontAwesomeIcon icon={faFireFlameCurved} style={{ marginRight: 4 }} />
                      {card.calories}
                    </span>
                    <span className="chip-prot">
                      <FontAwesomeIcon icon={faDumbbell} style={{ marginRight: 4 }} />
                      {card.protein}
                    </span>
                    <span className={`chip-tag ${card.tagType}`}>
                      <FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: 4 }} />
                      {card.tag}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="meal-card-link-btn"
                    onClick={handleNutritionClick}
                  >
                    View Details
                    <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 5 }} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. LIVE DEMAND INTELLIGENCE ───────────────────────────── */}
      <section className="demand-intelligence-section">
        <div className="section-inner demand-container">
          <div className="demand-grid">
            {/* Left Header & Call to Action */}
            <div className="demand-left">
              <span className="section-kicker">FOR MESS ADMINISTRATORS</span>
              <h2 className="section-title">Live demand intelligence</h2>
              <p className="section-subtitle">
                Turn meal bookings and historical attendance into accurate serving recommendations.
              </p>
              <button
                type="button"
                className="see-how-btn"
                onClick={handleAboutClick}
                id="see-how-it-works-btn"
              >
                See How It Works
                <FontAwesomeIcon icon={faArrowRight} style={{ marginLeft: 6 }} />
              </button>
            </div>

            {/* Middle: Expected Demand (Today) & Chart */}
            <div className="demand-center-card">
              <div className="demand-card-header">
                <h4>Expected Demand (Today)</h4>
              </div>

              <div className="demand-metrics-grid">
                <div className="d-metric-box">
                  <span className="d-meal-title">
                    <FontAwesomeIcon icon={faSun} style={{ marginRight: 4 }} />
                    Breakfast
                  </span>
                  <strong className="d-meal-num">420</strong>
                  <span className="d-meal-trend pos">(+5% vs avg)</span>
                </div>
                <div className="d-metric-box">
                  <span className="d-meal-title">
                    <FontAwesomeIcon icon={faBowlFood} style={{ marginRight: 4 }} />
                    Lunch
                  </span>
                  <strong className="d-meal-num">410</strong>
                  <span className="d-meal-trend pos">(+2% vs avg)</span>
                </div>
                <div className="d-metric-box">
                  <span className="d-meal-title">
                    <FontAwesomeIcon icon={faMoon} style={{ marginRight: 4 }} />
                    Dinner
                  </span>
                  <strong className="d-meal-num">395</strong>
                  <span className="d-meal-trend neg">(-3% vs avg)</span>
                </div>
                <div className="d-metric-box">
                  <span className="d-meal-title">
                    <FontAwesomeIcon icon={faMugHot} style={{ marginRight: 4 }} />
                    Snacks
                  </span>
                  <strong className="d-meal-num">180</strong>
                  <span className="d-meal-trend pos">(+4% vs avg)</span>
                </div>
              </div>

              {/* Chart Comparison */}
              <div className="historical-chart-area">
                <div className="historical-chart-head">
                  <span className="chart-label">Historical vs Current Bookings</span>
                  <div className="chart-legend-pills">
                    <span className="c-legend hist">Historical Avg</span>
                    <span className="c-legend curr">Current Bookings</span>
                  </div>
                </div>

                <div className="chart-svg-container">
                  <div className="chart-y-axis">
                    <span>600</span>
                    <span>400</span>
                    <span>200</span>
                    <span>0</span>
                  </div>
                  <div className="chart-bars-group">
                    <div className="chart-pair">
                      <div className="bar-pair-visual">
                        <div className="c-bar hist" style={{ height: '70%' }} />
                        <div className="c-bar curr" style={{ height: '75%' }} />
                      </div>
                      <span className="pair-label">Breakfast</span>
                    </div>

                    <div className="chart-pair">
                      <div className="bar-pair-visual">
                        <div className="c-bar hist" style={{ height: '68%' }} />
                        <div className="c-bar curr" style={{ height: '72%' }} />
                      </div>
                      <span className="pair-label">Lunch</span>
                    </div>

                    <div className="chart-pair">
                      <div className="bar-pair-visual">
                        <div className="c-bar hist" style={{ height: '65%' }} />
                        <div className="c-bar curr" style={{ height: '62%' }} />
                      </div>
                      <span className="pair-label">Dinner</span>
                    </div>

                    <div className="chart-pair">
                      <div className="bar-pair-visual">
                        <div className="c-bar hist" style={{ height: '30%' }} />
                        <div className="c-bar curr" style={{ height: '32%' }} />
                      </div>
                      <span className="pair-label">Snacks</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: How it's calculated? Card */}
            <div className="demand-right-card">
              <h4>How it's calculated?</h4>

              <div className="calc-steps-list">
                <div className="calc-step-item">
                  <span className="step-circle">1</span>
                  <div>
                    <strong>Current meal bookings</strong>
                    <p>Students book their meals in advance.</p>
                  </div>
                </div>

                <div className="calc-step-item">
                  <span className="step-circle">2</span>
                  <div>
                    <strong>Historical attendance rate</strong>
                    <p>We use past data to estimate total demand.</p>
                  </div>
                </div>

                <div className="calc-step-item">
                  <span className="step-circle">3</span>
                  <div>
                    <strong>Recommended servings</strong>
                    <p>Final recommendation helps reduce extra preparation and food waste.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. HOW PLATESYNC HELPS ─────────────────────────────────── */}
      <section className="how-helps-section">
        <div className="section-inner">
          <span className="section-kicker">HOW PLATESYNC HELPS</span>
          <h2 className="section-title" style={{ marginBottom: 32 }}>Small choice. Big difference.</h2>

          <div className="how-helps-container">
            {/* 3 Step Workflow */}
            <div className="steps-flow-row">
              <div className="flow-step-card">
                <div className="flow-step-icon">
                  <FontAwesomeIcon icon={faCalendarCheck} style={{ color: '#138052', fontSize: 18 }} />
                </div>
                <div className="flow-step-content">
                  <h4>1. Book your meal</h4>
                  <p>Students tell the mess when they plan to eat.</p>
                </div>
              </div>

              <span className="flow-arrow" aria-hidden="true">
                <FontAwesomeIcon icon={faArrowRight} />
              </span>

              <div className="flow-step-card">
                <div className="flow-step-icon">
                  <FontAwesomeIcon icon={faChartColumn} style={{ color: '#138052', fontSize: 18 }} />
                </div>
                <div className="flow-step-content">
                  <h4>2. Prepare smarter</h4>
                  <p>The kitchen gets a clear number of expected plates.</p>
                </div>
              </div>

              <span className="flow-arrow" aria-hidden="true">
                <FontAwesomeIcon icon={faArrowRight} />
              </span>

              <div className="flow-step-card">
                <div className="flow-step-icon">
                  <FontAwesomeIcon icon={faLeaf} style={{ color: '#138052', fontSize: 18 }} />
                </div>
                <div className="flow-step-content">
                  <h4>3. Reduce waste</h4>
                  <p>Less extra food is prepared and wasted.</p>
                </div>
              </div>
            </div>

            {/* Plant Illustration Banner Card */}
            <div className="food-reaches-banner">
              <div className="banner-text">
                <h3>Food should reach plates, not the waste bin.</h3>
                <p>Better planning today helps us build a more sustainable tomorrow.</p>
              </div>
              <div className="banner-plant-illustration" aria-hidden="true">
                <FontAwesomeIcon icon={faSeedling} style={{ color: '#138052' }} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. REAL IMPACT & TESTIMONIAL ──────────────────────────── */}
      <section className="real-impact-section">
        <div className="section-inner">
          <div className="impact-layout">
            {/* Left title */}
            <div className="impact-left-title">
              <span className="section-kicker">REAL IMPACT</span>
              <h2 className="section-title">A more sustainable campus, together.</h2>
            </div>

            {/* Center: Metric Cards */}
            <div className="impact-metrics-row">
              <div className="impact-metric-card">
                <div className="impact-icon-badge">
                  <FontAwesomeIcon icon={faTrashCan} />
                </div>
                <strong className="impact-val">194 kg</strong>
                <p>Approx. food waste observed per day</p>
              </div>

              <div className="impact-metric-card">
                <div className="impact-icon-badge">
                  <FontAwesomeIcon icon={faChartPie} />
                </div>
                <strong className="impact-val">60 kg</strong>
                <p>Average waste from breakfast, lunch and dinner each (approx.)</p>
              </div>

              <div className="impact-metric-card">
                <div className="impact-icon-badge">
                  <FontAwesomeIcon icon={faMugHot} />
                </div>
                <strong className="impact-val">14 kg</strong>
                <p>Average waste from snacks (approx.)</p>
              </div>
            </div>

            {/* Right: Testimonial Card */}
            <div className="impact-testimonial-card">
              <div className="testimonial-header">
                <img src={studentAvatarImg} alt="Aditi Sharma" className="testimonial-avatar" />
                <div>
                  <h5 className="testimonial-author">Aditi Sharma</h5>
                  <span className="testimonial-sub">Hostel Student</span>
                </div>
              </div>

              <p className="testimonial-quote">
                “PlateSync makes it so easy to plan my meals, and I love that it helps reduce food waste on campus.”
              </p>

              <div className="testimonial-dots">
                <span className="t-dot active" />
                <span className="t-dot" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
