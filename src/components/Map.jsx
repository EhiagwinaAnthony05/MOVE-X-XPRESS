import './Map.css'

function Map({
  title = 'Live Tracking',
  locationLabel = 'Lagos Distribution Center',
}) {
  return (
    <div className='map-section'>
      <h2>{title}</h2>
      <p className='map-location'>{locationLabel}</p>
      <div className='map-container'>
        {/* Static map view until live rider coordinates are connected. */}
        <iframe
          src='https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.1234567890123!2d3.3792!3d6.5244!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103bf1234567890%3A0xabcdef1234567890!2sLagos%20Distribution%20Center!5e0!3m2!1sen!2sng!4v1700000000000'
          width='100%'
          height='400'
          style={{ border: 0, borderRadius: '8px' }}
          loading='lazy'
          title='Live Tracking Map'
        ></iframe>
      </div>
    </div>
  )
}

export default Map
