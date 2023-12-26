import { describe, it, expect, vi, beforeEach } from 'vitest'
import getAvailableSeats from '../availableSeat.js'
import * as cache from '../../utils/cache.js'
import * as availableSeatsModel from '../../models/availableSeat.js'

vi.mock('../../utils/cache.js', () => ({
  lrange: vi.fn(),
  get: vi.fn(),
  setnx: vi.fn(),
  exists: vi.fn()
}))
vi.mock('../../models/availableSeat.js', () => ({
  getAvailableSeats: vi.fn()
}))

describe('getAvailableSeats', () => {
  let mockReq
  let mockRes

  beforeEach(() => {
    mockReq = {
      params: { restaurantId: '1' },
      query: { date: '2023-12-25' }
    }
    mockRes = {
      status: vi.fn(() => mockRes),
      json: vi.fn()
    }
    vi.clearAllMocks()
  })

  it('should return available seats from cache', async () => {
    cache.lrange.mockResolvedValue(['seat info'])
    cache.exists.mockResolvedValue(1)

    await getAvailableSeats(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({ data: expect.anything() })
  })

  it('should return empty array if no data and lock is set to noData', async () => {
    cache.lrange.mockResolvedValue([])
    cache.get.mockResolvedValue('noData')

    await getAvailableSeats(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({ data: [] })
  })

  it('should fetch available seats from database if not in cache', async () => {
    cache.lrange.mockResolvedValue([])
    cache.get.mockResolvedValue(null)
    availableSeatsModel.getAvailableSeats.mockResolvedValue(['db seat info'])

    await getAvailableSeats(mockReq, mockRes)

    expect(mockRes.status).toHaveBeenCalledWith(200)
    expect(mockRes.json).toHaveBeenCalledWith({ data: expect.anything() })
  })
})
