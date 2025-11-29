import { useCallback } from 'react';
import type { PaginatedArticles, ArticleDetail } from '@shared/types';

const buildQuery = (params: Record<string, unknown>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    query.set(key, String(value));
  });
  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
};

const fetchJson = async <T,>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, init);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || '请求失败');
  }
  return response.json() as Promise<T>;
};

export const useArticlesApi = () => {
  const getArticles = useCallback(
    async (params: { page?: number; pageSize?: number; tag?: string; search?: string }) => {
      const query = buildQuery(params);
      return fetchJson<PaginatedArticles>(`/api/articles${query}`);
    },
    []
  );

  const getArticleBySlug = useCallback(async (slug: string) => {
    return fetchJson<ArticleDetail>(`/api/articles/slug/${slug}`);
  }, []);

  const removeArticles = useCallback(async (ids: number[], hardDelete = false) => {
    const query = buildQuery({ ids: ids.join(','), hard: hardDelete });
    return fetchJson<{ affected: number }>(`/api/articles${query}`, {
      method: 'DELETE'
    });
  }, []);

  return {
    getArticles,
    getArticleBySlug,
    removeArticles
  };
};
