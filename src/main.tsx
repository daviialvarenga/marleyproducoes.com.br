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
