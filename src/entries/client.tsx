import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import { StyleProvider, createCache } from '@ant-design/cssinjs';
import { App } from '../App';
import { InitialDataProvider } from '../state/InitialDataContext';
import type { AppInitialState } from '@shared/types';
import '../styles/global.css';
import 'antd/dist/reset.css';

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

const styleCache = createCache();
(styleCache as any).compat = true;

hydrateRoot(
  container,
  <StrictMode>
    <StyleProvider cache={styleCache} hashPriority="high">
      <ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
        <AntdApp>
          <InitialDataProvider value={initialState}>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </InitialDataProvider>
        </AntdApp>
      </ConfigProvider>
    </StyleProvider>
  </StrictMode>
);
