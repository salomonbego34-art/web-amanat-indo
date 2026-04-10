import { db } from "./db";
import { sqlite } from "./db";
const sqlClient = sqlite as any;
import {
  articles,
  upvotes,
  comments,
  notifications,
  directMessages,
  reports,
  type Article,
  type InsertArticle,
  type ArticleResponse,
  type CommentResponse,
  type NotificationResponse,
  type DirectMessageResponse,
} from "@shared/schema";
import { eq, desc, and, or, asc, sql } from "drizzle-orm";
import type { User } from "@shared/models/auth";

export interface IStorage {
  getArticles(currentUserId?: string): Promise<ArticleResponse[]>;
  createArticle(article: InsertArticle & { authorId: string }): Promise<Article>;
  getArticle(id: number): Promise<Article | undefined>;
  updateArticle(id: number, updates: Partial<InsertArticle>): Promise<Article | undefined>;
  toggleUpvote(articleId: number, userId: string): Promise<{ upvoted: boolean, upvoteCount: number }>;
  getComments(articleId: number): Promise<CommentResponse[]>;
  createComment(articleId: number, userId: string, content: string, parentId?: number | null): Promise<CommentResponse>;
  getComment(id: number): Promise<any | undefined>;
  updateComment(commentId: number, userId: string, content: string): Promise<CommentResponse | undefined>;
  deleteComment(commentId: number, userId: string): Promise<boolean>;
  createNotification(input: { userId: string; actorId: string; articleId?: number; type: string; message: string }): Promise<void>;
  getNotifications(userId: string): Promise<NotificationResponse[]>;
  markNotificationsRead(userId: string): Promise<void>;
  getConversation(userId: string, peerId: string): Promise<DirectMessageResponse[]>;
  sendMessage(senderId: string, receiverId: string, content: string): Promise<DirectMessageResponse>;
}

export class DatabaseStorage implements IStorage {
  private findCommentInTree(comments: CommentResponse[], targetId: number): CommentResponse | undefined {
    for (const comment of comments) {
      if (comment.id === targetId) return comment;
      if (comment.replies?.length) {
        const nested = this.findCommentInTree(comment.replies, targetId);
        if (nested) return nested;
      }
    }
    return undefined;
  }

  private calculateRank(user: { role?: string | null; firstName?: string | null; totalPost?: number; totalUpvote?: number }) {
    if (user.role === "admin") return "S++";
    const score = (Number(user.totalPost ?? 0) * 5) + Number(user.totalUpvote ?? 0);
    if (score <= 20) return "C";
    if (score <= 50) return "B";
    if (score <= 100) return "A";
    return "S";
  }

  async getArticles(currentUserId?: string): Promise<ArticleResponse[]> {
    const allArticles = (await db.query.articles.findMany({
      with: {
        author: true,
        upvotes: true,
      },
      orderBy: [desc(articles.createdAt)],
    })) as any[];

    return allArticles.map(a => {
      const upvotesList = Array.isArray(a.upvotes) ? a.upvotes : [];
      const authorRecord = Array.isArray(a.author) ? a.author[0] : a.author;
      const upvoteCount = upvotesList.length;
      const hasUpvoted = currentUserId
        ? upvotesList.some((u: any) => u.userId === currentUserId)
        : false;

      return {
        ...a,
        author: {
          id: authorRecord?.id ?? "",
          username: authorRecord?.username ?? "",
          firstName: authorRecord?.firstName ?? null,
          lastName: authorRecord?.lastName ?? null,
          email: authorRecord?.email ?? null,
          rank: this.calculateRank({
            role: authorRecord?.role,
            firstName: authorRecord?.firstName,
            totalPost: authorRecord?.totalPost,
            totalUpvote: authorRecord?.totalUpvote,
          }),
          role: authorRecord?.role ?? null,
        },
        upvoteCount,
        hasUpvoted,
      };
    });
  }

  async createArticle(article: InsertArticle & { authorId: string }): Promise<Article> {
    const [newArticle] = await db.insert(articles).values(article).returning();
    return newArticle;
  }

  async getArticle(id: number): Promise<Article | undefined> {
    const [article] = await db.select().from(articles).where(eq(articles.id, id));
    return article;
  }

  async updateArticle(id: number, updates: Partial<InsertArticle>): Promise<Article | undefined> {
    const existing = await this.getArticle(id);
    if (!existing) return undefined;
    const [updated] = await db.update(articles).set(updates).where(eq(articles.id, id)).returning();
    return updated;
  }

  async deleteArticle(id: number): Promise<boolean> {
    await db.delete(upvotes).where(eq(upvotes.articleId, id));
    await db.delete(comments).where(eq(comments.articleId, id));
    await db.delete(notifications).where(eq(notifications.articleId, id));
    await db.delete(articles).where(eq(articles.id, id));
    return true;
  }

