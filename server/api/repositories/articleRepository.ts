import type { Pool, PoolConnection, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import type { ArticleStatus, Tag, ArticleDetail, ArticleSummary, PaginatedArticles } from '@shared/types';
import { slugify } from '../utils/slug';

export interface ArticleListFilters {
  page: number;
  pageSize: number;
  sort: 'publishedAt' | 'createdAt';
  order: 'asc' | 'desc';
  tag?: string;
  status?: ArticleStatus;
  search?: string;
}

interface ArticleRow extends RowDataPacket {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: ArticleStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  view_count: number;
  reading_minutes: number;
  author_name: string;
  tags: string | null;
}

const ARTICLE_SELECT = `
  SELECT
    a.id,
    a.title,
    a.slug,
    a.excerpt,
    a.content,
    a.status,
    a.published_at,
    a.created_at,
    a.updated_at,
    a.view_count,
    a.reading_minutes,
    u.display_name AS author_name,
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'id', t.id,
        'name', t.name,
        'slug', t.slug
      )
    ) AS tags
  FROM articles AS a
  JOIN users AS u ON u.id = a.user_id
  LEFT JOIN article_tags AS at ON at.article_id = a.id
  LEFT JOIN tags AS t ON t.id = at.tag_id
`;

const buildWhereClause = (filters: ArticleListFilters) => {
  const clauses: string[] = ['a.is_deleted = 0'];
  const params: Record<string, unknown> = {};

  if (filters.status) {
    clauses.push('a.status = :status');
    params.status = filters.status;
  }

  if (filters.tag) {
    clauses.push(`EXISTS (
      SELECT 1
      FROM article_tags at2
      JOIN tags t2 ON t2.id = at2.tag_id
      WHERE at2.article_id = a.id AND (t2.slug = :tagSlug OR t2.name = :tagName)
    )`);
    params.tagSlug = filters.tag;
    params.tagName = filters.tag;
  }

  if (filters.search) {
    clauses.push('(a.title LIKE :search OR a.content LIKE :search)');
    params.search = `%${filters.search}%`;
  }

  return {
    clause: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params
  };
};

const mapTags = (jsonAggregated: string | null): Tag[] => {
  if (!jsonAggregated) {
    return [];
  }

  try {
    const parsed = JSON.parse(jsonAggregated) as Array<{ id: number; name: string; slug: string }>;
    return parsed.filter(Boolean);
  } catch (error) {
    return [];
  }
};

const buildArticleSummary = (row: ArticleRow): ArticleSummary => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  excerpt: row.excerpt ?? '',
  author: row.author_name,
  publishedAt: row.published_at,
  tags: mapTags(row.tags),
  readingMinutes: row.reading_minutes
});

const buildArticleDetail = (row: ArticleRow): ArticleDetail => ({
  ...buildArticleSummary(row),
  content: row.content,
  updatedAt: row.updated_at,
  status: row.status,
  viewCount: row.view_count
});

export const findArticles = async (
  pool: Pool,
  filters: ArticleListFilters
): Promise<PaginatedArticles> => {
  const offset = (filters.page - 1) * filters.pageSize;
  const orderColumn = filters.sort === 'publishedAt' ? 'a.published_at' : 'a.created_at';
  const orderDirection = filters.order.toUpperCase();
  const { clause, params } = buildWhereClause(filters);

  const [rows] = await pool.query<ArticleRow[]>(
    `${ARTICLE_SELECT}
    ${clause}
    GROUP BY a.id
    ORDER BY ${orderColumn} ${orderDirection}
    LIMIT :limit OFFSET :offset`,
    {
      ...params,
      limit: filters.pageSize,
      offset
    }
  );

  const [[{ total }]] = await pool.query<Array<{ total: number } & RowDataPacket>>(
    `SELECT COUNT(DISTINCT a.id) AS total FROM articles a
     ${clause} `,
    params
  );

  return {
    items: rows.map(buildArticleSummary),
    meta: {
      page: filters.page,
      pageSize: filters.pageSize,
      totalItems: total,
      totalPages: total > 0 ? Math.ceil(total / filters.pageSize) : 0
    }
  };
};

export const findArticleById = async (pool: Pool, id: number): Promise<ArticleDetail | null> => {
  const [rows] = await pool.query<ArticleRow[]>(
    `${ARTICLE_SELECT}
    WHERE a.id = :id AND a.is_deleted = 0
    GROUP BY a.id
    LIMIT 1`,
    { id }
  );

  if (!rows.length) {
    return null;
  }

  return buildArticleDetail(rows[0]);
};

export const findArticleBySlug = async (pool: Pool, slug: string): Promise<ArticleDetail | null> => {
  const [rows] = await pool.query<ArticleRow[]>(
    `${ARTICLE_SELECT}
    WHERE a.slug = :slug AND a.is_deleted = 0
    GROUP BY a.id
    LIMIT 1`,
    { slug }
  );

  if (!rows.length) {
    return null;
  }

  return buildArticleDetail(rows[0]);
};

