import './Footer.css'

function Footer() {
  return (
    <footer className='mx-footer'>
      <div className='mx-footer-inner'>
        <h3>Contact MoveXpress</h3>
        <div className='mx-footer-links'>
          <a href='tel:09112414541' aria-label='Call MoveXpress'>
            Call: 09112414541
          </a>
          <a href='https://wa.me/2349112414541' target='_blank' rel='noreferrer' aria-label='Chat on WhatsApp'>
            WhatsApp: 09112414541
          </a>
          <a href='mailto:movexxpress247@gmail.com' aria-label='Send email to MoveXpress'>
            Email: movexxpress247@gmail.com
          </a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
