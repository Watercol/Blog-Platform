import { match } from 'path-to-regexp';
import type { IncomingMessage } from 'node:http';
import type { AppDependencies } from '../config/context';
import { listArticles, getArticleDetail } from '../services/articleService';
import { listArticlesQuerySchema } from '../api/validators/articleSchemas';
import type { AppInitialState } from '@shared/types';

const listMatcher = match('/', { decode: decodeURIComponent, end: true });
const createMatcher = match('/articles/new', { decode: decodeURIComponent, end: true });
const detailMatcher = match('/articles/:slug', { decode: decodeURIComponent });

export interface ResolveResult {
  state: AppInitialState;
  status: number;
}

export const resolveInitialState = async (
  req: IncomingMessage,
  deps: AppDependencies
): Promise<ResolveResult> => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const pathname = url.pathname;

  try {
    const listMatch = listMatcher(pathname);
    if (listMatch) {
      const query = listArticlesQuerySchema.parse(Object.fromEntries(url.searchParams));
      const listData = await listArticles(deps.pool, query);

      return {
        state: {
          view: 'list',
          listData
        },
        status: 200
      };
    }

    const createMatch = createMatcher(pathname);
    if (createMatch) {
      return {
        state: {
          view: 'create'
        },
        status: 200
      };
    }

    const detailMatch = detailMatcher(pathname) as import('path-to-regexp').Match<{ slug: string }>;
    if (detailMatch) {
      const slug = detailMatch.params.slug;

      if (typeof slug !== 'string' || !slug.length) {
        return {
          state: {
            view: 'not-found'
          },
          status: 404
        };
      }

      const detail = await getArticleDetail(deps.pool, slug, { recordView: true });

      if (!detail) {
        return {
          state: {
            view: 'not-found'
          },
          status: 404
        };
      }

      return {
        state: {
          view: 'detail',
          detailData: detail
        },
        status: 200
      };
    }

    return {
      state: {
        view: 'not-found'
      },
      status: 404
    };
  } catch (error) {
    return {
      state: {
        view: 'error',
        error: {
          message: error instanceof Error ? error.message : 'Unexpected error'
        }
      },
      status: 500
    };
  }
};
