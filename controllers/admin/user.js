export const signinPage = async (req, res) => {
  try {
    res.status(200).render('./admin/signin', { layout: false })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Get sign in page failed' })
  }
}

export const profilePage = async (req, res) => {
  try {
    res.status(200).render('./admin/profile', { layout: './layouts/userManagement' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Get profile page failed' })
  }
}

export const signupPage = async (req, res) => {
  try {
    res.status(200).render('./admin/signup', { layout: false })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Get sign up page failed' })
  }
}

export const reviewApplicationPage = async (req, res) => {
  try {
    res.status(200).render('./admin/reviewApplication', { layout: './layouts/userManagement' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Get review application page failed' })
  }
}
