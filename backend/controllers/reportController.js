import PDFDocument from 'pdfkit'
import User from '../models/User.js'
import SensorRegister from '../models/SensorRegister.js'
import Sensor from '../models/Sensor.js'
import DiagnosisHistory from '../models/DiagnosisHistory.js'
import Contact from '../models/Contact.js'

const VALID_RANGES = ['daily', 'weekly', 'monthly']
const RANGE_LABELS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }

// Compute the [start, end] window for a period type, anchored on a reference date
const getDateRange = (range, dateStr) => {
  const ref = dateStr ? new Date(dateStr) : new Date()

  if (range === 'weekly') {
    const day = ref.getDay() // 0 = Sunday
    const diffToMonday = day === 0 ? -6 : 1 - day
    const start = new Date(ref)
    start.setDate(ref.getDate() + diffToMonday)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
    return { start, end }
  }

  if (range === 'monthly') {
    const start = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0)
    const end   = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999)
    return { start, end }
  }

  // daily (default)
  const start = new Date(ref)
  start.setHours(0, 0, 0, 0)
  const end = new Date(ref)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

const countBySeverity = (diagnoses) => {
  const counts = { High: 0, Medium: 0, Low: 0, None: 0, Unknown: 0 }
  diagnoses.forEach(d => { counts[d.severity] = (counts[d.severity] || 0) + 1 })
  return counts
}

// Plain-language verdict for a farmer's own field — same threshold logic as
// adviseController.js's getSoilAdvisory, applied to the period's average readings
const computeFarmerVerdict = ({ readingCount, avgReadings, severityCounts, tickets }) => {
  const issues = []
  const { nitrogen, phosphorus, potassium, temperature, moisture } = avgReadings

  if (readingCount > 0) {
    if (moisture > 85) issues.push('Average soil moisture was too high — risk of waterlogging.')
    else if (moisture < 35) issues.push('Average soil moisture was too low — crops may be under water stress.')
    if (nitrogen < 50) issues.push('Nitrogen levels were below the healthy range.')
    else if (nitrogen > 200) issues.push('Nitrogen levels were above the healthy range.')
    if (phosphorus < 25) issues.push('Phosphorus levels were below the healthy range.')
    if (potassium < 20) issues.push('Potassium levels were below the healthy range.')
    if (temperature > 40) issues.push('Average soil temperature was too high.')
  }

  if (severityCounts.High > 0) {
    issues.push(`${severityCounts.High} high-risk disease scan(s) were detected.`)
  }

  const openTickets = tickets.filter(t => t.status !== 'Resolved').length
  if (openTickets > 0) {
    issues.push(`${openTickets} support message(s) are still unresolved.`)
  }

  return { status: issues.length === 0 ? 'good' : 'attention', issues }
}

// Plain-language verdict for the system-wide admin report
const computeAdminVerdict = ({ severityCounts, ticketStatusCounts }) => {
  const issues = []

  if (severityCounts.High > 0) {
    issues.push(`${severityCounts.High} high-risk diagnosis case(s) were reported.`)
  }
  if (ticketStatusCounts.Open > 0) {
    issues.push(`${ticketStatusCounts.Open} support message(s) are still waiting for a reply.`)
  }

  return { status: issues.length === 0 ? 'good' : 'attention', issues }
}

// ─── Admin report data ──────────────────────────────────────────────────────
const buildAdminReportData = async (range, dateStr) => {
  const { start, end } = getDateRange(range, dateStr)

  const [newFarmers, totalFarmers, activeFarmers, totalNodes, readingsInPeriod, diagnoses, tickets] = await Promise.all([
    User.find({ role: 'farmer', createdAt: { $gte: start, $lte: end } }).select('name email createdAt'),
    User.countDocuments({ role: 'farmer' }),
    User.countDocuments({ role: 'farmer', isApproved: true }),
    SensorRegister.countDocuments(),
    Sensor.countDocuments({ createdAt: { $gte: start, $lte: end } }),
    DiagnosisHistory.find({ createdAt: { $gte: start, $lte: end } }).populate('farmerId', 'name'),
    Contact.find({ createdAt: { $gte: start, $lte: end } }).populate('farmerId', 'name'),
  ])

  const ticketStatusCounts = { Open: 0, 'In Progress': 0, Resolved: 0 }
  tickets.forEach(t => { ticketStatusCounts[t.status] = (ticketStatusCounts[t.status] || 0) + 1 })

  const severityCounts = countBySeverity(diagnoses)

  return {
    range, start, end,
    verdict: computeAdminVerdict({ severityCounts, ticketStatusCounts }),
    newFarmers: newFarmers.map(f => ({ name: f.name, email: f.email, joinedAt: f.createdAt })),
    totalFarmers, activeFarmers, totalNodes,
    readingsInPeriod,
    diagnosisCount: diagnoses.length,
    severityCounts,
    diagnoses: diagnoses.map(d => ({ farmer: d.farmerId?.name || 'N/A', disease: d.disease, severity: d.severity, date: d.createdAt })),
    ticketCount: tickets.length,
    ticketStatusCounts,
    tickets: tickets.map(t => ({ farmer: t.farmerId?.name || 'N/A', category: t.category, status: t.status, date: t.createdAt })),
  }
}