  async toggleUpvote(articleId: number, userId: string): Promise<{ upvoted: boolean, upvoteCount: number }> {
    const [article] = await db.select().from(articles).where(eq(articles.id, articleId));
    if (!article) throw new Error("Article not found");

    const existing = await db.select().from(upvotes).where(and(eq(upvotes.articleId, articleId), eq(upvotes.userId, userId)));
    let upvoted = false;
    
    if (existing.length > 0) {
      await db.delete(upvotes).where(and(eq(upvotes.articleId, articleId), eq(upvotes.userId, userId)));
      upvoted = false;
      // Decrement total_upvote for author
      sqlClient.prepare("UPDATE users SET total_upvote = MAX(0, total_upvote - 1) WHERE id = ?").run(article.authorId);
    } else {
      await db.insert(upvotes).values({ articleId, userId });
      upvoted = true;
      // Increment total_upvote for author
      sqlClient.prepare("UPDATE users SET total_upvote = total_upvote + 1 WHERE id = ?").run(article.authorId);
    }
    const currentUpvotes = await db.select().from(upvotes).where(eq(upvotes.articleId, articleId));
    return { upvoted, upvoteCount: currentUpvotes.length };
  }

  async getComments(articleId: number): Promise<CommentResponse[]> {
    const rows = (await db.query.comments.findMany({
      where: eq(comments.articleId, articleId),
      with: {
        user: true,
      },
      orderBy: [asc(comments.createdAt)],
    })) as any[];

    const mapped = rows.map((row) => ({
      id: row.id,
      articleId: row.articleId,
      userId: row.userId,
      content: row.content,
      parentId: row.parentId ?? null,
      createdAt: row.createdAt,
      user: {
        id: row.user?.id ?? "",
        username: row.user?.username ?? "",
        firstName: row.user?.firstName ?? null,
        lastName: row.user?.lastName ?? null,
        rank: this.calculateRank({
          role: row.user?.role,
          totalPost: row.user?.totalPost,
          totalUpvote: row.user?.totalUpvote,
        }),
      },
      replies: [],
    })) as CommentResponse[];

    const byId = new Map<number, CommentResponse>();
    for (const comment of mapped) {
      byId.set(comment.id, comment);
    }

    const rootComments: CommentResponse[] = [];
    for (const comment of mapped) {
      if (comment.parentId && byId.has(comment.parentId)) {
        byId.get(comment.parentId)!.replies!.push(comment);
      } else {
        rootComments.push(comment);
      }
    }

    return rootComments;
  }

  async createComment(articleId: number, userId: string, content: string, parentId?: number | null): Promise<CommentResponse> {
    const [created] = await db
      .insert(comments)
      .values({ articleId, userId, content, parentId: parentId ?? null })
      .returning();

    const all = await this.getComments(articleId);
    const found = this.findCommentInTree(all, created.id);
    if (!found) {
      throw new Error("Failed to create comment");
    }

    return found;
  }

  async getComment(id: number): Promise<any | undefined> {
    const [row] = await db.select().from(comments).where(eq(comments.id, id));
    return row;
  }

  async updateComment(commentId: number, userId: string, content: string): Promise<CommentResponse | undefined> {
    const [existing] = await db.select().from(comments).where(eq(comments.id, commentId));
    if (!existing) return undefined;
    if (existing.userId !== userId) {
      throw new Error("Forbidden");
    }

    const [updated] = await db
      .update(comments)
      .set({ content })
      .where(eq(comments.id, commentId))
      .returning();

    const all = await this.getComments(updated.articleId);
    return all.find((c) => c.id === updated.id);
  }

  async deleteComment(commentId: number, userId: string): Promise<boolean> {
    const [existing] = await db.select().from(comments).where(eq(comments.id, commentId));
    if (!existing) return false;
    if (existing.userId !== userId) {
      throw new Error("Forbidden");
    }
    await db.delete(comments).where(eq(comments.id, commentId));
    return true;
  }

  async createNotification(input: { userId: string; actorId: string; articleId?: number; type: string; message: string }): Promise<void> {
    await db.insert(notifications).values({
      userId: input.userId,
      actorId: input.actorId,
      articleId: input.articleId ?? null,
      type: input.type,
      message: input.message,
      isRead: false,
    });
  }