export const isSlugTaken = async (
  pool: Pool,
  slug: string,
  excludeId?: number
): Promise<boolean> => {
  const [rows] = await pool.query<Array<{ count: number } & RowDataPacket>>(
    `SELECT COUNT(1) AS count FROM articles WHERE slug = :slug AND is_deleted = 0 ${
      excludeId ? 'AND id <> :excludeId' : ''
    }`,
    excludeId ? { slug, excludeId } : { slug }
  );

  return rows[0]?.count > 0;
};

export const findAllTags = async (pool: Pool): Promise<Tag[]> => {
  const [rows] = await pool.query<Array<Tag & RowDataPacket>>(
    'SELECT id, name, slug FROM tags ORDER BY name ASC'
  );

  return rows;
};

const ensureTags = async (connection: PoolConnection, tags: string[]): Promise<Tag[]> => {
  if (!tags.length) {
    return [];
  }

  const values = tags.map((name) => ({
    name,
    slug: slugify(name)
  }));

  const columns = values.map((_, index) => `(:name${index}, :slug${index})`).join(', ');
  const params = values.reduce<Record<string, string>>((acc, value, index) => {
    acc[`name${index}`] = value.name;
    acc[`slug${index}`] = value.slug;
    return acc;
  }, {});

  await connection.query<ResultSetHeader>(
    `INSERT INTO tags (name, slug) VALUES ${columns} ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    params
  );

  const [rows] = await connection.query<Array<Tag & RowDataPacket>>(
    `SELECT id, name, slug FROM tags WHERE slug IN (${values
      .map((_, index) => `:slug${index}`)
      .join(', ')})`,
    params
  );

  return rows;
};

const syncArticleTags = async (
  connection: PoolConnection,
  articleId: number,
  tags: Tag[]
): Promise<void> => {
  const tagIds = tags.map((tag) => tag.id);

  if (!tagIds.length) {
    await connection.query('DELETE FROM article_tags WHERE article_id = :articleId', { articleId });
    return;
  }

  const values = tagIds.map((tagId, index) => `(:articleId, :tagId${index})`).join(', ');
  const params = tagIds.reduce<Record<string, number>>(
    (acc, tagId, index) => {
      acc[`tagId${index}`] = tagId;
      return acc;
    },
    { articleId }
  );

  await connection.query(
    `INSERT INTO article_tags (article_id, tag_id) VALUES ${values}
     ON DUPLICATE KEY UPDATE tag_id = VALUES(tag_id)`,
    params
  );

  await connection.query(
    `DELETE FROM article_tags WHERE article_id = :articleId AND tag_id NOT IN (${tagIds
      .map((_, index) => `:tagId${index}`)
      .join(', ')})`,
    params
  );
};

interface ArticleWritePayload {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  status: ArticleStatus;
  publishedAt: string | null;
  authorId: number;
  readingMinutes: number;
  tags: string[];
}

export const createArticle = async (pool: Pool, payload: ArticleWritePayload): Promise<number> => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO articles
        (title, slug, excerpt, content, status, published_at, user_id, reading_minutes)
       VALUES
        (:title, :slug, :excerpt, :content, :status, :publishedAt, :authorId, :readingMinutes)`,
      {
        title: payload.title,
        slug: payload.slug,
        excerpt: payload.excerpt,
        content: payload.content,
        status: payload.status,
        publishedAt: payload.publishedAt,
        authorId: payload.authorId,
        readingMinutes: payload.readingMinutes
      }
    );

    const articleId = result.insertId;

    const tags = await ensureTags(connection, payload.tags);
    await syncArticleTags(connection, articleId, tags);

    await connection.commit();
    return articleId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const updateArticle = async (
  pool: Pool,
  id: number,
  payload: ArticleWritePayload
): Promise<void> => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.query<ResultSetHeader>(
      `UPDATE articles SET
        title = :title,
        slug = :slug,
        excerpt = :excerpt,
        content = :content,
        status = :status,
        published_at = :publishedAt,
        user_id = :authorId,
        reading_minutes = :readingMinutes
       WHERE id = :id AND is_deleted = 0`,
      {
        ...payload,
        id
      }
    );

    const tags = await ensureTags(connection, payload.tags);
    await syncArticleTags(connection, id, tags);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const deleteArticles = async (
  pool: Pool,
  ids: number[],
  options: { hardDelete?: boolean } = {}
): Promise<number> => {
  if (!ids.length) {
    return 0;
  }

  if (options.hardDelete) {
    const [result] = await pool.query<ResultSetHeader>(
      `DELETE FROM articles WHERE id IN (${ids.map((_, index) => `:id${index}`).join(', ')})`,
      ids.reduce<Record<string, number>>((acc, id, index) => {
        acc[`id${index}`] = id;
        return acc;
      }, {})
    );

    return result.affectedRows;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `UPDATE articles SET is_deleted = 1 WHERE id IN (${ids.map((_, index) => `:id${index}`).join(', ')})`,
    ids.reduce<Record<string, number>>((acc, id, index) => {
      acc[`id${index}`] = id;
      return acc;
    }, {})
  );

  return result.affectedRows;
};

export const recordView = async (pool: Pool, id: number): Promise<void> => {
  await pool.query<ResultSetHeader>(
    'UPDATE articles SET view_count = view_count + 1 WHERE id = :id AND is_deleted = 0',
    { id }
  );
};
