const Rider = require('../models/Rider')

async function requireRiderAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const [scheme, token] = header.split(' ')

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Authentication required.' })
    }

    const rider = await Rider.findOne({ authToken: token })

    if (!rider) {
      return res.status(401).json({ message: 'Invalid rider token.' })
    }

    req.rider = rider
    return next()
  } catch (_error) {
    return res.status(500).json({ message: 'Server error' })
  }
}

module.exports = requireRiderAuth
