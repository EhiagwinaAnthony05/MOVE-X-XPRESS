require('dotenv').config()
const express = require('express')
const cors = require('cors')
const orderRoutes = require('./routes/orderRoutes')
const trackingRoutes = require('./routes/trackingRoutes')
const riderRoutes = require('./routes/riderRoutes')
const adminAuthRoutes = require('./routes/adminAuthRoutes')
const connectDB = require('./config/db')

const app = express()

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:5174']

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))
app.use(express.json())
const PORT = process.env.PORT || 3001

app.get('/', (_req, res) => {
  res.send('Backend server is running')
})

app.use('/api/orders', orderRoutes)
app.use('/api/tracking', trackingRoutes)
app.use('/api/riders', riderRoutes)
app.use('/api/admin/auth', adminAuthRoutes)

async function startServer() {
  await connectDB()

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
  })
}

startServer()