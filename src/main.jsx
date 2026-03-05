import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Surface uncaught errors in console (and optionally in UI via window.__reportError)
window.onerror = (message, source, lineno, colno, error) => {
  console.error('[Atlas AI] Uncaught error:', message, source, lineno, colno, error)
  if (typeof window.__reportError === 'function') window.__reportError(String(message))
}
window.onunhandledrejection = (ev) => {
  console.error('[Atlas AI] Unhandled rejection:', ev.reason)
  if (typeof window.__reportError === 'function') window.__reportError(String(ev.reason))
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
