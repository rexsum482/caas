import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AppContext } from "./utils/appContext";

// Apply CSS variables globally
document.documentElement.style.setProperty(
  "--primary-color",
  AppContext.primaryColor
);

document.documentElement.style.setProperty(
  "--accent-color",
  AppContext.accentColor
);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
      <App />
  </React.StrictMode>
);
