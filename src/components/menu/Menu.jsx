import './Menu.css'

const weeklyMenu = [
  ['Monday', 'Aloo Paratha · Curd · Butter · Chutney · Tea', 'Rajmah Rasela · Jeera Aloo · Rice · Roti · Boondi Raita', 'Tikki Chaat / Samosa · Tea', 'Moong Masoor Dal · Kadhai Paneer · Rice · Roti · Rasgulla'],
  ['Tuesday', 'Poha · Vegetable Sandwich · Fruit · Tea · Milk', 'Dal Makhani · Mix Vegetable · Rice · Roti · Raita', 'Patty · Tea', 'Mah Chana Dal · Aloo Shimla Mirch · Rice · Roti · Ice Cream'],
  ['Wednesday', 'Macaroni · Garlic Bread · Sweet Daliya · Chaat · Tea', 'Pindi Channa · Seasonal Vegetables · Rice · Roti · Raita', 'Gol Gappe / Cake · Tea', 'Yellow Dal Tadka · Malai Kofta · Rice · Roti · Salad'],
  ['Thursday', 'Ajwain Paratha · Tamater Aloo · Curd · Butter · Tea', 'Kadhi · Aloo Mutter · Rice · Roti · Onion Salad', 'Nacho Chips · Tea', 'Moong Saboot Dal · Mix Vegetables · Rice · Roti · Papad · Halwa'],
  ['Friday', 'Pav Bhaji · Bread Toast & Jam · Tea · Fruit', 'Black Chana · Chinese Nutri · Rice · Roti · Raita', 'Namkeen / Pastry · Tea', 'Saboot Masoor Dal · Paneer Bhurji / Egg Curry · Rice · Roti · Gulab Jamun'],
  ['Saturday', 'Mix Parantha · Curd · Chutney · Tea', 'Saboot Mix Dal · Tawa Soya Chaap · Rice · Roti · Raita', 'Vegetable Pasta · Cold Coffee', 'Hari Dal · Chilli Potato · Rice · Roti · Chutney · Laddoo'],
  ['Sunday', 'Sunday Special Poori · Aloo Bhaji · Tea', 'White Channa · Roti Kulcha · Vegetable Jalfrezi · Rice · Raita', 'Biscuits · Tea', 'Mix Dal · Aloo Nutri / Giya Masala · Rice · Roti · Gulab Jamun'],
]

export default function Menu({ onGetStarted }) { return <section className="page-container menu-page"><p className="section-label">CHITKARA UNIVERSITY HOSTEL</p><h1 className="page-title">Weekly mess menu</h1><p className="page-description">The current mess menu, presented in a clean table. Select meals in your dashboard so the kitchen can prepare the right quantity.</p><div className="menu-table-wrap"><table><thead><tr><th>Day</th><th>Breakfast</th><th>Lunch</th><th>Snacks</th><th>Dinner</th></tr></thead><tbody>{weeklyMenu.map(row => <tr key={row[0]}>{row.map((cell, index) => <td key={index}>{cell}</td>)}</tr>)}</tbody></table></div><p className="menu-note">Menu items may change when ingredients are unavailable or due to hostel instructions.</p><button className="primary-button" onClick={onGetStarted}>Choose your role and book meals →</button></section> }