// ─── Farmer report data ─────────────────────────────────────────────────────
const buildFarmerReportData = async (farmerId, range, dateStr) => {
  const { start, end } = getDateRange(range, dateStr)

  const user = await User.findById(farmerId)
  const sensorIds = user?.sensorIds || []

  const [readings, diagnoses, tickets] = await Promise.all([
    sensorIds.length
      ? Sensor.find({ sensorId: { $in: sensorIds }, createdAt: { $gte: start, $lte: end } })
      : [],
    DiagnosisHistory.find({ farmerId, createdAt: { $gte: start, $lte: end } }),
    Contact.find({ farmerId, createdAt: { $gte: start, $lte: end } }),
  ])

  const avg = (key) => readings.length
    ? Math.round((readings.reduce((s, r) => s + (r[key] || 0), 0) / readings.length) * 10) / 10
    : 0

  const readingCount = readings.length
  const avgReadings = {
    nitrogen: avg('nitrogen'), phosphorus: avg('phosphorus'), potassium: avg('potassium'),
    temperature: avg('temperature'), humidity: avg('humidity'), moisture: avg('moisture'),
  }
  const severityCounts = countBySeverity(diagnoses)
  const mappedTickets = tickets.map(t => ({ subject: t.subject, status: t.status, date: t.createdAt }))

  return {
    range, start, end,
    verdict: computeFarmerVerdict({ readingCount, avgReadings, severityCounts, tickets: mappedTickets }),
    farmerName: user?.name, fieldName: user?.fieldName || 'My Field',
    readingCount,
    avgReadings,
    diagnosisCount: diagnoses.length,
    severityCounts,
    diagnoses: diagnoses.map(d => ({ disease: d.disease, severity: d.severity, date: d.createdAt })),
    ticketCount: tickets.length,
    tickets: mappedTickets,
  }
}

// ─── PDF rendering ──────────────────────────────────────────────────────────
const drawHeader = (doc, title, data) => {
  doc.fontSize(20).fillColor('#059669').text(title, { align: 'center' })
  doc.moveDown(0.3)
  doc.fontSize(11).fillColor('#64748b').text(
    `${RANGE_LABELS[data.range]} Report  ·  ${data.start.toDateString()} to ${data.end.toDateString()}`,
    { align: 'center' }
  )
  doc.moveDown(1.5)
}

const drawSectionTitle = (doc, title) => {
  doc.fontSize(13).fillColor('#0f172a').text(title)
  doc.moveDown(0.3)
}

const drawFooter = (doc) => {
  doc.moveDown(2)
  doc.fontSize(8).fillColor('#94a3b8').text(`Generated ${new Date().toLocaleString()} · AgriSense`, { align: 'center' })
}

const drawVerdict = (doc, verdict) => {
  if (verdict.status === 'good') {
    doc.fontSize(12).fillColor('#059669').text('✓ Everything looks good this period.')
  } else {
    doc.fontSize(12).fillColor('#d97706').text('⚠ Needs attention:')
    doc.fontSize(10).fillColor('#334155')
    verdict.issues.forEach(issue => doc.text(`•  ${issue}`))
  }
  doc.moveDown(1)
}

const renderAdminPDF = (doc, data) => {
  drawHeader(doc, 'AgriSense — Admin System Report', data)
  drawVerdict(doc, data.verdict)

  drawSectionTitle(doc, 'Summary')
  doc.fontSize(10).fillColor('#334155')
  doc.text(`New Farmer Registrations: ${data.newFarmers.length}`)
  doc.text(`Total Farmers: ${data.totalFarmers}   |   Active Farmers: ${data.activeFarmers}`)
  doc.text(`Registered Field Nodes: ${data.totalNodes}`)
  doc.text(`Sensor Readings Collected: ${data.readingsInPeriod}`)
  doc.text(`AI Diagnoses Performed: ${data.diagnosisCount}  (High: ${data.severityCounts.High}, Medium: ${data.severityCounts.Medium}, Low: ${data.severityCounts.Low}, Healthy: ${data.severityCounts.None})`)
  doc.text(`Support Messages: ${data.ticketCount}  (Open: ${data.ticketStatusCounts.Open}, In Progress: ${data.ticketStatusCounts['In Progress']}, Resolved: ${data.ticketStatusCounts.Resolved})`)
  doc.moveDown(1)

  if (data.newFarmers.length) {
    drawSectionTitle(doc, 'New Farmer Registrations')
    doc.fontSize(9).fillColor('#334155')
    data.newFarmers.forEach(f => doc.text(`${f.name}  —  ${f.email}  —  ${new Date(f.joinedAt).toLocaleDateString()}`))
    doc.moveDown(1)
  }

  if (data.diagnoses.length) {
    drawSectionTitle(doc, 'AI Diagnosis Log')
    doc.fontSize(9).fillColor('#334155')
    data.diagnoses.forEach(d => doc.text(`${d.farmer}  —  ${d.disease}  —  ${d.severity}  —  ${new Date(d.date).toLocaleDateString()}`))
    doc.moveDown(1)
  }

  if (data.tickets.length) {
    drawSectionTitle(doc, 'Support Messages')
    doc.fontSize(9).fillColor('#334155')
    data.tickets.forEach(t => doc.text(`${t.farmer}  —  ${t.category}  —  ${t.status}  —  ${new Date(t.date).toLocaleDateString()}`))
  }

  drawFooter(doc)
}

