import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import App from './App.jsx';
import './styles.css';

hydrateRoot(document.getElementById('root'),
  <React.StrictMode><App /><Analytics /></React.StrictMode>,
);
