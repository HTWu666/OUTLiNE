import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createReservation } from '../reservation'
import * as cache from '../../utils/cache.js'
import * as SQS from '../../utils/SQS.js'
import { getTable } from '../../models/table.js'

vi.mock('../../utils/SQS.js')
vi.mock('../../utils/cache.js', () => ({
  get: vi.fn().mockResolvedValue(JSON.stringify([2, 4])),
  set: vi.fn().mockResolvedValue(null),
  executeLuaScript: vi.fn().mockResolvedValue(true)
}))
vi.mock('../../models/table.js')

describe('createReservation', () => {
  let mockReq
  let mockRes

  beforeEach(() => {
    vi.clearAllMocks()
    mockReq = {
      body: {
        adult: 2,
        child: 1,
        diningDate: '2023-12-25',
        diningTime: '18:00',
        name: '王小明',
        gender: '先生',
        phone: '0912345678',
        email: 'example@example.com',
        purpose: '生日',
        note: '不吃牛肉'
      },
      params: {
        restaurantId: '1'
      }
    }
    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    }
  })

  it('should handle reservation creation successfully', async () => {
    cache.get.mockResolvedValue(JSON.stringify([2, 4]))
    cache.set.mockResolvedValue()
    SQS.sendMessage.mockResolvedValue()
    getTable.mockResolvedValue({ rows: [{ seat_qty: 4 }] })

    await createReservation(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Making reservation successfully' })
  })

  it('should handle no available seats scenario', async () => {
    cache.executeLuaScript.mockResolvedValue(null)

    await createReservation(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'no available seats' })
  })
})
