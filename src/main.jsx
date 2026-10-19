import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyFont, applyTheme, loadFont, loadTheme } from './themes'

applyTheme(loadTheme())
applyFont(loadFont())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
