import { describe, it, expect, beforeEach, vi } from 'vitest'
import { writeBackToDB } from '../cacheWriteBack.js'
import pg from 'pg'
import * as SQS from '../../utils/SQS.js'

vi.mock('pg', async () => {
  const actualPg = await vi.importActual('pg')
  const mockQuery = vi.fn(() => Promise.resolve({ rows: [] }))

  // 创建一个模拟的 `Pool` 类
  class MockPool {
    constructor() {
      this.query = mockQuery
    }
  }

  // 返回包含模拟 Pool 和其他实际 pg 导出的对象
  return {
    default: {
      Pool: MockPool
    },
    ...actualPg
  }
})

vi.mock('../../utils/SQS', () => ({
  sendMessage: vi.fn()
}))

describe('writeBackToDB function', () => {
  let pool

  beforeEach(() => {
    pool.query.mockResolvedValue({})
    vi.clearAllMocks()
  })

  it('should update availability and create a reservation', async () => {
    // Mock pool.query to simulate database behavior
    pool.query.mockResolvedValueOnce({}) // Mock the UPDATE query
    pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }) // Mock the INSERT query

    const reservationId = await writeBackToDB(
      123, // availableSeatId
      1, // restaurantId
      2, // adult
      1, // child
      '2023-12-25', // diningDate
      '18:00', // diningTime
      1, // tableId
      'A1', // tableName
      'John Doe', // name
      'Mr', // gender
      '1234567890', // phone
      'email@example.com', // email
      'Birthday', // purpose
      'No peanuts' // note
    )

    // Check if the database queries were called correctly
    expect(pool.query).toHaveBeenCalledTimes(2)
    expect(pool.query).toHaveBeenNthCalledWith(1, expect.any(String), [123])
    expect(pool.query).toHaveBeenNthCalledWith(2, expect.any(String), [
      1,
      2,
      1,
      '2023-12-25',
      '18:00',
      1,
      'Table 1',
      'John Doe',
      'Mr',
      '1234567890',
      'email@example.com',
      'Birthday',
      'No peanuts'
    ])

    // Check if SQS.sendMessage was called correctly
    expect(SQS.sendMessage).toHaveBeenCalledWith(
      process.env.NOTIFY_MAKING_RESERVATION_SUCCESSFULLY_SQS_QUEUE_URL,
      expect.any(String)
    )

    // Check the returned reservation ID
    expect(reservationId).toBe(1)
  })

  // Additional test cases can be added here
})
