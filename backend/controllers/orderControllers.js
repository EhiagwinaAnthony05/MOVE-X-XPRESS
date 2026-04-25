const Order = require('../models/Orders')
const Rider = require('../models/Rider')

const DELIVERY_STATUSES = [
  'pending',
  'assigned',
  'rider has picked up your item',
  'your rider is on his way',
  'delivered',
]

// Default shipment timeline used when a request does not provide explicit steps.
const timelineTemplate = [
  {
    status: 'pending',
    date: '2024-07-10',
    time: '10:30 AM',
    location: 'Online Store',
    description: 'Your order has been created and is waiting for rider assignment.',
  },
  {
    status: 'assigned',
    date: '2024-07-11',
    time: '2:15 PM',
    location: 'Warehouse A',
    description: 'A rider has been assigned to your order for pickup.',
  },
  {
    status: 'rider has picked up your item',
    date: '2024-07-12',
    time: '8:45 AM',
    location: 'Distribution Center',
    description: 'Your rider has picked up the package and is on his way.',
  },
  {
    status: 'your rider is on his way',
    date: '2024-07-14',
    time: '11:20 AM',
    location: 'Local Hub',
    description: 'Your rider is heading to the delivery address.',
  },
  {
    status: 'delivered',
    date: '2024-07-15',
    time: 'Expected',
    location: 'Your Address',
    description: 'The order has been delivered successfully.',
  },
]

const statusProgress = {
  pending: 0,
  assigned: 1,
  'rider has picked up your item': 2,
  'your rider is on his way': 3,
  delivered: 4,
}

const timelineTemplateByStatus = new Map(
  timelineTemplate.map((step) => [normalizeDeliveryStatus(step.status), step])
)

function normalizeDeliveryStatus(status) {
  const normalized = String(status || '').trim().toLowerCase()

  if (!normalized) {
    return 'pending'
  }

  const legacyStatusMap = {
    pending: 'pending',
    'rider assigned': 'assigned',
    assigned: 'assigned',
    'in transit': 'rider has picked up your item',
    'out for delivery': 'your rider is on his way',
    delivered: 'delivered',
  }

  return legacyStatusMap[normalized] || normalized
}

