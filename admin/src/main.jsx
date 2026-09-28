import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { tg } from './lib/api';
import './styles.css';

try {
  tg?.ready();
  tg?.expand();
  tg?.setHeaderColor?.('#1E1006');
  tg?.setBackgroundColor?.('#F7F3EC');
} catch {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
