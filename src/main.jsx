import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.jsx';
import './styles.css';
import './mobile.css';

hydrateRoot(document.getElementById('root'),
  <React.StrictMode><App /><Analytics /></React.StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(error => {
      console.warn('The app could not enable offline installation support.', error);
    });
  }, { once: true });
}
