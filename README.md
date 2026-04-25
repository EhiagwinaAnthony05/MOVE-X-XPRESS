# MOVE X XPRESS

MOVE X XPRESS is a full-stack dispatch and shipment tracking application for a Lagos-focused delivery business. It includes a public tracking experience, an admin dashboard for managing orders and riders, and a rider page for live location sharing.

## What It Does

- Public shipment tracking by tracking ID
- Admin order creation, update, delete, and review
- Admin rider profile creation and rider monitoring
- Rider login and live location sharing
- Tracking page map view with rider details when available
- JWT-based admin authentication with refresh tokens

## Tech Stack

### Frontend

- React
- Vite
- React Router
- ESLint
- Lucide React

### Backend

- Node.js
- Express
- Mongoose
- MongoDB Atlas
- Zod
- JSON Web Token (`jsonwebtoken`)

## Project Structure

```text
.
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── validators/
│   └── server.js
├── public/
├── src/
│   ├── Admin/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── utils/
│   ├── assets/
│   ├── components/
│   ├── data/
│   ├── App.jsx
│   ├── RiderPage.jsx
│   └── TrackingPage.jsx
├── package.json
└── README.md
```

## Main Routes

### Public Frontend Routes

- `/` - landing page
- `/tracking/:id` - public tracking page
- `/rider` - rider login and live location sharing page
- `/admin` - admin customer/order dashboard
- `/admin/customers` - admin customer/order dashboard
- `/admin/riders` - admin rider management dashboard

### Backend API Routes

- `/api/orders` - order listing and management
- `/api/riders` - rider management and rider session endpoints
- `/api/admin/auth` - admin login, refresh, logout, and profile endpoints

## Environment Variables

Create a `backend/.env` file:

```env
PORT=3001
MONGODB_URI=your-mongodb-connection-string
ADMIN_EMAIL=admin@movex.local
ADMIN_PASSWORD=your-admin-password
ADMIN_ACCESS_JWT_SECRET=your-long-random-secret
```

Create a frontend `.env` file in the project root if needed:

```env
VITE_API_BASE_URL=http://localhost:3001
```

Notes:

- Do not commit real secrets to version control.
- `ADMIN_API_KEY` is no longer the primary admin auth mechanism.
- Admin routes now use JWT bearer tokens issued by `/api/admin/auth/login`.

## Getting Started

### 1. Install frontend dependencies

```bash
npm install
```

### 2. Install backend dependencies

```bash
npm --prefix backend install
```

### 3. Start the backend

```bash
npm --prefix backend run dev
```

### 4. Start the frontend

```bash
npm run dev
```

### 5. Build the frontend

```bash
npm run build
```

## Available Scripts

### Frontend

- `npm run dev` - start the Vite development server
- `npm run build` - create a production frontend build
- `npm run preview` - preview the frontend production build
- `npm run lint` - run ESLint

### Backend

- `npm --prefix backend run dev` - start the backend server
- `npm --prefix backend start` - start backend in standard mode

## Auth Overview

### Admin Auth

- Admin signs in with email and password
- Backend returns a short-lived access token and a refresh token
- Refresh tokens are stored server-side
- Protected admin routes require `Authorization: Bearer <token>`

### Rider Auth

- Rider logs in with the rider profile created by admin
- Rider session uses a bearer token stored on the client
- Rider page is intended for location sharing, not order assignment

## Current Behavior Notes

- Tracking IDs must follow the `MX00000` format
- Tracking responses show rider details only when the order is explicitly linked to a rider
- Delivered orders preserve rider snapshot data for admin history popups
- The admin orders table supports clickable tracking IDs that open a detailed popup

## Recommended Local Workflow

1. Start the backend first.
2. Start the frontend.
3. Sign in to the admin page.
4. Create riders and orders from the admin dashboard.
5. Use the rider page to share live location.
6. Use the tracking page to verify public shipment status.

## Known Gaps

- Backend automated tests are not set up yet.
- Some legacy order data may not include newer rider snapshot fields until updated.
- Old delivered orders that previously lost rider info will not auto-recover historical rider details.
