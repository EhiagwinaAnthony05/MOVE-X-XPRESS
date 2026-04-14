// Shared mock shipment data until a live tracking API is connected.
const timelineTemplate = [
  {
    status: 'Rider Assigned',
    date: '2024-07-10',
    time: '10:30 AM',
    location: 'Online Store',
    description: 'Your order has been successfully placed and confirmed.',
  },
  {
    status: 'Rider is on the way to pick up the package',
    date: '2024-07-11',
    time: '2:15 PM',
    location: 'Warehouse A',
    description: 'Package is being prepared for shipment.',
  },
  {
    status: 'In Transit',
    date: '2024-07-12',
    time: '8:45 AM',
    location: 'Distribution Center',
    description: 'Package is on its way to the delivery location.',
  },
  {
    status: 'Out for Delivery',
    date: '2024-07-14',
    time: '11:20 AM',
    location: 'Local Hub',
    description: 'Package is with the delivery rider and will arrive today.',
  },
  {
    status: 'Delivered',
    date: '2024-07-15',
    time: 'Expected',
    location: 'Your Address',
    description: 'Package will be delivered to you.',
  },
]

const createShipment = ({
  progressIndex,
  riderName,
  estimatedDelivery,
  currentLocation,
  phoneNumber,
  mapLocation,
}) => ({
  riderName,
  estimatedDelivery,
  currentLocation,
  phoneNumber,
  mapLocation,
  steps: timelineTemplate.map((step, index) => ({
    ...step,
    completed: index <= progressIndex,
  })),
})

export const shipmentData = {
  MXX001: createShipment({
    progressIndex: 0,
    riderName: 'John Doe',
    estimatedDelivery: '2024-07-15',
    currentLocation: 'Online Store',
    phoneNumber: '123-456-7890',
    mapLocation: 'Online Store, Lagos',
  }),
  MXX002: createShipment({
    progressIndex: 1,
    riderName: 'Aisha Bello',
    estimatedDelivery: '2024-07-15',
    currentLocation: 'Warehouse A',
    phoneNumber: '234-801-555-2234',
    mapLocation: 'Warehouse A, Ikeja',
  }),
  MXX003: createShipment({
    progressIndex: 2,
    riderName: 'Tunde James',
    estimatedDelivery: '2024-07-15',
    currentLocation: 'Lagos Distribution Center',
    phoneNumber: '234-803-111-7821',
    mapLocation: 'Lagos Distribution Center',
  }),
  MXX004: createShipment({
    progressIndex: 3,
    riderName: 'Kemi Ade',
    estimatedDelivery: '2024-07-14',
    currentLocation: 'Local Hub',
    phoneNumber: '234-809-444-5678',
    mapLocation: 'Local Hub, Lekki',
  }),
  MXX005: createShipment({
    progressIndex: 4,
    riderName: 'Samuel Okon',
    estimatedDelivery: '2024-07-15',
    currentLocation: 'Your Address',
    phoneNumber: '234-812-999-1010',
    mapLocation: 'Customer delivery address',
  }),
}

// Normalize user input before validation and route lookups.
export function normalizeTrackingId(id = '') {
  return id.trim().toUpperCase()
}

export function isTrackingIdFormatValid(id = '') {
  return /^MXX\d{3}$/.test(normalizeTrackingId(id))
}