function formatStepDateTimeParts(value) {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return {
    date: parsed.toISOString().split('T')[0],
    time: parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
}

function isTemplateTimestamp(stepStatus, date, time) {
  const templateStep = timelineTemplateByStatus.get(normalizeDeliveryStatus(stepStatus))
  if (!templateStep) {
    return false
  }

  return templateStep.date === date && templateStep.time === time
}

function getTrackingId(orderObj) {
  return orderObj.trackingId || orderObj.id
}

function getSender(orderObj) {
  return {
    name: orderObj.sender?.name || orderObj.customerName || 'Unknown sender',
    phone: orderObj.sender?.phone || orderObj.phoneNumber || 'Not provided',
    address: orderObj.sender?.address || 'Address not provided',
  }
}

function getReceiver(orderObj) {
  return {
    name: orderObj.receiver?.name || 'Unknown receiver',
    phone: orderObj.receiver?.phone || 'Not provided',
    address: orderObj.receiver?.address || 'Address not provided',
    location: {
      lat: orderObj.receiver?.location?.lat ?? null,
      lng: orderObj.receiver?.location?.lng ?? null,
    },
  }
}

function getPackageDetails(orderObj) {
  return {
    description: orderObj.package?.description || orderObj.item || 'Package description not provided',
  }
}

function getRider(orderObj, steps) {
  return {
    riderId: orderObj.rider?.riderId || '',
    name: orderObj.rider?.name || orderObj.riderName || 'Unassigned',
    phone: orderObj.rider?.phone || '',
    currentLocation: orderObj.rider?.currentLocation || orderObj.currentLocation || (steps[0] ? steps[0].location : ''),
    estimatedDelivery: orderObj.rider?.estimatedDelivery || orderObj.estimatedDelivery || '',
    location: {
      lat: orderObj.rider?.location?.lat ?? null,
      lng: orderObj.rider?.location?.lng ?? null,
      accuracy: orderObj.rider?.location?.accuracy ?? null,
      heading: orderObj.rider?.location?.heading ?? null,
      speed: orderObj.rider?.location?.speed ?? null,
      updatedAt: orderObj.rider?.location?.updatedAt ?? null,
    },
    deliveredSnapshot: {
      name: orderObj.rider?.deliveredSnapshot?.name || '',
      phone: orderObj.rider?.deliveredSnapshot?.phone || '',
      currentLocation: orderObj.rider?.deliveredSnapshot?.currentLocation || '',
      deliveredAt: orderObj.rider?.deliveredSnapshot?.deliveredAt ?? null,
    },
  }
}

async function findRegisteredRider(riderInput) {
  if (!riderInput) {
    return null
  }

  if (riderInput.riderId) {
    const riderById = await Rider.findById(riderInput.riderId)
    if (riderById) {
      return riderById
    }
  }

  if (riderInput.phone) {
    const riderByPhone = await Rider.findOne({ phone: riderInput.phone.trim() })
    if (riderByPhone) {
      return riderByPhone
    }
  }

  if (riderInput.name) {
    const riderByName = await Rider.findOne({ name: riderInput.name.trim() })
    if (riderByName) {
      return riderByName
    }
  }

  return null
}

async function buildRiderFromInput(riderInput) {
  if (!riderInput) {
    return {
      riderId: '',
      name: '',
      phone: '',
      currentLocation: '',
      estimatedDelivery: '',
    }
  }

  const registeredRider = await findRegisteredRider(riderInput)
  if (!registeredRider) {
    return {
      riderId: riderInput.riderId || '',
      name: riderInput.name || '',
      phone: riderInput.phone || '',
      currentLocation: riderInput.currentLocation || '',
      estimatedDelivery: riderInput.estimatedDelivery || '',
    }
  }

  return {
    riderId: String(registeredRider._id),
    name: registeredRider.name,
    phone: registeredRider.phone,
    currentLocation: registeredRider.lastLocation?.placeName || riderInput.currentLocation || '',
    estimatedDelivery: riderInput.estimatedDelivery || '',
    location: {
      lat: registeredRider.lastLocation?.lat ?? null,
      lng: registeredRider.lastLocation?.lng ?? null,
      accuracy: registeredRider.lastLocation?.accuracy ?? null,
      heading: registeredRider.lastLocation?.heading ?? null,
      speed: registeredRider.lastLocation?.speed ?? null,
      updatedAt: registeredRider.lastLocation?.updatedAt ?? null,
    },
  }
}

function calculateDistanceKm(lat1, lng1, lat2, lng2) {
  const toRadians = (value) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const dLat = toRadians(lat2 - lat1)
  const dLng = toRadians(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function resolveLocationName(lat, lng) {
  const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'move-x/1.0 (delivery-tracking)',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      return fallback
    }

    const data = await response.json().catch(() => null)
    const name = data?.name || data?.display_name

    if (!name || typeof name !== 'string') {
      return fallback
    }

    return name
  } catch (_error) {
    return fallback
  } finally {
    clearTimeout(timeout)
  }
}

function calculateEstimatedDeliveryFromLocation(orderObj, locationTimestamp = new Date()) {
  const riderLat = orderObj?.rider?.location?.lat
  const riderLng = orderObj?.rider?.location?.lng
  const receiverLat = orderObj?.receiver?.location?.lat
  const receiverLng = orderObj?.receiver?.location?.lng

  if (![riderLat, riderLng, receiverLat, receiverLng].every((value) => Number.isFinite(value))) {
    return orderObj?.rider?.estimatedDelivery || ''
  }

  const distanceKm = calculateDistanceKm(riderLat, riderLng, receiverLat, receiverLng)
  const reportedSpeedMps = Number(orderObj?.rider?.location?.speed)
  const speedMps = Number.isFinite(reportedSpeedMps) && reportedSpeedMps > 0 ? reportedSpeedMps : 6.94
  const etaMinutes = Math.max(1, Math.ceil((distanceKm * 1000) / speedMps / 60))
  const etaDate = new Date(locationTimestamp.getTime() + etaMinutes * 60 * 1000)

  return `${etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${etaMinutes} min)`
}

async function findOrderByTrackingRef(orderId) {
  return Order.findOne({
    $or: [
      { trackingId: orderId },
      { id: orderId },
    ],
  })
}

function isLegacyOrder(orderObj) {
  return !orderObj.trackingId || !orderObj.sender || !orderObj.receiver || !orderObj.package
}

async function migrateLegacyOrder(order) {
  const orderObj = order.toObject ? order.toObject() : order

  if (!isLegacyOrder(orderObj)) {
    return order
  }

  const deliveryStatus = normalizeDeliveryStatus(orderObj.delivery?.status || orderObj.status)
  const sender = getSender(orderObj)
  const receiver = getReceiver(orderObj)
  const packageDetails = getPackageDetails(orderObj)
  const rider = getRider(orderObj, [])

  order.set('trackingId', getTrackingId(orderObj))
  order.set('sender', sender)
  order.set('receiver', receiver)
  order.set('package', packageDetails)
  order.set('delivery', { status: deliveryStatus })
  order.set('rider', rider)

  if (!order.deliveredAt && deliveryStatus === 'delivered') {
    order.deliveredAt = order.updatedAt || new Date()
  }

  if (!Array.isArray(order.steps) || order.steps.length === 0) {
    order.steps = buildSteps(deliveryStatus, [], {
      ...orderObj,
      sender,
      receiver,
      package: packageDetails,
      delivery: { status: deliveryStatus },
      rider,
      trackingId: getTrackingId(orderObj),
    })
  }

  await order.save()
  return order
}

// Build a frontend-ready timeline from the current shipment status.
function buildSteps(status, existingSteps = [], orderObj = {}) {
  const normalizedStatus = normalizeDeliveryStatus(status)
  const progressIndex = statusProgress[normalizedStatus] ?? 0
  const sender = getSender(orderObj)
  const receiver = getReceiver(orderObj)
  const rider = getRider(orderObj, [])
  const existingStepsByStatus = new Map(
    (Array.isArray(existingSteps) ? existingSteps : []).map((step) => [normalizeDeliveryStatus(step.status), step])
  )
  const createdAtParts = formatStepDateTimeParts(orderObj.createdAt)
  const timelineUpdateParts = formatStepDateTimeParts(orderObj._timelineTimestamp || orderObj.updatedAt) || formatStepDateTimeParts(new Date())
  const timelineLocations = [
    sender.address || 'Order Origin',
    sender.address || 'Pickup Location',
    rider.currentLocation || 'On Route',
    receiver.address || 'Delivery Route',
    receiver.address || 'Delivery Address',
  ]

  return timelineTemplate.map((step, index) => {
    const stepStatus = normalizeDeliveryStatus(step.status)
    const existingStep = existingStepsByStatus.get(stepStatus)
    const completed = index <= progressIndex

    let date = ''
    let time = ''

    if (completed) {
      // Reuse a stored timestamp only if this step had already been completed before.
      if (
        existingStep?.completed &&
        existingStep?.date &&
        existingStep?.time &&
        !isTemplateTimestamp(stepStatus, existingStep.date, existingStep.time)
      ) {
        date = existingStep.date
        time = existingStep.time
      } else if (stepStatus === 'pending' && createdAtParts) {
        date = createdAtParts.date
        time = createdAtParts.time
      } else if (timelineUpdateParts) {
        date = timelineUpdateParts.date
        time = timelineUpdateParts.time
      }
    }

    return {
      ...step,
      location: timelineLocations[index] || step.location,
      date,
      time,
      completed,
    }
  })
}

// Keep API responses aligned with the tracking page data shape.
function toOrderShape(order) {
  const orderObj = order.toObject ? order.toObject() : order
  const deliveryStatus = normalizeDeliveryStatus(orderObj.delivery?.status || orderObj.status)
  const steps = buildSteps(deliveryStatus, orderObj.steps, orderObj)
  const sender = getSender(orderObj)
  const receiver = getReceiver(orderObj)
  const packageDetails = getPackageDetails(orderObj)
  const rider = getRider(orderObj, steps)

  return {
    trackingId: getTrackingId(orderObj),
    sender,
    receiver,
    package: packageDetails,
    delivery: {
      status: deliveryStatus,
    },
    rider,
    createdAt: orderObj.createdAt,
    updatedAt: orderObj.updatedAt,
    deliveredAt: orderObj.deliveredAt || null,
    steps,
  }
}

async function toTrackingOrderShape(order) {
  const orderShape = toOrderShape(order)
  const registeredRider = await findRegisteredRider(orderShape.rider)

  if (!registeredRider) {
    return orderShape
  }

  return {
    ...orderShape,
    rider: {
      ...orderShape.rider,
      riderId: String(registeredRider._id),
      name: registeredRider.name,
      phone: registeredRider.phone,
      currentLocation: registeredRider.lastLocation?.placeName || orderShape.rider.currentLocation,
      location: {
        lat: registeredRider.lastLocation?.lat ?? null,
        lng: registeredRider.lastLocation?.lng ?? null,
        accuracy: registeredRider.lastLocation?.accuracy ?? null,
        heading: registeredRider.lastLocation?.heading ?? null,
        speed: registeredRider.lastLocation?.speed ?? null,
        updatedAt: registeredRider.lastLocation?.updatedAt ?? null,
      },
    },
  }
}

function getPeriodRange(period, referenceDate = new Date()) {
  const base = new Date(referenceDate)
  const start = new Date(base)
  const end = new Date(base)

  if (period === 'daily') {
    start.setHours(0, 0, 0, 0)
    end.setHours(23, 59, 59, 999)
  } else if (period === 'weekly') {
    const day = start.getDay()
    const diffToMonday = day === 0 ? 6 : day - 1
    start.setDate(start.getDate() - diffToMonday)
    start.setHours(0, 0, 0, 0)

    end.setTime(start.getTime())
    end.setDate(start.getDate() + 6)
    end.setHours(23, 59, 59, 999)
  } else if (period === 'monthly') {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)

    end.setTime(start.getTime())
    end.setMonth(start.getMonth() + 1, 0)
    end.setHours(23, 59, 59, 999)
  } else if (period === 'yearly') {
    start.setMonth(0, 1)
    start.setHours(0, 0, 0, 0)

    end.setTime(start.getTime())
    end.setMonth(11, 31)
    end.setHours(23, 59, 59, 999)
  }

  return {
    start,
    end,
  }
}

