import { z } from 'zod';

export const listArticlesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(10),
  sort: z.enum(['publishedAt', 'createdAt']).default('publishedAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
  tag: z.string().optional(),
  status: z.enum(['draft', 'published']).optional(),
  search: z.string().optional()
});

export const articleIdParamSchema = z.object({
  id: z.coerce.number().int().positive()
});

export const articleMutationSchema = z.object({
  title: z.string().min(3).max(180),
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must use kebab-case alphanumeric characters')
    .optional(),
  excerpt: z.string().max(512).optional(),
  content: z.string().min(20),
  tags: z.array(z.string().min(1)).max(20),
  status: z.enum(['draft', 'published']),
  publishedAt: z.string().datetime().nullish(),
  authorId: z.coerce.number().int().positive()
});

export const bulkDeleteSchema = z.object({
  ids: z
    .string()
    .transform((value) =>
      value
        .split(',')
        .map((item) => Number(item.trim()))
        .filter((num) => Number.isInteger(num) && num > 0)
    )
    .refine((arr) => arr.length > 0, {
      message: 'ids must contain at least one valid identifier'
    })
});
