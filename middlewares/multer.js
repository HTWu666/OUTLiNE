import path from 'path'
import multer from 'multer'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs'
import util from 'util'

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  },
  region: process.env.AWS_REGION
})

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  const requiredField = [
    'name',
    'address',
    'phone',
    'parking',
    'payment',
    'kids-chair',
    'vegetarian-option'
  ]

  const emptyField = requiredField.find((field) => !req.body[field])
  if (emptyField) {
    const err = new Error(`Please fill in ${emptyField}`)
    err.status = 400
    return cb(err, false)
  }

  const kidChair = req.body['kids-chair']
  if (kidChair !== 'yes' || kidChair !== 'no') {
    const err = new Error(`Please choose yes or no for kids chair`)
    err.status = 400
    return cb(err, false)
  }

  const vegetarian = req.body['vegetarian-option']
  if (vegetarian !== 'yes' || vegetarian !== 'no') {
    const err = new Error(`Please choose yes or no for vegetarian option`)
    err.status = 400
    return cb(err, false)
  }

  cb(null, true)
}

const unlink = util.promisify(fs.unlink)

const upload = multer({ storage, fileFilter, limits: { fileSize: 100000000 } })
const uploadSingle = util.promisify(upload.single('photo'))

async function imgUpload(req, res, next) {
  try {
    await uploadSingle(req, res)
    if (!req.file) {
      return res.status(400).json({ message: 'Please choose a picture' })
    }
    const pictureObj = req.file
    const pictureFileStream = fs.createReadStream(pictureObj.path)
    const pictureParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: pictureObj.filename,
      Body: pictureFileStream,
      ContentType: pictureObj.mimetype
    }

    await s3.send(new PutObjectCommand(pictureParams))
    await unlink(`./uploads/${pictureObj.filename}`)

    next()
  } catch (err) {
    console.error(err)
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message })
    }
    res.status(500).json({ message: 'Upload image failed' })
  }
}

export default imgUpload
