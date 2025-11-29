export type ArticleStatus = 'draft' | 'published';

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface ArticleSummary {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  publishedAt: string | null;
  tags: Tag[];
  readingMinutes: number;
}

export interface ArticleDetail extends ArticleSummary {
  content: string;
  updatedAt: string;
  status: ArticleStatus;
  viewCount: number;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedArticles {
  items: ArticleSummary[];
  meta: PaginationMeta;
}

export interface ArticleMutationPayload {
  title: string;
  slug?: string;
  excerpt?: string;
  content: string;
  tags: string[];
  status: ArticleStatus;
  publishedAt?: string | null;
  authorId: number;
}

export interface AppInitialState {
  view: 'list' | 'detail' | 'not-found' | 'error';
  listData?: PaginatedArticles;
  detailData?: ArticleDetail;
  error?: {
    message: string;
    statusCode?: number;
  };
}