const renderFarmerPDF = (doc, data) => {
  drawHeader(doc, 'AgriSense — My Field Report', data)

  doc.fontSize(11).fillColor('#0f172a').text(`${data.farmerName || 'Farmer'}  ·  ${data.fieldName}`, { align: 'center' })
  doc.moveDown(1)
  drawVerdict(doc, data.verdict)

  drawSectionTitle(doc, 'Soil & Telemetry Summary')
  doc.fontSize(10).fillColor('#334155')
  doc.text(`Readings Collected: ${data.readingCount}`)
  doc.text(`Avg Nitrogen: ${data.avgReadings.nitrogen} mg/kg   |   Avg Phosphorus: ${data.avgReadings.phosphorus} mg/kg   |   Avg Potassium: ${data.avgReadings.potassium} mg/kg`)
  doc.text(`Avg Temperature: ${data.avgReadings.temperature}°C   |   Avg Humidity: ${data.avgReadings.humidity}%   |   Avg Soil Moisture: ${data.avgReadings.moisture}%`)
  doc.moveDown(1)

  drawSectionTitle(doc, 'Crop Disease Scans')
  doc.fontSize(10).fillColor('#334155')
  doc.text(`Total Scans: ${data.diagnosisCount}  (High: ${data.severityCounts.High}, Medium: ${data.severityCounts.Medium}, Low: ${data.severityCounts.Low}, Healthy: ${data.severityCounts.None})`)
  if (data.diagnoses.length) {
    doc.moveDown(0.5)
    doc.fontSize(9)
    data.diagnoses.forEach(d => doc.text(`${d.disease}  —  ${d.severity}  —  ${new Date(d.date).toLocaleDateString()}`))
  }
  doc.moveDown(1)

  if (data.tickets.length) {
    drawSectionTitle(doc, 'Support Messages')
    doc.fontSize(9).fillColor('#334155')
    data.tickets.forEach(t => doc.text(`${t.subject}  —  ${t.status}  —  ${new Date(t.date).toLocaleDateString()}`))
  }

  drawFooter(doc)
}

// ─── Route handlers ─────────────────────────────────────────────────────────

// GET /api/reports/admin?range=daily|weekly|monthly&date=YYYY-MM-DD
export const getAdminReportSummary = async (req, res) => {
  try {
    const { range = 'daily', date } = req.query
    if (!VALID_RANGES.includes(range)) {
      return res.status(400).json({ success: false, message: 'Invalid range. Use daily, weekly, or monthly.' })
    }
    const data = await buildAdminReportData(range, date)
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// GET /api/reports/admin/pdf?range=daily|weekly|monthly&date=YYYY-MM-DD
export const downloadAdminReportPDF = async (req, res) => {
  try {
    const { range = 'daily', date } = req.query
    if (!VALID_RANGES.includes(range)) {
      return res.status(400).json({ success: false, message: 'Invalid range. Use daily, weekly, or monthly.' })
    }
    const data = await buildAdminReportData(range, date)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="agrisense_admin_${range}_report.pdf"`)

    const doc = new PDFDocument({ margin: 50 })
    doc.pipe(res)
    renderAdminPDF(doc, data)
    doc.end()
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// GET /api/reports/farmer?range=daily|weekly|monthly&date=YYYY-MM-DD
export const getFarmerReportSummary = async (req, res) => {
  try {
    const { range = 'daily', date } = req.query
    if (!VALID_RANGES.includes(range)) {
      return res.status(400).json({ success: false, message: 'Invalid range. Use daily, weekly, or monthly.' })
    }
    const data = await buildFarmerReportData(req.user._id, range, date)
    res.json({ success: true, data })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

// GET /api/reports/farmer/pdf?range=daily|weekly|monthly&date=YYYY-MM-DD
export const downloadFarmerReportPDF = async (req, res) => {
  try {
    const { range = 'daily', date } = req.query
    if (!VALID_RANGES.includes(range)) {
      return res.status(400).json({ success: false, message: 'Invalid range. Use daily, weekly, or monthly.' })
    }
    const data = await buildFarmerReportData(req.user._id, range, date)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="agrisense_my_${range}_report.pdf"`)

    const doc = new PDFDocument({ margin: 50 })
    doc.pipe(res)
    renderFarmerPDF(doc, data)
    doc.end()
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}
