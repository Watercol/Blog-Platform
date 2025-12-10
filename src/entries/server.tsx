import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { ConfigProvider, App as AntdApp } from 'antd';
import { StyleProvider, createCache, extractStyle } from '@ant-design/cssinjs';
import { App } from '../App';
import { InitialDataProvider } from '../state/InitialDataContext';
import type { AppInitialState } from '@shared/types';

export const render = async (url: string, initialState: AppInitialState) => {
  const cache = createCache();
  (cache as any).compat = true;

  const app = (
    <StyleProvider cache={cache} hashPriority="high">
      <ConfigProvider theme={{ token: { colorPrimary: '#1677ff' } }}>
        <AntdApp>
          <InitialDataProvider value={initialState}>
            <StaticRouter location={url}>
              <App />
            </StaticRouter>
          </InitialDataProvider>
        </AntdApp>
      </ConfigProvider>
    </StyleProvider>
  );

  const appHtml = renderToString(app);
  const styleText = extractStyle(cache);

  return {
    appHtml,
    head: styleText
  };
};