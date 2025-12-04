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
import type {
  ArticleDetail,
  ArticleMutationPayload,
  ArticleSummary,
  PaginatedArticles,
  Tag
} from '@shared/types';
import type { ArticleListFilters } from '../repositories/articleRepository';

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
  filters: ArticleListFilters
): Promise<PaginatedArticles> => {
  return findArticleRecords(pool, filters);
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
  payload: ArticleMutationPayload
): Promise<{ id: number; slug: string }> => {
  const slugBase = payload.slug ? payload.slug : slugify(payload.title);
  const slug = await ensureSlugUniqueness(pool, slugBase);

  const id = await createArticleRecord(pool, {
    title: payload.title,
    slug,
    excerpt: payload.excerpt ?? null,
    content: payload.content,
    status: payload.status,
    publishedAt: normalizePublishedAt(payload.status, payload.publishedAt),
    authorId: payload.authorId,
    readingMinutes: estimateReadingMinutes(payload.content),
    tags: payload.tags
  });

  return { id, slug };
};

export const updateArticle = async (
  pool: Pool,
  id: number,
  payload: ArticleMutationPayload
): Promise<{ slug: string }> => {
  const slugBase = payload.slug ? payload.slug : slugify(payload.title);
  const slug = await ensureSlugUniqueness(pool, slugBase, id);

  await updateArticleRecord(pool, id, {
    title: payload.title,
    slug,
    excerpt: payload.excerpt ?? null,
    content: payload.content,
    status: payload.status,
    publishedAt: normalizePublishedAt(payload.status, payload.publishedAt),
    authorId: payload.authorId,
    readingMinutes: estimateReadingMinutes(payload.content),
    tags: payload.tags
  });

  return { slug };
};

export const deleteArticles = async (
  pool: Pool,
  ids: number[],
  options: { hardDelete?: boolean } = {}
): Promise<number> => {
  return deleteArticleRecords(pool, ids, options);
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
