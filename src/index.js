import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { Amplify } from 'aws-amplify';  // ✓ Changed from '@aws-amplify/core'
import { amplifyConfig } from './amplify-config';
import { UserProvider } from './Contexts/UserContext';

Amplify.configure(amplifyConfig);



const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <UserProvider>
        <App />
      </UserProvider>
    </BrowserRouter>
  </React.StrictMode>
);


