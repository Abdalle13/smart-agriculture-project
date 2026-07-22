import path from 'path'
import ImageKit, { toFile } from '@imagekit/nodejs'
import Contact from '../models/Contact.js'

const imagekit = new ImageKit({ privateKey: process.env.IMAGEKIT_PRIVATE_KEY })

// POST /api/contact: farmer submits a support message (image optional)
export const createContact = async (req, res) => {
  try {
    const { category, subject, message, priority } = req.body

    if (!category || !subject?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'Category, subject, and message are required.' })
    }

    let imageUrl = null
    if (req.file) {
      const ext      = path.extname(req.file.originalname) || '.jpg'
      const fileName = `${Date.now()}_${req.user._id}${ext}`
      const uploaded = await imagekit.files.upload({
        file:     await toFile(req.file.buffer, fileName),
        fileName,
        folder:   '/support',
      })
      imageUrl = uploaded.url
    }

    const contact = await Contact.create({
      farmerId: req.user._id,
      category,
      subject:  subject.trim(),
      message:  message.trim(),
      imageUrl,
      priority: priority === 'true' || priority === true,
    })

    res.status(201).json({ success: true, data: contact })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// GET /api/contact/my: farmer sees their own support messages
export const getMyContacts = async (req, res) => {
  try {
    const contacts = await Contact.find({ farmerId: req.user._id }).sort({ createdAt: -1 })
    res.json({ success: true, data: contacts })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// GET /api/contact/all?status=&farmerId=&category=: admin sees all messages, filterable
export const getAllContacts = async (req, res) => {
  try {
    const { status, farmerId, category } = req.query
    const filter = {}
    if (status && status !== 'all')   filter.status = status
    if (farmerId && farmerId !== 'all') filter.farmerId = farmerId
    if (category && category !== 'all') filter.category = category

    const [contacts, openCount] = await Promise.all([
      Contact.find(filter).populate('farmerId', 'name email fieldName').sort({ priority: -1, createdAt: -1 }),
      Contact.countDocuments({ status: 'Open' }),
    ])

    res.json({ success: true, data: contacts, openCount })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// PATCH /api/contact/:id: admin updates status and/or replies
export const updateContact = async (req, res) => {
  try {
    const { status, adminReply } = req.body
    const updateFields = {}
    if (status) updateFields.status = status
    if (adminReply !== undefined) {
      updateFields.adminReply = adminReply
      updateFields.farmerSeen = false
    }

    const contact = await Contact.findByIdAndUpdate(req.params.id, updateFields, { returnDocument: 'after' })
      .populate('farmerId', 'name email fieldName')

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Support message not found.' })
    }

    res.json({ success: true, data: contact })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// PATCH /api/contact/mark-seen: farmer marks all their replied messages as seen
export const markContactsSeen = async (req, res) => {
  try {
    await Contact.updateMany({ farmerId: req.user._id, farmerSeen: false }, { farmerSeen: true })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
