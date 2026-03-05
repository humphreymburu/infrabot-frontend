import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

window.onerror = (message, source, lineno, colno, error) => {
  console.error('[Atlas AI] Uncaught error:', message, source, lineno, colno, error)
  if (typeof window.__reportError === 'function') window.__reportError(String(message))
}

window.onunhandledrejection = (ev) => {
  console.error('[Atlas AI] Unhandled rejection:', ev.reason)
  if (typeof window.__reportError === 'function') window.__reportError(String(ev.reason))
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
