import compression from 'compression';
import express from 'express';
import morgan from 'morgan';
import path from 'node:path';
import type { AppConfig } from './config/env';
import type { AppDependencies } from './config/context';
import { createApiRouter } from './api';
import { createSsrMiddleware } from './ssr/middleware';
import { errorHandler } from './middleware/errorHandler';

export const createApp = async (config: AppConfig, deps: AppDependencies) => {
  const app = express();

  app.disable('x-powered-by');
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));

  if (config.env === 'production') {
    const clientDir = path.resolve(process.cwd(), 'dist/client');
    app.use(
      '/assets',
      express.static(path.join(clientDir, 'assets'), {
        immutable: true,
        maxAge: '1y'
      })
    );
    app.use(express.static(clientDir, { index: false }));
  }

  app.use('/api', createApiRouter(deps));

  const ssrMiddleware = await createSsrMiddleware(config, deps);
  app.use(ssrMiddleware);

  app.use(errorHandler);

  return app;
};
