import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Suppress Razorpay SVG errors globally
window.addEventListener('error', (e) => {
  if (e.message?.includes('attribute width: Expected length')) {
    e.preventDefault();
    return false;
  }
});

const originalError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString?.() || '';
  if (message.includes('attribute width: Expected length') || 
      message.includes('svg') ||
      message.includes('Request failed with status code 500') ||
      message.includes('send-otp') ||
      message.includes('resend-otp')) return;
  originalError.apply(console, args);
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