function parseReferenceDate(dateInput) {
  if (!dateInput) {
    return new Date()
  }

  const matched = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput)
  if (!matched) {
    return new Date(Number.NaN)
  }

  const year = Number(matched[1])
  const month = Number(matched[2]) - 1
  const day = Number(matched[3])

  return new Date(year, month, day)
}

async function getOrderSummary(req, res) {
  try {
    const period = req.query.period || 'daily'
    const allowedPeriods = ['daily', 'weekly', 'monthly', 'yearly']

    if (!allowedPeriods.includes(period)) {
      return res.status(400).json({ message: 'Invalid period. Use daily, weekly, monthly, or yearly.' })
    }

    const queryDate = parseReferenceDate(req.query.date)
    if (Number.isNaN(queryDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date query parameter.' })
    }

    const { start, end } = getPeriodRange(period, queryDate)

    const [totalOrdersInDatabase, ordersCreated, pendingDeliveries, ordersDelivered] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      Order.countDocuments({
        createdAt: { $gte: start, $lte: end },
        $and: [
          {
            $or: [
              { 'delivery.status': { $exists: false } },
              { 'delivery.status': { $ne: 'delivered' } },
            ],
          },
          { status: { $ne: 'Delivered' } },
        ],
      }),
      Order.countDocuments({
        $or: [
          { deliveredAt: { $gte: start, $lte: end } },
          {
            deliveredAt: null,
            $or: [
              { 'delivery.status': 'delivered' },
              { status: 'Delivered' },
            ],
            updatedAt: { $gte: start, $lte: end },
          },
        ],
      }),
    ])

    res.json({
      period,
      start,
      end,
      totalOrdersInDatabase,
      ordersCreated,
      pendingDeliveries,
      ordersDelivered,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

async function getAllOrders(_req, res) {
  try {
    const orders = await Order.find().sort({ createdAt: -1 })
    await Promise.all(orders.map((order) => migrateLegacyOrder(order)))
    res.json(orders.map((order) => toOrderShape(order)))
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

async function getOrderById(req, res) {
  try {
    const orderId = req.params.id
    const order = await findOrderByTrackingRef(orderId)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    await migrateLegacyOrder(order)
    res.json(await toTrackingOrderShape(order))
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

async function createOrder(req, res) {
  try {
    const { trackingId, sender, receiver, package: packageDetails, delivery, rider, steps } = req.validatedBody
    const normalizedStatus = normalizeDeliveryStatus(delivery?.status)
    const riderData = await buildRiderFromInput(rider)

    const existingOrder = await Order.findOne({
      $or: [
        { trackingId },
        { id: trackingId },
      ],
    })
    if (existingOrder) {
      return res.status(400).json({ message: 'Order with this trackingId already exists' })
    }

    const newOrder = await Order.create({
      id: trackingId,
      trackingId,
      sender,
      receiver,
      package: packageDetails,
      delivery: {
        status: normalizedStatus,
      },
      rider: {
        riderId: riderData.riderId,
        name: riderData.name,
        phone: riderData.phone,
        currentLocation: riderData.currentLocation,
        estimatedDelivery: riderData.estimatedDelivery,
        location: riderData.location || undefined,
      },
      deliveredAt: normalizedStatus === 'delivered' ? new Date() : null,
      steps: buildSteps(normalizedStatus, steps, {
        sender,
        receiver,
        rider: riderData,
      }),
    })

    res.status(201).json(toOrderShape(newOrder))
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

async function updateOrderStatus(req, res) {
  try {
    const orderId = req.params.id
    const { delivery, rider, receiver } = req.validatedBody
    const normalizedStatus = normalizeDeliveryStatus(delivery?.status)
    const riderData = rider ? await buildRiderFromInput(rider) : null

    const order = await findOrderByTrackingRef(orderId)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    await migrateLegacyOrder(order)
    order.set('delivery.status', normalizedStatus)
    order.deliveredAt = normalizedStatus === 'delivered' ? new Date() : null

    if (riderData?.riderId !== undefined) {
      order.set('rider.riderId', riderData.riderId)
    }
    if (riderData?.name !== undefined) {
      order.set('rider.name', riderData.name)
    }
    if (riderData?.phone !== undefined) {
      order.set('rider.phone', riderData.phone)
    }
    if (riderData?.currentLocation !== undefined) {
      order.set('rider.currentLocation', riderData.currentLocation)
    }
    if (riderData?.estimatedDelivery !== undefined) {
      order.set('rider.estimatedDelivery', riderData.estimatedDelivery)
    }
    if (riderData?.location) {
      order.set('rider.location', riderData.location)
    }

    if (receiver?.location?.lat !== undefined && receiver?.location?.lng !== undefined) {
      order.set('receiver.location', {
        lat: receiver.location.lat,
        lng: receiver.location.lng,
      })
    }

    if (normalizedStatus === 'delivered') {
      order.set('rider.deliveredSnapshot', {
        name: order.rider?.name || '',
        phone: order.rider?.phone || '',
        currentLocation: order.rider?.currentLocation || '',
        deliveredAt: new Date(),
      })
    }

    const existingSteps = Array.isArray(order.steps) ? order.steps.map((step) => ({
      status: step.status,
      date: step.date,
      time: step.time,
      location: step.location,
      description: step.description,
      completed: step.completed,
    })) : []

    order.steps = buildSteps(normalizedStatus, existingSteps, {
      ...(order.toObject ? order.toObject() : order),
      _timelineTimestamp: new Date(),
    })

    await order.save()

    res.json(toOrderShape(order))
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

async function updateRiderLocation(req, res) {
  try {
    const orderId = req.params.id
    const { lat, lng, accuracy, heading, speed, capturedAt } = req.validatedBody

    const order = await findOrderByTrackingRef(orderId)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    await migrateLegacyOrder(order)

    const locationTimestamp = capturedAt ? new Date(capturedAt) : new Date()

    order.set('rider.location', {
      lat,
      lng,
      accuracy: accuracy ?? null,
      heading: heading ?? null,
      speed: speed ?? null,
      updatedAt: locationTimestamp,
    })

    const locationName = await resolveLocationName(lat, lng)
    order.set('rider.currentLocation', locationName)
    order.set('rider.estimatedDelivery', calculateEstimatedDeliveryFromLocation(order.toObject ? order.toObject() : order, locationTimestamp))

    await order.save()

    res.json(toOrderShape(order))
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

async function deleteOrder(req, res) {
  try {
    const orderId = req.params.id?.trim().toUpperCase()
    const order = await findOrderByTrackingRef(orderId)

    if (!order) {
      return res.status(404).json({ message: 'Order not found' })
    }

    await Order.deleteOne({ _id: order._id })

    res.json({ message: `Order ${orderId} deleted successfully.` })
  } catch (error) {
    res.status(500).json({ message: 'Server error' })
  }
}

async function assignOrder(req, res) {
  const orderId = req.params.id?.trim().toUpperCase()
  const { riderId } = req.body

  if (!riderId || typeof riderId !== 'string') {
    return res.status(400).json({ message: 'riderId is required.' })
  }

  try {
    const rider = await Rider.findById(riderId)

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found.' })
    }

    const order = await Order.findOne({ trackingId: orderId })

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' })
    }

    order.rider.riderId = String(rider._id)
    order.rider.name = rider.name
    order.rider.phone = rider.phone
    await order.save()

    return res.json(toOrderShape(order))
  } catch (_error) {
    return res.status(500).json({ message: 'Server error' })
  }
}

async function unassignOrder(req, res) {
  const orderId = req.params.id?.trim().toUpperCase()

  try {
    const order = await Order.findOne({ trackingId: orderId })

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' })
    }

    if (normalizeDeliveryStatus(order.delivery?.status) === 'delivered') {
      return res.status(400).json({ message: 'Delivered orders keep rider details for history.' })
    }

    order.rider.riderId = ''
    order.rider.name = ''
    order.rider.phone = ''
    await order.save()

    return res.json(toOrderShape(order))
  } catch (_error) {
    return res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  getAllOrders,
  getOrderSummary,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateRiderLocation,
  deleteOrder,
  assignOrder,
  unassignOrder,
}