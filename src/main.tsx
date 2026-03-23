import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './i18n'

console.log('--- RE-STARTING APP WITH DEBUG ---');

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
    console.log('--- RENDER CALLED ---');
  } catch (err) {
    console.error('--- RENDER CRASHED ---', err);
    rootBase.innerHTML = `<div style="color:red; padding:20px;"><h1>CRASH: ${err}</h1></div>`;
  }
}
