import { Routes, Route, useNavigate } from 'react-router-dom'
import './App.css'
import Hero from './assets/hero.jpeg'
import SearchBar from './components/SearchBar'
import WhatsAppButton from './components/WhatsAppButton'
import Header from './components/Header'
import TrackingPage from './TrackingPage'
import { ClockCheck, SendHorizontal, BriefcaseBusiness } from 'lucide-react'
import { isTrackingIdFormatValid, normalizeTrackingId } from './data/trackingData'

function App() {
  const navigate = useNavigate()

  async function handleTracking(id) {
    const normalizedId = normalizeTrackingId(id)

    // Keep the search rules consistent anywhere the component is reused.
    if (!isTrackingIdFormatValid(normalizedId)) {
      return false
    }

    navigate(`/tracking/${normalizedId}`)
    return true
  }

  return (
    <Routes>
      <Route
        path='/'
        element={
          <div className='home-page'>
            <Header />
            <div className='hero-section' style={{ backgroundImage: `url(${Hero})`, backgroundSize: '100% 100%' }}>
              <div className='hero-content'>
                <h1>Move Anything.</h1>
                <h1>Deliver Anywhere Across Lagos.</h1>
                <p className='motto'>Faithfulness in every delivery.</p>
                <SearchBar onSubmit={handleTracking} />
              </div>
            </div>
            <section className='services-section'>
              <div className='service'>
                <div className='service-box'>
                  <div className='service-icon'>
                    <ClockCheck size={32} />
                  </div>
                  <div className='service-content'>
                    <h3>Same-day Delivery</h3>
                    <p>Fast and reliable same-day delivery service</p>
                  </div>
                </div>
                <div className='service-box'>
                  <div className='service-icon'>
                    <SendHorizontal size={32} />
                  </div>
                  <div className='service-content'>
                    <h3>Express Dispatch</h3>
                    <p>Rapid dispatch for urgent shipments</p>
                  </div>
                </div>
                <div className='service-box'>
                  <div className='service-icon'>
                    <BriefcaseBusiness size={32} />
                  </div>
                  <div className='service-content'>
                    <h3>Business Logistics</h3>
                    <p>Tailored solutions for businesses</p>
                  </div>
                </div>
              </div>
            </section>
            <WhatsAppButton phoneNumber='2349112414541' />
          </div>
        }
      />
      <Route path='/tracking/:id' element={<TrackingPage />} />
    </Routes>
  )
}

export default App
