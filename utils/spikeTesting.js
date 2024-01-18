import http from 'k6/http'
import { check, sleep } from 'k6'

export const options = {
  ext: {
    loadimpact: {
      projectID: 3672084
    }
  },
  // Key configurations for spike in this section
  stages: [
    { duration: '10s', target: 1500 }, // fast ramp-up to a high point
    // No plateau
    { duration: '1m', target: 0 } // quick ramp-down to 0 users
  ]
}

const DOMAIN = 'https://www.nonstops.site'

export default () => {
  const availableTimeRes = http.get(`${DOMAIN}/api/restaurant/1/availableSeats?date=2023-12-25`)
  check(availableTimeRes, { 'get data status was 200': (r) => r.status === 200 })

  if (availableTimeRes.status === 200 && availableTimeRes.body) {
    const { data } = JSON.parse(availableTimeRes.body)
    if (data && data[0]) {
      const body = JSON.stringify({
        adult: 2,
        child: 0,
        diningDate: '2023-12-25',
        diningTime: '12:00',
        name: '廖小華',
        gender: '先生',
        phone: '0912345678',
        email: 'test@test.com',
        purpose: '生日',
        note: '只吃牛肉'
      })

      const headers = {
        headers: {
          'Content-Type': 'application/json'
        }
      }

      const res = http.post(`${DOMAIN}/api/restaurant/1/reservation/click`, body, headers)
      check(res, { 'post data status was 200': (r) => r.status === 200 })
      sleep(1)
    }
  }
}
