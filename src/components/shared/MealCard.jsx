import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faSun,
  faBowlFood,
  faMugHot,
  faMoon,
  faUtensils,
  faScaleBalanced
} from '@fortawesome/free-solid-svg-icons'
import './MealCard.css'

const MEAL_ICONS = {
  breakfast: faSun,
  lunch: faBowlFood,
  snacks: faMugHot,
  dinner: faMoon,
}

export default function MealCard({ meal, booked, onBook, bookingInfo }) {
  const icon = MEAL_ICONS[meal.id] || faUtensils

  return (
    <article className="meal-card">
      <div className="meal-card-head">
        <span className="meal-card-icon-wrap" aria-hidden="true">
          <FontAwesomeIcon icon={icon} />
        </span>
        <div>
          <h3>{meal.name}</h3>
          <small>{meal.time}</small>
        </div>
        <b className={bookingInfo.open ? 'open-badge' : 'closed-badge'}>
          {booked ? 'Booked' : bookingInfo.open ? 'Booking open' : 'Closed'}
        </b>
      </div>
      <p className="meal-menu">{meal.menu}</p>
      <p className={'booking-time ' + (bookingInfo.open ? 'available' : '')}>{bookingInfo.message}</p>
      <div className="meal-card-bottom">
        <span>
          <FontAwesomeIcon icon={faScaleBalanced} style={{ marginRight: 5, fontSize: 12 }} />
          {meal.waste} avg. waste
        </span>
        <button
          disabled={!bookingInfo.open}
          onClick={() => onBook(meal.id)}
          className={booked ? 'cancel-meal' : 'book-meal'}
        >
          {booked ? 'Cancel' : 'I’m Eating'}
        </button>
      </div>
    </article>
  )
}
