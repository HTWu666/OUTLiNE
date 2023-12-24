const dashboardPage = (req, res) => {
  try {
    res.status(200).render('./admin/dashboard', { layout: 'layouts/dashboard' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ errors: 'Get dashboard page failed' })
  }
}

export default dashboardPage
