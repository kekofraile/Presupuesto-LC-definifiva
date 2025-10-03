import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swUrl = new URL('sw.js', `${window.location.origin}${import.meta.env.BASE_URL}`).toString();
    navigator.serviceWorker
      .register(swUrl)
      .catch((error) => console.error('No se pudo registrar el Service Worker', error));
  });
}
