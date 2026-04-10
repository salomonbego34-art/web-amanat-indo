import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export shared auth models
export * from "./models/auth";
import { users } from "./models/auth";

// === TABLE DEFINITIONS ===
export const articles = sqliteTable("articles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  content: text("caption"), 
  location: text("location_text"), 
  latitude: integer("latitude", { mode: "number" }),
  longitude: integer("longitude", { mode: "number" }),
  attachmentDataUrl: text("attachment_data_url"),
  attachmentName: text("attachment_name"),
  attachmentMime: text("attachment_mime"),
  imageUrls: text("image_urls").default("[]"), 
  hashtags: text("hashtags"), 
  authorId: text("author_id").notNull().references(() => users.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});


export const upvotes = sqliteTable("upvotes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  articleId: integer("article_id").notNull().references(() => articles.id),
  userId: text("user_id").notNull().references(() => users.id),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  articleId: integer("article_id").notNull().references(() => articles.id),
  userId: text("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  parentId: integer("parent_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().references(() => users.id),
  actorId: text("actor_id").notNull().references(() => users.id),
  articleId: integer("article_id").references(() => articles.id),
  type: text("type").notNull(), // like | comment
  message: text("message").notNull(),
  isRead: integer("is_read", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const directMessages = sqliteTable("direct_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  senderId: text("sender_id").notNull().references(() => users.id),
  receiverId: text("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reporterId: text("reporter_id").notNull().references(() => users.id),
  targetId: integer("target_id").notNull(), // article or comment id
  targetType: text("target_type").notNull(), // "article" or "comment"
  reason: text("reason").notNull(),
  description: text("description"),
  status: text("status").notNull().default("pending"), // pending | reviewed | resolved | dismissed
  resolvedBy: text("resolved_by").references(() => users.id),
  resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(unixepoch() * 1000)`),
});

// === RELATIONS ===
export const articlesRelations = relations(articles, ({ one, many }) => ({
  author: one(users, {
    fields: [articles.authorId],
    references: [users.id],
  }),
  upvotes: many(upvotes),
}));

export const upvotesRelations = relations(upvotes, ({ one }) => ({
  article: one(articles, {
    fields: [upvotes.articleId],
    references: [articles.id],
  }),
  user: one(users, {
    fields: [upvotes.userId],
    references: [users.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  article: one(articles, {
    fields: [comments.articleId],
    references: [articles.id],
  }),
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  actor: one(users, {
    fields: [notifications.actorId],
    references: [users.id],
  }),
  article: one(articles, {
    fields: [notifications.articleId],
    references: [articles.id],
  }),
}));

export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  sender: one(users, {
    fields: [directMessages.senderId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [directMessages.receiverId],
    references: [users.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  reporter: one(users, {
    fields: [reports.reporterId],
    references: [users.id],
  }),
  resolver: one(users, {
    fields: [reports.resolvedBy],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertArticleSchema = createInsertSchema(articles).omit({ id: true, createdAt: true, authorId: true });
export const insertUpvoteSchema = createInsertSchema(upvotes).omit({ id: true, userId: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, userId: true, createdAt: true });
export const insertDirectMessageSchema = createInsertSchema(directMessages).omit({ id: true, senderId: true, createdAt: true });

// === EXPLICIT API CONTRACT TYPES ===
export type Article = typeof articles.$inferSelect;
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Upvote = typeof upvotes.$inferSelect;
export type InsertUpvote = z.infer<typeof insertUpvoteSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Notification = typeof notifications.$inferSelect;
export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;

export type CreateArticleRequest = InsertArticle;
export type UpvoteRequest = { articleId: number };

export type ArticleResponse = Article & {
  author: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    rank: string;
    role?: string | null;
  };
  upvoteCount: number;
  hasUpvoted: boolean;
};

export type ArticlesListResponse = ArticleResponse[];

export type CommentResponse = Comment & {
  user: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
    rank?: string;
  };
  replies?: CommentResponse[];
};

export type NotificationResponse = Notification & {
  actor: { id: string; username: string; firstName: string | null; lastName: string | null };
};

export type DirectMessageResponse = DirectMessage & {
  sender: { id: string; username: string; firstName: string | null; lastName: string | null };
  receiver: { id: string; username: string; firstName: string | null; lastName: string | null };
};
