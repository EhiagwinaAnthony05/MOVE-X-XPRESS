require('dotenv').config()



const express = require('express')
const cors = require('cors')
const orderRoutes = require('./routes/orderRoutes')
const riderRoutes = require('./routes/riderRoutes')
const adminAuthRoutes = require('./routes/adminAuthRoutes')
const connectDB = require('./config/db')

const app = express()
app.use(cors())
app.use(express.json())
const PORT = process.env.PORT || 3001

app.get('/', (_req, res) => {
  res.send('Backend server is running')
})

app.use('/api/orders', orderRoutes)
app.use('/api/riders', riderRoutes)
app.use('/api/admin/auth', adminAuthRoutes)

connectDB()

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})