import { z } from 'zod';
import { insertArticleSchema, insertCommentSchema } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  articles: {
    list: {
      method: 'GET' as const,
      path: '/api/articles' as const,
      responses: {
        200: z.array(z.any()), // Array of ArticleResponse
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/articles' as const,
      input: insertArticleSchema,
      responses: {
        201: z.any(), // ArticleResponse
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    upvote: {
      method: 'POST' as const,
      path: '/api/articles/:id/upvote' as const,
      responses: {
        200: z.object({
          upvoted: z.boolean(),
          upvoteCount: z.number(),
        }),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/articles/:id' as const,
      input: insertArticleSchema.partial(),
      responses: {
        200: z.any(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    remove: {
      method: 'DELETE' as const,
      path: '/api/articles/:id' as const,
      responses: {
        204: z.null(),
        401: errorSchemas.unauthorized,
        404: errorSchemas.notFound,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/articles/:id' as const,
      responses: {
        200: z.any(),
        404: errorSchemas.notFound,
      },
    },
    comments: {
      list: {
        method: "GET" as const,
        path: "/api/articles/:id/comments" as const,
        responses: {
          200: z.array(z.any()),
        },
      },
      create: {
        method: "POST" as const,
        path: "/api/articles/:id/comments" as const,
        input: insertCommentSchema.pick({ content: true, parentId: true }).extend({
          parentId: z.number().nullable().optional(),
        }),
        responses: {
          201: z.any(),
          401: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
      update: {
        method: "PUT" as const,
        path: "/api/articles/:id/comments/:commentId" as const,
        input: insertCommentSchema.pick({ content: true }),
        responses: {
          200: z.any(),
          401: errorSchemas.unauthorized,
          403: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
      remove: {
        method: "DELETE" as const,
        path: "/api/articles/:id/comments/:commentId" as const,
        responses: {
          200: z.object({ ok: z.boolean() }),
          401: errorSchemas.unauthorized,
          403: errorSchemas.unauthorized,
          404: errorSchemas.notFound,
        },
      },
    },
    notifications: {
      list: {
        method: "GET" as const,
        path: "/api/notifications" as const,
        responses: { 200: z.array(z.any()) },
      },
      readAll: {
        method: "POST" as const,
        path: "/api/notifications/read-all" as const,
        responses: { 200: z.object({ ok: z.boolean() }) },
      },
    },
    messages: {
      listUsers: {
        method: "GET" as const,
        path: "/api/messages/users" as const,
        responses: { 200: z.array(z.any()) },
      },
      conversation: {
        method: "GET" as const,
        path: "/api/messages/:userId" as const,
        responses: { 200: z.array(z.any()) },
      },
      send: {
        method: "POST" as const,
        path: "/api/messages/:userId" as const,
        input: z.object({ content: z.string().min(1).max(2000) }),
        responses: { 201: z.any(), 401: errorSchemas.unauthorized },
      },
    },
  },
};

// ============================================
// REQUIRED: buildUrl helper
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type ArticleInput = z.infer<typeof api.articles.create.input>;
export type ValidationError = z.infer<typeof errorSchemas.validation>;
export type NotFoundError = z.infer<typeof errorSchemas.notFound>;
export type UnauthorizedError = z.infer<typeof errorSchemas.unauthorized>;
