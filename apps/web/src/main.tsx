import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App';
import './index.css';
import { googleClientId, isGoogleAuthConfigured } from './config/authConfig';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isGoogleAuthConfigured ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </GoogleOAuthProvider>
    ) : (
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )}
  </React.StrictMode>
);
