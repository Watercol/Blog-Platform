import { Router } from 'express';
import type { AppDependencies } from '../config/context';
import { createArticlesController } from './controllers/articlesController';

export const createArticlesRouter = (deps: AppDependencies) => {
  const router = Router();
  const controller = createArticlesController(deps);

  router.get('/', controller.list);
  router.get('/tags', controller.listTags);
  router.get('/slug/:slug', controller.detailBySlug);
  router.get('/:id', controller.detail);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);
  router.delete('/', controller.remove);

  return router;
};
