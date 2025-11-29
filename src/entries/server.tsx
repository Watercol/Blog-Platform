import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from '../App';
import { InitialDataProvider } from '../state/InitialDataContext';
import type { AppInitialState } from '@shared/types';

export const render = async (url: string, initialState: AppInitialState) => {
  const appHtml = renderToString(
    <InitialDataProvider value={initialState}>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </InitialDataProvider>
  );

  return {
    appHtml
  };
};
