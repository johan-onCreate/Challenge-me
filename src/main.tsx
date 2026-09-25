import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-expect-error Vite processes this stylesheet import at build time.
import './index.css'
import App from './App.js'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('Root element not found')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
