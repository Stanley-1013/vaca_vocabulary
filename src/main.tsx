import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import DevTestPage from './DevTestPage'
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
  // 檢查 URL 參數決定顯示測試頁面還是正式應用
  const isTestMode = window.location.search.includes('test=true')
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      {isTestMode ? <DevTestPage /> : <App />}
    </React.StrictMode>
  )
})