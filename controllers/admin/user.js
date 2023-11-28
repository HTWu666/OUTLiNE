export const signinPage = async (req, res) => {
  try {
    res.status(200).render('./admin/signin', { layout: false })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Get sign in page failed' })
  }
}

export const memberPage = async (req, res) => {
  try {
    res.status(200).render('./admin/member', { layout: './layouts/member' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Get member page failed' })
  }
}
