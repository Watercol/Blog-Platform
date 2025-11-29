import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import type { AppDependencies } from '../../config/context';
import {
  articleIdParamSchema,
  articleMutationSchema,
  bulkDeleteSchema,
  listArticlesQuerySchema
} from '../validators/articleSchemas';
import {
  createArticle,
  deleteArticles,
  getArticleDetail,
  listArticles,
  updateArticle
} from '../../services/articleService';

const hardDeleteSchema = z
  .object({
    hard: z.string().optional()
  })
  .transform((value) => value.hard === 'true');

const slugParamSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/)
});

export const createArticlesController = (deps: AppDependencies) => {
  const list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = listArticlesQuerySchema.parse(req.query);
      const data = await listArticles(deps.pool, query);
      res.json(data);
    } catch (error) {
      next(error);
    }
  };

  const detail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = articleIdParamSchema.parse(req.params);
      const article = await getArticleDetail(deps.pool, id);

      if (!article) {
        res.status(404).json({ message: 'Article not found' });
        return;
      }

      res.json(article);
    } catch (error) {
      next(error);
    }
  };

  const detailBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { slug } = slugParamSchema.parse(req.params);
      const article = await getArticleDetail(deps.pool, slug);

      if (!article) {
        res.status(404).json({ message: 'Article not found' });
        return;
      }

      res.json(article);
    } catch (error) {
      next(error);
    }
  };

  const create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const payload = articleMutationSchema.parse(req.body);
      const result = await createArticle(deps.pool, payload);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  const update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = articleIdParamSchema.parse(req.params);
      const payload = articleMutationSchema.parse(req.body);
      const result = await updateArticle(deps.pool, id, payload);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  const remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.params.id) {
        const { id } = articleIdParamSchema.parse(req.params);
        const hard = hardDeleteSchema.parse(req.query);
        const affected = await deleteArticles(deps.pool, [id], { hardDelete: hard });
        res.json({ affected });
        return;
      }

      if (req.query.ids) {
        const idsParam = Array.isArray(req.query.ids) ? req.query.ids.join(',') : req.query.ids;
        const { ids } = bulkDeleteSchema.parse({ ids: idsParam });
        const hard = hardDeleteSchema.parse(req.query);
        const affected = await deleteArticles(deps.pool, ids, { hardDelete: hard });
        res.json({ affected });
        return;
      }

      res.status(400).json({ message: 'Provide an id path param or ids query parameter' });
    } catch (error) {
      next(error);
    }
  };

  return {
    list,
    detail,
    detailBySlug,
    create,
    update,
    remove
  };
};
