import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { Amplify } from 'aws-amplify';  // ✓ Changed from '@aws-amplify/core'
import { amplifyConfig } from './amplify-config';
import { UserProvider } from './Contexts/UserContext';
import { AIProvider } from './Contexts/AIContext';

Amplify.configure(amplifyConfig);



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AIProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </AIProvider>
    </BrowserRouter>
  </React.StrictMode>
);


