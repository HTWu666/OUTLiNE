import moment from 'moment-timezone'
import pool from './databasePool.js'

export const getWeeklyFootTrafficByHour = async (restaurantId, dataPeriod) => {
  const { rows: reservationData } = await pool.query(
    `
    SELECT SUM(adult + child) as person, dining_date, dining_time
    FROM reservations
    WHERE restaurant_id = $1
        AND status = 'seated'
        AND dining_date >= CURRENT_DATE - INTERVAL '${dataPeriod} days'
    GROUP BY dining_date, dining_time
    `,
    [restaurantId]
  )

  const { rows: waitlistData } = await pool.query(
    `
    SELECT SUM(adult + child) as person, updated_at
    FROM waitlist
    WHERE restaurant_id = $1
      AND status = 'seated'
      AND updated_at >= CURRENT_DATE - INTERVAL '${dataPeriod} days'
    GROUP BY updated_at
    `,
    [restaurantId]
  )

  const combinedData = [...reservationData, ...waitlistData]
  const daysOfWeek = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const groupedData = {}

  combinedData.forEach((item) => {
    let date
    let hour

    if (item.dining_date) {
      date = moment(item.dining_date).format('YYYY-MM-DD')
      const fullDate = `${date}T${item.dining_time}`
      hour = moment.utc(fullDate).tz('Asia/Taipei').format('HH')
    } else if (item.updated_at) {
      hour = moment(item.updated_at).utc().tz('Asia/Taipei').format('HH')
      date = moment(item.updated_at).utc().tz('Asia/Taipei').format('YYYY-MM-DD')
    }

    if (date && hour) {
      const dateParts = date.split('-')
      const dateForWeek = new Date(dateParts[0], dateParts[1] - 1, dateParts[2])
      const dayOfWeek = daysOfWeek[dateForWeek.getDay()]
      const key = `${dayOfWeek}-${hour}`

      if (!groupedData[key]) {
        groupedData[key] = {
          dayOfWeek,
          hour,
          person: 0
        }
      }

      groupedData[key].person += parseInt(item.person, 10)
    }
  })

  const groupedDataArray = Object.values(groupedData).sort(
    (a, b) => parseInt(a.hour, 10) - parseInt(b.hour, 10)
  )

  const labels = Array.from(new Set(groupedDataArray.map((item) => item.hour))).sort(
    (a, b) => parseInt(a, 10) - parseInt(b, 10)
  )

  const datasets = daysOfWeek.map((dayOfWeek) => ({
    label: dayOfWeek,
    data: labels.map((hour) => {
      const item = groupedDataArray.find(
        (item) => item.dayOfWeek === dayOfWeek && item.hour === hour
      )
      return item ? item.person : null
    })
  }))

  return { labels, datasets }
}

export const getWeeklyFootTrafficDistribution = async (restaurantId, dataPeriod) => {
  const { rows: reservationData } = await pool.query(
    `
      SELECT SUM(adult + child) as person, dining_date, dining_time
      FROM reservations
      WHERE restaurant_id = $1
          AND status = 'seated'
          AND dining_date >= CURRENT_DATE - INTERVAL '${dataPeriod} days'
      GROUP BY dining_date, dining_time
      `,
    [restaurantId]
  )

  const { rows: waitlistData } = await pool.query(
    `
      SELECT SUM(adult + child) as person, updated_at
      FROM waitlist
      WHERE restaurant_id = $1
        AND status = 'seated'
        AND updated_at >= CURRENT_DATE - INTERVAL '${dataPeriod} days'
      GROUP BY updated_at
      `,
    [restaurantId]
  )

  const combinedData = [...reservationData, ...waitlistData]
  const daysOfWeek = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const aggregatedDataByDay = daysOfWeek.reduce((acc, day) => ({ ...acc, [day]: 0 }), {})

  combinedData.forEach((item) => {
    const date = item.dining_date
      ? moment(item.dining_date).format('YYYY-MM-DD')
      : moment(item.updated_at).format('YYYY-MM-DD')
    const dayOfWeek = daysOfWeek[moment(date).day()]
    aggregatedDataByDay[dayOfWeek] += parseInt(item.person, 10)
  })

  const backgroundColor = [
    'rgba(255, 99, 132, 0.2)', // Red
    'rgba(54, 162, 235, 0.2)', // Blue
    'rgba(255, 206, 86, 0.2)', // Yellow
    'rgba(75, 192, 192, 0.2)', // Green
    'rgba(153, 102, 255, 0.2)', // Purple
    'rgba(255, 159, 64, 0.2)', // Orange
    'rgba(199, 199, 199, 0.2)' // Grey
  ]

  const borderColor = [
    'rgba(255, 99, 132, 0.6)', // Red
    'rgba(54, 162, 235, 0.6)', // Blue
    'rgba(255, 206, 86, 0.6)', // Yellow
    'rgba(75, 192, 192, 0.6)', // Green
    'rgba(153, 102, 255, 0.6)', // Purple
    'rgba(255, 159, 64, 0.6)', // Orange
    'rgba(199, 199, 199, 0.6)' // Grey
  ]

  const datasets = [
    {
      label: '用餐人數',
      data: daysOfWeek.map((day) => aggregatedDataByDay[day]),
      backgroundColor,
      borderColor,
      borderWidth: 1.5
    }
  ]

  return { labels: daysOfWeek, datasets }
}
