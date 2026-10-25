import { useEffect, useState } from 'react'
import { getWeeklyMenu } from '../../utils/menuStorage'
import './Menu.css'

export default function Menu({ onNavigate }) {
  const [weeklyMenu, setWeeklyMenu] = useState(() => getWeeklyMenu())

  useEffect(() => {
    const handleUpdate = () => {
      setWeeklyMenu(getWeeklyMenu())
    }
    window.addEventListener('plateSyncMenuUpdate', handleUpdate)
    window.addEventListener('storage', handleUpdate)
    return () => {
      window.removeEventListener('plateSyncMenuUpdate', handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  return (
    <section className="page-container menu-page">
      {onNavigate && (
        <div className="menu-nav-pills" role="tablist" aria-label="Menu Views">
          <button
            className="menu-nav-pill active"
            type="button"
            aria-selected="true"
            id="tab-weekly-menu"
          >
            <span>📅</span> Weekly Mess Menu
          </button>
          <button
            className="menu-nav-pill"
            onClick={() => onNavigate('nutrition')}
            type="button"
            id="tab-nutrition-guide"
          >
            <span>🥗</span> Nutrition & Allergens
          </button>
        </div>
      )}

      <p className="section-label">CHITKARA UNIVERSITY HOSTEL</p>
      <h1 className="page-title">Weekly mess menu</h1>
      <p className="page-description">
        The current mess menu, presented in a clean table. Select meals in your dashboard so the kitchen can prepare the right quantity.
      </p>

      <div className="menu-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Breakfast</th>
              <th>Lunch</th>
              <th>Snacks</th>
              <th>Dinner</th>
            </tr>
          </thead>
          <tbody>
            {weeklyMenu.map(row => (
              <tr key={row[0]}>
                {row.map((cell, index) => (
                  <td key={index}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="menu-note">
        ℹ️ Menu items may change when ingredients are unavailable or due to hostel instructions.
      </p>
    </section>
  )
}
