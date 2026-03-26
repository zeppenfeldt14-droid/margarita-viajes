import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './i18n'


const rootBase = document.getElementById('root');
if (!rootBase) {
  console.error('CRITICAL: No root element');
} else {
  try {
    createRoot(rootBase).render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  } catch (err) {
    rootBase.innerHTML = `<div style="color:red; padding:20px;"><h1>CRASH: ${err}</h1></div>`;
  }
}
