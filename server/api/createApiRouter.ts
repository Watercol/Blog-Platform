import { Router } from 'express';
import type { AppDependencies } from '../config/context';
import { createArticlesRouter } from './createArticlesRouter';
import { notFoundHandler } from '../errorMiddleware/notFound';
import { errorHandler } from '../errorMiddleware/errorHandler';

export const createApiRouter = (deps: AppDependencies) => {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  router.use('/articles', createArticlesRouter(deps));

  router.use(notFoundHandler);
  router.use(errorHandler);

  return router;
};
