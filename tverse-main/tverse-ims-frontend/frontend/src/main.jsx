import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'
import 'bootstrap/dist/css/bootstrap.min.css' // Adds Bootstrap CSS
import 'bootstrap/dist/js/bootstrap.bundle.min' // Adds Bootstrap JS (for Accordions/Dropdowns)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)