import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import ThemeContextProvider from './ThemeContext';
import AppModeProvider from './ModeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeContextProvider>
      <AppModeProvider>
        <App />
      </AppModeProvider>
    </ThemeContextProvider>
  </React.StrictMode>
);

reportWebVitals();
