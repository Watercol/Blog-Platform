import type { RequestHandler } from 'express';
import { createServer as createViteServer, type ViteDevServer } from 'vite';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { AppConfig } from '../config/env';
import type { AppDependencies } from '../config/context';
import { resolveInitialState } from './resolveInitialState';
import { renderDocument } from './template';
import type { AppInitialState } from '@shared/types';

type ManifestEntry = {
  file: string;
  src?: string;
  isEntry?: boolean;
  css?: string[];
  assets?: string[];
  imports?: string[];
};

type Manifest = Record<string, ManifestEntry>;

const clientEntry = 'src/entries/client.tsx';

const loadManifest = async (): Promise<Manifest | null> => {
  try {
    const manifestPath = path.resolve(process.cwd(), 'dist/client/.vite/manifest.json');
    const content = await fs.readFile(manifestPath, 'utf-8');
    return JSON.parse(content) as Manifest;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('[SSR] Manifest not found, did you forget to run `npm run build`?', error);
    return null;
  }
};

const gatherAssets = (manifest: Manifest) => {
  const visited = new Set<string>();
  const js = new Set<string>();
  const css = new Set<string>();
  const preload = new Set<string>();

  const traverse = (key: string) => {
    if (visited.has(key)) {
      return;
    }
    visited.add(key);

    const entry = manifest[key];
    if (!entry) {
      return;
    }

    if (entry.file) {
      js.add(`/${entry.file}`);
    }

    entry.css?.forEach((href) => css.add(`/${href}`));
    entry.assets?.forEach((href) => preload.add(`/${href}`));

    entry.imports?.forEach((importKey) => {
      const imported = manifest[importKey];
      if (imported?.file) {
        preload.add(`/${imported.file}`);
      }
      traverse(importKey);
    });
  };

  traverse(clientEntry);

  return {
    js: Array.from(js),
    css: Array.from(css),
    preload: Array.from(preload)
  };
};

interface RenderModule {
  render: (url: string, initialState: AppInitialState) => Promise<{
    appHtml: string;
    head?: string;
  }>;
}

export const createSsrMiddleware = async (
  config: AppConfig,
  deps: AppDependencies
): Promise<RequestHandler> => {
  let vite: ViteDevServer | null = null;
  let manifest: Manifest | null = null;
  let assets = { js: ['/src/entries/client.tsx'], css: [] as string[], preload: [] as string[] };
  let serverModule: RenderModule | null = null;

  if (config.env === 'development') {
    vite = await createViteServer({
      server: {
        middlewareMode: true
      },
      appType: 'custom'
    });
    assets = {
      js: ['/@vite/client', '/src/entries/client.tsx'],
      css: [],
      preload: []
    };
  } else {
    manifest = await loadManifest();
    if (manifest) {
      assets = gatherAssets(manifest);
    }
  }

  const renderApp = async (url: string, initialState: AppInitialState) => {
    if (vite) {
      const mod = (await vite.ssrLoadModule('/src/entries/server.tsx')) as RenderModule;
      return mod.render(url, initialState);
    }

    if (!serverModule) {
      const entryPath = path.resolve(process.cwd(), 'dist/ssr/entry-server.js');
      serverModule = (await import(entryPath)) as RenderModule;
    }

    return serverModule.render(url, initialState);
  };

  const middleware: RequestHandler = async (req, res, next) => {
    if (req.originalUrl.startsWith('/assets')) {
      next();
      return;
    }

    try {
      const { state, status } = await resolveInitialState(req, deps);
      const { appHtml, head } = await renderApp(req.originalUrl, state);
      const html = renderDocument({
        appHtml,
        initialState: state,
        assets,
        head
      });

      if (vite) {
        const transformed = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(status).setHeader('Content-Type', 'text/html').send(transformed);
        return;
      }

      res.status(status).setHeader('Content-Type', 'text/html').send(html);
    } catch (error) {
      if (vite) {
        vite.ssrFixStacktrace(error as Error);
      }
      next(error);
    }
  };

  if (vite) {
    return (req, res, next) => {
      vite!.middlewares(req, res, (viteErr) => {
        if (viteErr) {
          next(viteErr);
          return;
        }
        middleware(req, res, next);
      });
    };
  }

  return middleware;
};
