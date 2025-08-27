import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Initialize MSW for development/testing
async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('../test/mocks/browser')
    return worker.start({
      onUnhandledRequest: 'bypass',
    })
  }
  return Promise.resolve()
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})