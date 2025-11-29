import serialize from 'serialize-javascript';
import type { AppInitialState } from '@shared/types';

interface TemplateAssets {
  js: string[];
  css: string[];
  preload: string[];
}

interface TemplateOptions {
  appHtml: string;
  initialState: AppInitialState;
  assets: TemplateAssets;
  head?: string;
}

const renderCssLinks = (css: string[]) =>
  css
    .map((href) => `<link rel="stylesheet" href="${href}" />`)
    .join('');

const renderPreloadLinks = (preload: string[]) =>
  preload
    .map((href) => `<link rel="modulepreload" href="${href}" />`)
    .join('');

const renderJsModules = (entries: string[]) =>
  entries
    .map((src) => `<script type="module" src="${src}" defer></script>`)
    .join('');

export const renderDocument = ({ appHtml, initialState, assets, head }: TemplateOptions) => {
  const serializedState = serialize(initialState, { isJSON: true });

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="SSR-enabled blog platform" />
    <title>Blog Platform</title>
    ${head ?? ''}
    ${renderPreloadLinks(assets.preload)}
    ${renderCssLinks(assets.css)}
  </head>
  <body>
    <div id="root">${appHtml}</div>
    <script>window.__INITIAL_DATA__ = ${serializedState};</script>
    ${renderJsModules(assets.js)}
  </body>
</html>`;
};
