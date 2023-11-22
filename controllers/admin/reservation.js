const checkReservationPage = async (req, res) => {
  try {
    res.status(200).render('./admin/checkReservation', { layout: 'layouts/bookingManagement' })
  } catch (err) {
    console.error(err)
    if (err instanceof Error) {
      return res.status(err.status).json({ error: err.message })
    }
    res.status(500).json({ error: 'Get reservation page failed' })
  }
}

export default checkReservationPage
