import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

console.log('한올채움 앱 시작 중...')

// Remove loading screen when React is ready
postMessage({ payload: 'removeLoading' }, '*')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

console.log('한올채움 앱 렌더링 완료') 