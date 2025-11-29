import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from '../App';
import { InitialDataProvider } from '../state/InitialDataContext';
import type { AppInitialState } from '@shared/types';
import '../styles/global.css';

declare global {
  interface Window {
    __INITIAL_DATA__?: AppInitialState;
  }
}

const initialState: AppInitialState =
  window.__INITIAL_DATA__ ?? {
    view: 'list'
  };

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root container is missing');
}

hydrateRoot(
  container,
  <StrictMode>
    <InitialDataProvider value={initialState}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </InitialDataProvider>
  </StrictMode>
);
