const crypto = require('crypto')
const Rider = require('../models/Rider')
const Order = require('../models/Orders')

function toPublicRiderShape(rider) {
  const riderObj = rider.toObject ? rider.toObject() : rider

  return {
    id: String(riderObj._id),
    name: riderObj.name,
    phone: riderObj.phone,
    isSharing: Boolean(riderObj.isSharing),
    lastLocation: {
      lat: riderObj.lastLocation?.lat ?? null,
      lng: riderObj.lastLocation?.lng ?? null,
      placeName: riderObj.lastLocation?.placeName || '',
      accuracy: riderObj.lastLocation?.accuracy ?? null,
      heading: riderObj.lastLocation?.heading ?? null,
      speed: riderObj.lastLocation?.speed ?? null,
      updatedAt: riderObj.lastLocation?.updatedAt ?? null,
    },
    createdAt: riderObj.createdAt,
    updatedAt: riderObj.updatedAt,
  }
}

function createToken() {
  return crypto.randomBytes(24).toString('hex')
}

async function resolveLocationName(lat, lng) {
  const fallback = `${lat.toFixed(6)}, ${lng.toFixed(6)}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 3000)

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'move-x/1.0 (rider-location)',
      },
      signal: controller.signal,
    })

    if (!response.ok) {
      return fallback
    }

    const data = await response.json().catch(() => null)
    const name = data?.name || data?.display_name

    return typeof name === 'string' && name ? name : fallback
  } catch (_error) {
    return fallback
  } finally {
    clearTimeout(timeout)
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

function calculateEta(orderObj, locationTimestamp = new Date()) {
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

async function signupRider(req, res) {
  try {
    const normalizedPhone = req.validatedBody.phone.trim()
    const normalizedName = req.validatedBody.name.trim()

    let rider = await Rider.findOne({ phone: normalizedPhone })

    if (rider) {
      rider.name = normalizedName
      await rider.save()
    } else {
      rider = await Rider.create({
        name: normalizedName,
        phone: normalizedPhone,
        authToken: createToken(),
      })
    }

    return res.status(201).json({
      rider: toPublicRiderShape(rider),
      token: rider.authToken,
    })
  } catch (_error) {
    return res.status(500).json({ message: 'Server error' })
  }
}

async function loginRider(req, res) {
  try {
    const normalizedPhone = req.validatedBody.phone.trim()
    const normalizedName = req.validatedBody.name.trim().toLowerCase()

    const rider = await Rider.findOne({ phone: normalizedPhone })

    if (!rider || rider.name.trim().toLowerCase() !== normalizedName) {
      return res.status(401).json({ message: 'Invalid rider name or phone.' })
    }

    return res.json({
      rider: toPublicRiderShape(rider),
      token: rider.authToken,
    })
  } catch (_error) {
    return res.status(500).json({ message: 'Server error' })
  }
}

async function getRiders(_req, res) {
  try {
    const riders = await Rider.find().sort({ createdAt: -1 })
    return res.json(riders.map((rider) => toPublicRiderShape(rider)))
  } catch (_error) {
    return res.status(500).json({ message: 'Server error' })
  }
}

async function getAuthenticatedRider(req, res) {
  return res.json(toPublicRiderShape(req.rider))
}

async function updateMyLocation(req, res) {
  try {
    const rider = req.rider
    const { lat, lng, accuracy, heading, speed, capturedAt } = req.validatedBody
    const locationTimestamp = capturedAt ? new Date(capturedAt) : new Date()
    const placeName = await resolveLocationName(lat, lng)

    rider.set('lastLocation', {
      lat,
      lng,
      placeName,
      accuracy: accuracy ?? null,
      heading: heading ?? null,
      speed: speed ?? null,
      updatedAt: locationTimestamp,
    })
    rider.isSharing = true
    await rider.save()

    return res.json({
      rider: toPublicRiderShape(rider),
    })
  } catch (_error) {
    return res.status(500).json({ message: 'Server error' })
  }
}

async function updateSharingState(req, res) {
  try {
    const rider = req.rider
    rider.isSharing = req.validatedBody.isSharing
    await rider.save()

    return res.json(toPublicRiderShape(rider))
  } catch (_error) {
    return res.status(500).json({ message: 'Server error' })
  }
}

async function deleteRiderProfile(req, res) {
  try {
    const riderId = req.params.id
    const rider = await Rider.findById(riderId)

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found.' })
    }

    await Order.updateMany(
      {
        $or: [
          { 'rider.riderId': String(rider._id) },
          { 'rider.phone': rider.phone },
        ],
        'delivery.status': { $ne: 'delivered' },
      },
      {
        $set: {
          'rider.riderId': '',
          'rider.name': '',
          'rider.phone': '',
          'rider.currentLocation': '',
          'rider.estimatedDelivery': '',
          'rider.location.lat': null,
          'rider.location.lng': null,
          'rider.location.accuracy': null,
          'rider.location.heading': null,
          'rider.location.speed': null,
          'rider.location.updatedAt': null,
        },
      }
    )

    await Rider.deleteOne({ _id: rider._id })

    return res.json({ message: 'Rider profile deleted.' })
  } catch (_error) {
    return res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  signupRider,
  loginRider,
  getRiders,
  getAuthenticatedRider,
  updateMyLocation,
  updateSharingState,
  deleteRiderProfile,
}
