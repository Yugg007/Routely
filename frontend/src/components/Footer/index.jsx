import React from 'react'

const Footer = () => {
  return (
    <>
      <footer className="app-footer">
        <div className="footer-content">
          <p>&copy; {new Date().getFullYear()} Routely. All rights reserved.</p>
          <div className="footer-links">
            <a href="/terms">Terms</a>
            <a href="/privacy">Privacy</a>
            <a href="/contact">Contact</a>
          </div>
        </div>
      </footer>
    </>
  )
}

export default Footer