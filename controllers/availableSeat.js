import moment from 'moment-timezone'
import * as availableSeatsModel from '../models/availableSeat.js'
import * as cache from '../utils/cache.js'

const getAvailableSeats = async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const { date } = req.query
    let availableSeats = await cache.scanAllMatches(
      `restaurant:${restaurantId}:availableDate:${date}*`,
      100
    )

    if (!availableSeats) {
      availableSeats = await availableSeatsModel.getAvailableSeats(restaurantId, date)
      await cache.lpush(`restaurant:${restaurantId}:availableDate:${date}`, 'yes')
      availableSeats.forEach(async (seat) => {
        const value = {
          id: seat.id,
          restaurant_id: seat.restaurant_id,
          table_id: seat.table_id,
          table_name: seat.table_name,
          seat_qty: seat.seat_qty,
          available_date: seat.available_date,
          available_time: seat.available_time,
          availability: seat.availability,
          created_at: seat.created_at
        }

        await cache.lpush(
          `restaurant:${restaurantId}:availableDate:${date}:availableTime:${seat.available_time}:seatQty:${seat.seat_qty}`,
          JSON.stringify(value)
        )
      })

      const transformedData = availableSeats.reduce((acc, seat) => {
        const existing = acc.find((entry) => entry.max_person === seat.seat_qty)
        const convertedTime = moment
          .utc(seat.available_time, 'HH:mm:ss')
          .tz('Asia/Taipei')
          .format('HH:mm')

        if (existing) {
          if (!existing.available_time.includes(convertedTime)) {
            existing.available_time.push(convertedTime)
            existing.available_time.sort()
          }
        } else {
          acc.push({
            max_person: seat.seat_qty,
            available_time: [convertedTime]
          })
        }

        return acc
      }, [])
      transformedData.sort((a, b) => a.max_person - b.max_person)

      return res.status(200).json({ data: transformedData })
    }

    const result = []

    // 用于存储不同时间的映射
    const timeMap = {}
    // 遍历输入数据
    for (const item of availableSeats) {
      // 解析元素的各个部分
      const parts = item.split(':')
      // 如果元素包含时间和座位数量信息
      if (parts.length === 10) {
        const available_time = moment
          .utc(`${parts[5]}:${parts[6]}:${parts[7]}`, 'HH:mm:ss')
          .tz('Asia/Taipei')
          .format('HH:mm')

        const max_person = parseInt(parts[9])

        // 将时间映射到 max_person
        if (!timeMap[max_person]) {
          timeMap[max_person] = []
        }

        timeMap[max_person].push(available_time)
      }
    }

    // 将映射转换为结果数组
    for (const max_person in timeMap) {
      if (timeMap.hasOwnProperty(max_person)) {
        result.push({ max_person: parseInt(max_person), available_time: timeMap[max_person] })
      }
    }

    // // 每次都從資料庫取資料,
    // // 若 cache 裡面沒有指定日期的資料 (可能訂完或是沒有更新 redis), 從資料庫取得指定日期的所有可訂位的時間, 更新 redis, 每筆資料依序寫入
    // let availableSeats = await cache.scanForMatches(
    //   `restaurant:${restaurantId}:availableDate:${date}*`,
    //   100
    // )
    // // 用一個 redis 標示說有從資料庫撈那天的資料, 這樣之後訂位可以刪除被訂走的 cache, 避免全部刪除的時候, 資料庫還沒更新狀態, 而導致不可訂位的資料又出現
    // // await cache.scanForMatches(`restaurant:${restaurantId}:availableDate:${date}`)
    // if (!availableSeats) {
    //   availableSeats = await availableSeatsModel.getAvailableSeats(restaurantId, date)
    //   await cache.hset(`restaurant:${restaurantId}:availableDate:${date}`, 'isUpdated', 'Y')
    //   availableSeats.forEach(async (seat) => {
    //     for (const [field, value] of Object.entries(seat)) {
    //       await cache.hset(
    //         `restaurant:${restaurantId}:availableDate:${seat.available_date}:availableTime:${seat.available_time}:seatQty:${seat.seat_qty}:availableId:${seat.id}`,
    //         field,
    //         value
    //       )
    //     }
    //   })
    // }

    // 若 cache 裡面有指定日期的資料, 回傳給前端的資料則依序從 redis 中取出並轉換

    res.status(200).json({ data: result })
  } catch (err) {
    console.error(err.stack)
    if (err instanceof Error) {
      return res.status(400).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get available seats failed' })
  }
}

export default getAvailableSeats
