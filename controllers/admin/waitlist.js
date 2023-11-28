import * as ruleModel from '../../models/rule.js'

export const createWaitlistPage = async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId, 10)
    const ruleDetails = await ruleModel.getRule(restaurantId)

    res.status(200).render('./admin/createWaitlist', {
      layout: 'layouts/bookingManagement',
      maxPersonPerGroup: ruleDetails.max_person_per_group
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Get create waitlist page failed' })
  }
}

export const checkWaitlistPage = async (req, res) => {
  try {
    res.status(200).render('./admin/checkWaitlist', { layout: 'layouts/bookingManagement' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Get check waitlist page failed' })
  }
}
