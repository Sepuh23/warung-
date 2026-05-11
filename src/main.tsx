import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import CustomerApp from './CustomerApp.tsx';
import './index.css';
import { AccessibilityProvider } from '@/src/components/AccessibilityContext';

const isCustomerRoute = window.location.pathname.startsWith('/order');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AccessibilityProvider>
      {isCustomerRoute ? <CustomerApp /> : <App />}
    </AccessibilityProvider>
  </StrictMode>,
);
