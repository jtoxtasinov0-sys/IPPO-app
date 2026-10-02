import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { tg } from './lib/api';
import './styles.css';

try {
  tg?.ready();
  tg?.expand();
  tg?.setHeaderColor?.('#FFFBF5');
  tg?.setBackgroundColor?.('#FFFBF5');
} catch {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
