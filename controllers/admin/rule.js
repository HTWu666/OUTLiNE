const rulePage = async (req, res) => {
  try {
    res.status(200).render('./admin/setRule', { layout: './layouts/ruleManagement' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Get rule page failed' })
  }
}

export default rulePage
