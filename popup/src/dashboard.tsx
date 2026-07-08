import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Dashboard from './DashboardApp'

try {
  const rootEl = document.getElementById('root');
  if (!rootEl) {
    document.body.innerHTML = '<div style="padding:20px;color:red;">Error: root element not found</div>';
  } else {
    createRoot(rootEl).render(
      <StrictMode>
        <Dashboard />
      </StrictMode>,
    );
  }
} catch (err) {
  document.body.innerHTML = `<div style="padding:20px;color:red;font-family:sans-serif;">React Error: ${err}</div>`;
  console.error('React mount error:', err);
}
