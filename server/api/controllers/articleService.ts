import type { Pool } from 'mysql2/promise';
import { slugify } from '../utils/slug';
import {
  createArticle as createArticleRecord,
  updateArticle as updateArticleRecord,
  deleteArticles as deleteArticleRecords,
  findArticleById,
  findArticles as findArticleRecords,
  findArticleBySlug,
  findAllTags,
  isSlugTaken,
  recordView
} from '../repositories/articleRepository';
import { findOrCreateUser } from '../repositories/userRepository';
import type {
  ArticleDetail,
  ArticleMutationPayload,
  ArticleSummary,
  PaginatedArticles,
  Tag
} from '@shared/types';
import type { ArticleListFilters } from '../repositories/articleRepository';
import type { RedisCache } from '../../cache/redisCache';

const WORDS_PER_MINUTE = 220;

const estimateReadingMinutes = (content: string): number => {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
};

const ensureSlugUniqueness = async (
  pool: Pool,
  desiredSlug: string,
  excludeId?: number
): Promise<string> => {
  let slug = desiredSlug;
  let suffix = 1;

  // Attempt to find an available slug by adding numeric suffixes when needed.
  while (await isSlugTaken(pool, slug, excludeId)) {
    slug = `${desiredSlug}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

const normalizePublishedAt = (status: string, publishedAt?: string | null): string | null => {
  if (status === 'published') {
    return publishedAt ?? new Date().toISOString().slice(0, 19).replace('T', ' ');
  }

  return publishedAt ?? null;
};

export const listArticles = async (
  pool: Pool,
  filters: ArticleListFilters,
  cache?: RedisCache
): Promise<PaginatedArticles> => {
  // 如果有缓存实例，尝试从缓存获取数据
  if (cache) {
    const cachedData = await cache.getArticles({
      page: filters.page,
      pageSize: filters.pageSize,
      tag: filters.tag,
      search: filters.search,
      sort: filters.sort,
      order: filters.order
    });

    if (cachedData) {
      console.log(`从缓存获取文章列表: page=${filters.page}, search=${filters.search}`);
      return cachedData;
    }
  }

  // 从数据库获取数据
  const data = await findArticleRecords(pool, filters);

  // 如果有缓存实例，将数据存入缓存
  if (cache) {
    await cache.setArticles(
      {
        page: filters.page,
        pageSize: filters.pageSize,
        tag: filters.tag,
        search: filters.search,
        sort: filters.sort,
        order: filters.order
      },
      data,
      { ttl: filters.search ? 60 : 300 } // 搜索结果的缓存时间较短（1分钟），普通列表较长（5分钟）
    );
    console.log(`文章列表已缓存: page=${filters.page}, search=${filters.search}`);
  }

  return data;
};

export const getArticleDetail = async (
  pool: Pool,
  idOrSlug: number | string,
  options: { recordView?: boolean } = {}
): Promise<ArticleDetail | null> => {
  const detail =
    typeof idOrSlug === 'number'
      ? await findArticleById(pool, idOrSlug)
      : await findArticleBySlug(pool, idOrSlug);

  if (!detail) {
    return null;
  }

  if (options.recordView) {
    await recordView(pool, detail.id);
    detail.viewCount += 1;
  }

  return detail;
};

export const createArticle = async (
  pool: Pool,
  payload: ArticleMutationPayload,
  cache?: RedisCache
): Promise<{ id: number; slug: string }> => {
  const slugBase = payload.slug ? payload.slug : slugify(payload.title);
  const slug = await ensureSlugUniqueness(pool, slugBase);

  let authorId = payload.authorId;
  if (!authorId && payload.authorName && payload.authorEmail) {
    authorId = await findOrCreateUser(pool, payload.authorName, payload.authorEmail);
  }

  if (!authorId) {
    throw new Error('Author information is missing');
  }

  const id = await createArticleRecord(pool, {
    title: payload.title,
    slug,
    excerpt: payload.excerpt ?? null,
    content: payload.content,
    status: payload.status,
    publishedAt: normalizePublishedAt(payload.status, payload.publishedAt),
    authorId,
    readingMinutes: estimateReadingMinutes(payload.content),
    tags: payload.tags
  });

  // 清除文章相关的缓存
  if (cache) {
    await cache.invalidateArticleCaches();
    console.log('文章创建后清除缓存');
  }

  return { id, slug };
};

export const updateArticle = async (
  pool: Pool,
  id: number,
  payload: ArticleMutationPayload,
  cache?: RedisCache
): Promise<{ slug: string }> => {
  const slugBase = payload.slug ? payload.slug : slugify(payload.title);
  const slug = await ensureSlugUniqueness(pool, slugBase, id);

  let authorId = payload.authorId;
  if (!authorId && payload.authorName && payload.authorEmail) {
    authorId = await findOrCreateUser(pool, payload.authorName, payload.authorEmail);
  }

  if (!authorId) {
    throw new Error('Author information is missing');
  }

  await updateArticleRecord(pool, id, {
    title: payload.title,
    slug,
    excerpt: payload.excerpt ?? null,
    content: payload.content,
    status: payload.status,
    publishedAt: normalizePublishedAt(payload.status, payload.publishedAt),
    authorId,
    readingMinutes: estimateReadingMinutes(payload.content),
    tags: payload.tags
  });

  // 清除文章相关的缓存
  if (cache) {
    await cache.invalidateArticleCaches();
    console.log('文章更新后清除缓存');
  }

  return { slug };
};

export const deleteArticles = async (
  pool: Pool,
  ids: number[],
  options: { hardDelete?: boolean } = {},
  cache?: RedisCache
): Promise<number> => {
  const affected = await deleteArticleRecords(pool, ids, options);

  // 清除文章相关的缓存
  if (cache && affected > 0) {
    await cache.invalidateArticleCaches();
    console.log(`文章删除后清除缓存，影响记录数: ${affected}`);
  }

  return affected;
};

export const toSummaryList = (detail: ArticleDetail): ArticleSummary => ({
  id: detail.id,
  title: detail.title,
  slug: detail.slug,
  excerpt: detail.excerpt,
  author: detail.author,
  publishedAt: detail.publishedAt,
  tags: detail.tags,
  readingMinutes: detail.readingMinutes
});

export const listAllTags = async (pool: Pool): Promise<Tag[]> => {
  return findAllTags(pool);
};