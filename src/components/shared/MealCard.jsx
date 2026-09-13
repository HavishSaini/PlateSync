import './MealCard.css'
export default function MealCard({ meal, booked, onBook, bookingInfo }) {
  return <article className="meal-card">
    <div className="meal-card-head"><span>{meal.icon}</span><div><h3>{meal.name}</h3><small>{meal.time}</small></div><b className={bookingInfo.open ? 'open-badge' : 'closed-badge'}>{booked ? 'Booked' : bookingInfo.open ? 'Booking open' : 'Closed'}</b></div>
    <p className="meal-menu">{meal.menu}</p>
    <p className={'booking-time ' + (bookingInfo.open ? 'available' : '')}>{bookingInfo.message}</p>
    <div className="meal-card-bottom"><span>{meal.waste} average waste</span><button disabled={!bookingInfo.open} onClick={() => onBook(meal.id)} className={booked ? 'cancel-meal' : 'book-meal'}>{booked ? 'Cancel' : 'I’m Eating'}</button></div>
  </article>
}
