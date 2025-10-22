import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { validateDatabaseSchema } from './debug/validateDatabase';
import './index.css';

// Phase 8.2: Validate database schema on startup
validateDatabaseSchema();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
