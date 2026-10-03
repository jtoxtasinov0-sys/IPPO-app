import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initTelegram } from './lib/telegram';
import { initPressAnimation } from './lib/press';
import './styles.css';

initTelegram();
initPressAnimation();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
