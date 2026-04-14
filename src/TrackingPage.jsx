import './TrackingPage.css'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import WhatsAppButton from './components/WhatsAppButton'
import Map from './components/Map'
import { useNavigate, useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { isTrackingIdFormatValid, normalizeTrackingId, shipmentData } from './data/trackingData'

function TrackingPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  // The route param decides which shipment summary and timeline get rendered.
  const trackingId = normalizeTrackingId(id)
  const shipment = shipmentData[trackingId]

  const handleSearch = async (value) => {
    const nextId = normalizeTrackingId(value)

    if (!isTrackingIdFormatValid(nextId)) {
      return false
    }

    navigate(`/tracking/${nextId}`)
    return true
  }

  return (
    <div className='tracking-page'>
      <Header />
      <SearchBar placeholder='Search another tracking ID...' onSubmit={handleSearch} />
      <Map
        title='Live Tracking'
        locationLabel={shipment?.mapLocation ?? 'Tracking details update once a valid shipment is selected.'}
      />
      <WhatsAppButton />
      <div className='status-container'>
        {shipment ? (
          <>
            <div className='tracking-info'>
              <h2>Tracking ID: {trackingId}</h2>
              <p>Rider&apos;s Name: {shipment.riderName}</p>
              <p>Estimated Delivery: {shipment.estimatedDelivery}</p>
              <p>Current Location: {shipment.currentLocation}</p>
              <p>Phone Number: {shipment.phoneNumber}</p>
            </div>
            <div className='tracking-status'>
              <h3>Shipment Progress</h3>
              <div className='tracking-timeline'>
                {shipment.steps.map((step, index) => (
                  <div key={`${step.status}-${index}`} className={`timeline-step ${step.completed ? 'completed' : 'pending'}`}>
                    <div className='timeline-marker'>
                      <div className='timeline-dot'>
                        {step.completed && <Check size={12} className='timeline-check' />}
                      </div>
                      {index < shipment.steps.length - 1 && <div className='timeline-line'></div>}
                    </div>
                    <div className='timeline-content'>
                      <div className='timeline-header'>
                        <h4>{step.status}</h4>
                        <span className='timeline-date'>{step.date} {step.time}</span>
                      </div>
                      <p className='timeline-location'>{step.location}</p>
                      <p className='timeline-description'>{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className='tracking-empty'>
            <h2>Tracking ID not found</h2>
            <p>
              {isTrackingIdFormatValid(trackingId)
                ? `No shipment was found for ${trackingId}.`
                : 'Use a valid tracking ID and try again.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default TrackingPage
