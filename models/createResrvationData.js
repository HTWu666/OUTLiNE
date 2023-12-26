import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config({ path: '../.env' })
const { Pool } = pg

const pool = new Pool({
  user: process.env.POSTGRE_USER,
  host: process.env.POSTGRE_HOST,
  database: process.env.POSTGRE_DATABASE,
  password: process.env.POSTGRE_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  }
})

function generateRandomTimeInRange() {
  const startHourUTC = 3
  const endHourUTC = 12

  const randomHour = Math.floor(Math.random() * (endHourUTC - startHourUTC + 1)) + startHourUTC
  const randomMinute = Math.floor(Math.random() * 60)
  const randomSecond = Math.floor(Math.random() * 60)

  const time = new Date(Date.UTC(2000, 0, 1, randomHour, randomMinute, randomSecond))
  return time.toISOString().split('T')[1].substring(0, 8)
}

const createRandomData = async () => {
  const values = []
  for (let i = 0; i < 5000; i++) {
    const adults = Math.floor(Math.random() * 4) + 1
    const children = Math.floor(Math.random() * 4) + 1

    const daysAgo = Math.floor(Math.random() * 30)
    const randomDate = new Date()
    randomDate.setDate(randomDate.getDate() - daysAgo)
    const diningDate = randomDate.toISOString().split('T')[0]

    const diningTime = generateRandomTimeInRange()

    values.push(
      `(1, ${adults}, ${children}, '${diningDate}', 18, 'A1', '吳惠婷', '小姐', '0937241630', 'huitingwu@gmail.com', '${diningTime}', 'seated')`
    )
  }

  const query = `
      INSERT INTO reservations(restaurant_id, adult, child, dining_date, table_id, table_name, name, gender, phone, email, dining_time, status)
      VALUES ${values.join(', ')}
    `

  await pool.query(query)
}

createRandomData().then(() => console.log('Data creation complete'))
