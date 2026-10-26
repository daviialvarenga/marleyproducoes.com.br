import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AutoReloadOnCredits } from './components/AutoReloadOnCredits';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary autoReloadOnCredits={true}>
        <AutoReloadOnCredits />
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

if ('serviceWorker' in navigator && import.meta.env && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
