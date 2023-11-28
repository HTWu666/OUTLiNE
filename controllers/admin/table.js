export const createTablePage = async (req, res) => {
  try {
    res.status(200).render('./admin/createTable', { layout: './layouts/tableManagement' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Get create table page failed' })
  }
}

export const checkTablePage = async (req, res) => {
  try {
    res.status(200).render('./admin/checkTable', { layout: './layouts/tableManagement' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Get check table page failed' })
  }
}
