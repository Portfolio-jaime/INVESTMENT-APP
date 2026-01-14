import React from 'react';
import ReactDOM from 'react-dom/client';
import LoveableApp from './LoveableApp';
// Import the original App for comparison
// import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <LoveableApp />
  </React.StrictMode>
);