  async getNotifications(userId: string): Promise<NotificationResponse[]> {
    const rows = (await db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      with: { actor: true },
      orderBy: [desc(notifications.createdAt)],
    })) as any[];

    return rows.map((n) => ({
      id: n.id,
      userId: n.userId,
      actorId: n.actorId,
      articleId: n.articleId,
      type: n.type,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt,
      actor: {
        id: n.actor?.id ?? "",
        username: n.actor?.username ?? "",
        firstName: n.actor?.firstName ?? null,
        lastName: n.actor?.lastName ?? null,
      },
    }));
  }

  async markNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
  }

  async getConversation(userId: string, peerId: string): Promise<DirectMessageResponse[]> {
    const rows = (await db.query.directMessages.findMany({
      where: or(
        and(eq(directMessages.senderId, userId), eq(directMessages.receiverId, peerId)),
        and(eq(directMessages.senderId, peerId), eq(directMessages.receiverId, userId)),
      ),
      with: { sender: true, receiver: true },
      orderBy: [asc(directMessages.createdAt)],
    })) as any[];

    return rows.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      receiverId: m.receiverId,
      content: m.content,
      createdAt: m.createdAt,
      sender: {
        id: m.sender?.id ?? "",
        username: m.sender?.username ?? "",
        firstName: m.sender?.firstName ?? null,
        lastName: m.sender?.lastName ?? null,
      },
      receiver: {
        id: m.receiver?.id ?? "",
        username: m.receiver?.username ?? "",
        firstName: m.receiver?.firstName ?? null,
        lastName: m.receiver?.lastName ?? null,
      },
    }));
  }

  async getCommentsByUser(userId: string): Promise<CommentResponse[]> {
    const rows = (await db.query.comments.findMany({
      where: eq(comments.userId, userId),
      with: { user: true, article: true },
      orderBy: [desc(comments.createdAt)],
    })) as any[];

    return rows.map((c) => ({
      id: c.id,
      userId: c.userId,
      articleId: c.articleId,
      content: c.content,
      parentId: c.parentId,
      createdAt: c.createdAt,
      user: {
        id: c.user?.id ?? "",
        username: c.user?.username ?? "",
        firstName: c.user?.firstName ?? null,
        lastName: c.user?.lastName ?? null,
      },
    }));
  }

  async getArticlesByAuthor(authorId: string): Promise<any[]> {
    const allArticles = await db.query.articles.findMany({
      where: eq(articles.authorId, authorId),
      with: {
        author: true,
        upvotes: true,
      },
      orderBy: [desc(articles.createdAt)],
    }) as any[];

    return allArticles.map(a => {
      const upvotesList = Array.isArray(a.upvotes) ? a.upvotes : [];
      const authorRecord = Array.isArray(a.author) ? a.author[0] : a.author;
      const upvoteCount = upvotesList.length;

      return {
        ...a,
        author: {
          id: authorRecord?.id ?? "",
          username: authorRecord?.username ?? "",
        },
        upvoteCount,
      };
    });
  }

  async getUserStats(authorId: string): Promise<{ totalPosts: number; totalUpvotes: number }> {
    const result = await db.select({
      totalPosts: sql<number>`count(*)`.mapWith(Number),
      totalUpvotes: sql<number>`coalesce((select count(*) from upvotes where article_id in (select id from ${articles} where author_id = ${eq(articles.authorId, sql.placeholder('authorId'))})), 0)`.mapWith(Number),
    }).from(articles).where(eq(articles.authorId, authorId)).all();

    return {
      totalPosts: result[0]?.totalPosts ?? 0,
      totalUpvotes: result[0]?.totalUpvotes ?? 0,
    };
  }

  async sendMessage(senderId: string, receiverId: string, content: string): Promise<DirectMessageResponse> {
    const [created] = await db.insert(directMessages).values({ senderId, receiverId, content }).returning();
    const legacySenderId = Number(senderId);
    const legacyReceiverId = Number(receiverId);
    if (Number.isFinite(legacySenderId) && Number.isFinite(legacyReceiverId)) {
      sqlClient
        .prepare(
          `INSERT OR IGNORE INTO messages (id, sender_id, receiver_id, message, created_at)
           VALUES (?, ?, ?, ?, datetime('now'))`,
        )
        .run(created.id, legacySenderId, legacyReceiverId, content);
    }
    const all = await this.getConversation(senderId, receiverId);
    const found = all.find((m) => m.id === created.id);
    if (!found) throw new Error("Failed to send message");
    return found;
  }

  // Admin operations
  async deleteCommentByModerator(commentId: number): Promise<boolean> {
    const result = await db.delete(comments).where(eq(comments.id, commentId));
    return true;
  }

  async createReport(data: { reporterId: string; targetId: number; targetType: string; reason: string; description?: string }): Promise<any> {
    const [report] = await db.insert(reports).values({
      reporterId: data.reporterId,
      targetId: data.targetId,
      targetType: data.targetType,
      reason: data.reason,
      description: data.description,
    }).returning();
    return report;
  }

  async getReports(status?: string): Promise<any[]> {
    if (status) {
      return await db.select().from(reports).where(eq(reports.status, status));
    }
    return await db.select().from(reports);
  }

  async resolveReport(reportId: number, resolvedBy: string, status: string): Promise<void> {
    const [report] = await db.select().from(reports).where(eq(reports.id, reportId));
    if (!report) return;

    await db.update(reports)
      .set({
        status,
        resolvedBy,
        resolvedAt: sql`(unixepoch() * 1000)`,
      })
      .where(eq(reports.id, reportId));

    await this.createNotification({
      userId: report.reporterId,
      actorId: resolvedBy,
      type: "report_resolved",
      message: `Laporan kamu tentang ${report.targetType} telah ${status === 'resolved' ? 'diselesaikan' : 'ditutup'}.`,
    });
  }
}

export const storage = new DatabaseStorage();
