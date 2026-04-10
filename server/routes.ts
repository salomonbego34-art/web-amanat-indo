import type { Express } from "express";
import type { Server } from "http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated, authStorage, requireAdmin, requireSuperAdmin, requireModerator } from "./auth";

const execFileAsync = promisify(execFile);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  // 🔐 AUTO-INIT: Create superadmin if database is empty
  try {
    const existingUsers = await authStorage.getUsers();
    if (existingUsers.length === 0) {
      console.log("⚠️  Database is empty, creating default superadmin...");
      const { hashPassword } = await import("./auth/security");
      const { randomUUID } = await import("node:crypto");
      
      await authStorage.createUser({
        id: randomUUID(),
        name: "Super Admin",
        username: "superadmin",
        password: hashPassword("superadmin"),
        email: null,
        bio: "Administrator account",
        accountStatus: "active",
        role: "superadmin",
        aimsNumber: "ADMIN001",
      });
      
      console.log("✅ Superadmin created!");
      console.log("   📝 Username: superadmin");
      console.log("   🔑 Password: superadmin");
      console.log("   👥 Role: superadmin");
      console.log("⚠️  Change password after first login!");
    }
  } catch (error) {
    console.error("Failed to initialize superadmin:", error);
  }

  const listArticles = async (req: any, res: any) => {
    const userId = req.session?.userId || req.user?.claims?.sub;
    const articles = await storage.getArticles(userId);
    return res.status(200).json(articles);
  };

  const getArticleById = async (req: any, res: any) => {
    const articleId = Number(req.params.id);
    const userId = req.session?.userId || req.user?.claims?.sub;
    try {
      const populated = await storage.getArticles(userId);
      const result = populated.find((a) => a.id === articleId);
      if (!result) return res.status(404).json({ message: "Article not found" });
      return res.status(200).json(result);
    } catch {
      return res.status(500).json({ message: "Failed to fetch article" });
    }
  };

  const createArticle = async (req: any, res: any) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.userId;
      const user = await authStorage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (user.accountStatus !== "active" && user.role !== "admin" && user.role !== "superadmin") {
        return res.status(403).json({ message: "Your account is pending approval by an admin." });
      }

      const input = api.articles.create.input.parse(req.body);
      const article = await storage.createArticle({ ...input, authorId: userId });
      const populated = await storage.getArticles(userId);
      const result = populated.find((a) => a.id === article.id);
      return res.status(201).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  };

  const updateArticleById = async (req: any, res: any) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.userId;
      const user = await authStorage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const articleId = Number(req.params.id);
      const existing = await storage.getArticle(articleId);
      if (!existing) return res.status(404).json({ message: "Article not found" });
      if (existing.authorId !== userId && user.role !== "admin" && user.role !== "superadmin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const input = api.articles.update.input.parse(req.body);
      const updated = await storage.updateArticle(articleId, input);
      if (!updated) {
        return res.status(404).json({ message: "Article not found" });
      }

      const populated = await storage.getArticles(userId);
      const result = populated.find((a) => a.id === articleId);
      return res.status(200).json(result);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  };

  const deleteArticleById = async (req: any, res: any) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.userId;
      const user = await authStorage.getUser(userId);
      if (!user) return res.status(401).json({ message: "Unauthorized" });

      const articleId = Number(req.params.id);
      const existing = await storage.getArticle(articleId);
      if (!existing) return res.status(404).json({ message: "Article not found" });

      if (existing.authorId !== userId && user.role !== "admin" && user.role !== "superadmin") {
        return res.status(403).json({ message: "Unauthorized" });
      }

      await storage.deleteArticle(articleId);
      return res.status(204).end();
    } catch {
      return res.status(500).json({ message: "Failed to delete article" });
    }
  };

  // 2. Application Routes
  app.get("/api/threads", listArticles);
  app.post("/api/threads", isAuthenticated, createArticle);
  app.get("/api/thread/:id", getArticleById);
  app.put("/api/thread/:id", isAuthenticated, updateArticleById);
  app.delete("/api/thread/:id", isAuthenticated, deleteArticleById);

  app.get(api.articles.list.path, listArticles);
  app.get("/api/articles/:id", getArticleById);
  app.post(api.articles.create.path, isAuthenticated, createArticle);
  app.put(api.articles.update.path, isAuthenticated, updateArticleById);
  app.delete(api.articles.remove.path, isAuthenticated, deleteArticleById);

  app.post(api.articles.upvote.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await authStorage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (user.accountStatus !== "active" && user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({ message: "Your account is pending approval by an admin." });
    }
    const articleId = Number(req.params.id);
    const article = await storage.getArticle(articleId);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }
    const result = await storage.toggleUpvote(articleId, userId);
    if (article.authorId !== userId && result.upvoted) {
      await storage.createNotification({
        userId: article.authorId,
        actorId: userId,
        articleId: articleId,
        type: "like",
        message: "menyukai artikel kamu",
      });
    }
    res.status(200).json(result);
  });

  app.get(api.articles.comments.list.path, async (req: any, res) => {
    const articleId = Number(req.params.id);
    const article = await storage.getArticle(articleId);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    const comments = await storage.getComments(articleId);
    res.status(200).json(comments);
  });

  app.post(api.articles.comments.create.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const user = await authStorage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (user.accountStatus !== "active" && user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({ message: "Your account is pending approval by an admin." });
    }

    const articleId = Number(req.params.id);
    const article = await storage.getArticle(articleId);
    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    const parsed = api.articles.comments.create.input.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid input" });
    }

    if (parsed.data.parentId != null) {
      const parentComment = await storage.getComment(parsed.data.parentId);
      if (!parentComment || parentComment.articleId !== articleId) {
        return res.status(400).json({ message: "Parent comment not found" });
      }
    }

    const created = await storage.createComment(articleId, userId, parsed.data.content, parsed.data.parentId ?? null);

    // Notification for article author
    if (article.authorId !== userId) {
      await storage.createNotification({
        userId: article.authorId,
        actorId: userId,
        articleId,
        type: "comment",
        message: "mengomentari artikel kamu",
      });
    }

    // Notification for parent comment author (if it's a reply)
    if (parsed.data.parentId) {
      const parentComment = await storage.getComment(parsed.data.parentId);
      if (parentComment && parentComment.userId !== userId) {
        await storage.createNotification({
          userId: parentComment.userId,
          actorId: userId,
          articleId,
          type: "reply",
          message: "membalas komentar kamu",
        });
      }
    }
    res.status(201).json(created);
  });

  app.put(api.articles.comments.update.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.session?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const articleId = Number(req.params.id);
    const article = await storage.getArticle(articleId);
    if (!article) return res.status(404).json({ message: "Article not found" });

    const commentId = Number(req.params.commentId);
    const parsed = api.articles.comments.update.input.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid input" });

    try {
      const updated = await storage.updateComment(commentId, userId, parsed.data.content);
      if (!updated || updated.articleId !== articleId) {
        return res.status(404).json({ message: "Comment not found" });
      }
      return res.status(200).json(updated);
    } catch (error: any) {
      if (error?.message === "Forbidden") {
        return res.status(403).json({ message: "Forbidden" });
      }
      throw error;
    }
  });

  app.delete(api.articles.comments.remove.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.session?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const articleId = Number(req.params.id);
    const article = await storage.getArticle(articleId);
    if (!article) return res.status(404).json({ message: "Article not found" });

    const commentId = Number(req.params.commentId);
    try {
      const deleted = await storage.deleteComment(commentId, userId);
      if (!deleted) return res.status(404).json({ message: "Comment not found" });
      return res.status(200).json({ ok: true });
    } catch (error: any) {
      if (error?.message === "Forbidden") {
        return res.status(403).json({ message: "Forbidden" });
      }
      throw error;
    }
  });

  app.get(api.articles.notifications.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.session?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const items = await storage.getNotifications(userId);
    res.status(200).json(items);
  });

  app.post(api.articles.notifications.readAll.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.session?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    await storage.markNotificationsRead(userId);
    res.status(200).json({ ok: true });
  });

  app.get(api.articles.messages.listUsers.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.session?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const all = await authStorage.getUsers();
    res.status(200).json(
      all
        .filter((u) => u.id !== userId)
        .map((u) => ({ ...u, password: "" })),
    );
  });

  app.get("/api/users", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.session?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const all = await authStorage.getUsers();
    res.status(200).json(
      all
        .filter((u) => !u.isBanned)
        .map((u) => ({ ...u, password: "" })),
    );
  });

  app.get(api.articles.messages.conversation.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.session?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const peerId = String(req.params.userId);
    const messages = await storage.getConversation(userId, peerId);
    res.status(200).json(messages);
  });

  app.get("/messages/:userId", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.session?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const peerId = String(req.params.userId);
    const messages = await storage.getConversation(userId, peerId);
    res.status(200).json(messages);
  });

  app.post(api.articles.messages.send.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.session?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const peerId = String(req.params.userId);
    const parsed = api.articles.messages.send.input.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
    const msg = await storage.sendMessage(userId, peerId, parsed.data.content);
    res.status(201).json(msg);
  });

  app.post("/api/messages", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.session?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const receiverId = req.body?.receiverId;
    const content = req.body?.content;
    if (!receiverId || !content) return res.status(400).json({ message: "Invalid input" });
    const msg = await storage.sendMessage(String(userId), String(receiverId), String(content));
    res.status(201).json(msg);
  });

  app.post("/messages", isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub || req.session?.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    const receiverId = req.body?.receiverId;
    const content = req.body?.content;
    if (!receiverId || !content) return res.status(400).json({ message: "Invalid input" });
    const msg = await storage.sendMessage(String(userId), String(receiverId), String(content));
    res.status(201).json(msg);
  });

  app.post("/api/import/file", isAuthenticated, async (req: any, res) => {
    try {
      const name = String(req.body?.name || "");
      const mimeType = String(req.body?.mimeType || "");
      const dataUrl = String(req.body?.dataUrl || "");
      if (!name || !dataUrl) {
        return res.status(400).json({ message: "File is required" });
      }

      const buffer = Buffer.from(dataUrl.split(",")[1] || "", "base64");
      const text = await extractImportedText(name, mimeType, buffer);
      return res.status(200).json({ text });
    } catch (error: any) {
      return res.status(500).json({ message: error.message || "Import gagal" });
    }
  });

  // ===== ADMIN ROUTES =====

  // Get all users
  app.get("/api/admin/users", requireAdmin, async (req: any, res) => {
    try {
      const users = await authStorage.getUsers();
      res.json(users.map((u) => ({ ...u, password: "" })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update user role
  app.post("/api/admin/user/:id/role", requireSuperAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const { role } = req.body;

      if (!["user", "moderator", "admin", "superadmin"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updated = await authStorage.updateRole(userId, role);
      res.json({ ...updated, password: "" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

// User profile endpoints
  app.get("/api/users/:id/posts", async (req: any, res) => {
    try {
      const userId = req.params.id;
      const articles = await storage.getArticlesByAuthor(userId);
      res.json(articles);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/:id/stats", async (req: any, res) => {
    try {
      const userId = req.params.id;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get user comments
  app.get("/api/users/:id/comments", async (req: any, res) => {
    try {
      const userId = req.params.id;
      const comments = await storage.getCommentsByUser(userId);
      res.json(comments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get pending users (admin only)
  app.get("/api/admin/pending-users", requireAdmin, async (req: any, res) => {
    try {
      const users = await authStorage.getUsers();
      const pendingUsers = users.filter((u) => u.accountStatus === "pending");
      res.json(pendingUsers.map((u) => ({ ...u, password: "" })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Approve pending user (admin only)
  app.post("/api/admin/user/:id/approve", requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const user = await authStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.accountStatus === "active") {
        return res.status(400).json({ message: "User is already active" });
      }

      // Update user to be approved
      const updated = await authStorage.approveUser(userId);

      // Notify user
      await storage.createNotification({
        userId: userId,
        actorId: req.user?.claims?.sub || "system",
        type: "approval",
        message: "Akun kamu telah disetujui oleh admin. Selamat bergabung!",
      });

      res.json({ ...updated, password: "" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/admin/user/:id/status", requireAdmin, async (req: any, res) => {
    try {
      const userId = String(req.params.id);
      const nextStatus = req.body?.status as "pending" | "active" | "moderator" | "admin" | undefined;
      const actorId = req.user?.claims?.sub || req.session?.userId;

      if (!nextStatus || !["pending", "active", "moderator", "admin"].includes(nextStatus)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const actor = actorId ? await authStorage.getUser(String(actorId)) : undefined;
      const targetUser = await authStorage.getUser(userId);

      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      if (targetUser.role === "superadmin") {
        return res.status(403).json({ message: "Cannot modify a Super Admin" });
      }

      if (nextStatus === "admin" && actor?.role !== "superadmin") {
        return res.status(403).json({ message: "Only Super Admin can promote users to admin" });
      }

      const updated = await authStorage.updateAccessLevel(userId, nextStatus);

      if (nextStatus !== "pending") {
        await storage.createNotification({
          userId,
          actorId: actorId || "system",
          type: targetUser.accountStatus === "pending" ? "approval" : "status_change",
          message:
            nextStatus === "active"
              ? "Akun kamu telah diaktifkan."
              : nextStatus === "moderator"
                ? "Akun kamu telah diperbarui menjadi moderator."
                : "Akun kamu telah diperbarui menjadi admin.",
        });
      }

      return res.json({ ...updated, password: "" });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  });

  // Ban user (admin only)
  app.post("/api/admin/user/:id/ban", requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const user = await authStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === 'superadmin') {
        return res.status(403).json({ message: "Cannot ban a Super Admin" });
      }

      const updated = await authStorage.banUser(userId);
      res.json({ ...updated, password: "" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Unban user (admin only)
  app.post("/api/admin/user/:id/unban", requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const updated = await authStorage.unbanUser(userId);
      res.json({ ...updated, password: "" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Reject pending user (admin only) - delete user
  app.post("/api/admin/user/:id/reject", requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const user = await authStorage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isApproved) {
        return res.status(400).json({ message: "Cannot reject an approved user. Ban them instead." });
      }

      // Delete the pending user
      const deleted = await authStorage.deleteUser(userId);
      res.json({ ok: deleted });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete user
  app.delete("/api/admin/user/:id", requireSuperAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const deleted = await authStorage.deleteUser(userId);
      res.json({ ok: deleted });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete article (moderator/admin)
  app.delete("/api/admin/article/:id", requireModerator, async (req: any, res) => {
    try {
      const articleId = Number(req.params.id);
      const deleted = await storage.deleteArticle(articleId);
      res.json({ ok: deleted });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Delete comment (moderator/admin)
  app.delete("/api/admin/comment/:id", requireModerator, async (req: any, res) => {
    try {
      const commentId = Number(req.params.id);
      const deleted = await storage.deleteCommentByModerator(commentId);
      res.json({ ok: deleted });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create report
  app.post("/api/report", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub || req.session?.userId;
      const { targetId, targetType, reason, description } = req.body;

      if (!targetId || !targetType || !reason) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const report = await storage.createReport({
        reporterId: userId,
        targetId: Number(targetId),
        targetType,
        reason,
        description,
      });

      res.status(201).json(report);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get reports (admin/moderator)
  app.get("/api/admin/reports", requireModerator, async (req: any, res) => {
    try {
      const status = req.query.status as string | undefined;
      const reports = await storage.getReports(status);
      res.json(reports);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Resolve report
  app.post("/api/admin/report/:id/resolve", requireModerator, async (req: any, res) => {
    try {
      const reportId = Number(req.params.id);
      const userId = req.user?.claims?.sub || req.session?.userId;
      const { status } = req.body;

      if (!["pending", "reviewed", "resolved", "dismissed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      await storage.resolveReport(reportId, userId, status);
      res.json({ ok: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // ===== ADMIN EDIT ENDPOINTS =====
  
  // Admin edit article
  app.put("/api/admin/article/:id", requireModerator, async (req: any, res) => {
    try {
      const articleId = Number(req.params.id);
      const { title, content, location, latitude, longitude, hashtags } = req.body;
      
      const updates: any = {};
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (location !== undefined) updates.location = location;
      if (latitude !== undefined) updates.latitude = latitude;
      if (longitude !== undefined) updates.longitude = longitude;
      if (hashtags !== undefined) updates.hashtags = hashtags;
      
      const article = await storage.updateArticle(articleId, updates);
      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }
      res.json(article);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Admin edit user profile
  app.put("/api/admin/user/:id/profile", requireAdmin, async (req: any, res) => {
    try {
      const userId = req.params.id;
      const updates: any = {
        name: req.body?.name ?? req.body?.nama,
        nama: req.body?.nama,
        firstName: req.body?.firstName,
        lastName: req.body?.lastName,
        bio: req.body?.bio,
        location: req.body?.location,
        achievements: req.body?.achievements,
        interests: req.body?.interests,
        birthDate: req.body?.birthDate,
        aimsNumber: req.body?.aimsNumber,
        wasiyatNumber: req.body?.wasiyatNumber ?? req.body?.waisiyatNumber,
        waqfNumber: req.body?.waqfNumber,
        hizebStatus: req.body?.hizebStatus ?? req.body?.registrationStatus,
      };
      
      // Filter out undefined values
      Object.keys(updates).forEach(key => updates[key] === undefined && delete updates[key]);
      
      const updated = await authStorage.updateProfile(userId, updates);
      res.json({ ...updated, password: "" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}

async function extractImportedText(name: string, mimeType: string, buffer: Buffer) {
  const lowerName = name.toLowerCase();

  if (lowerName.endsWith(".docx") || mimeType.includes("word")) {
    return extractDocxText(buffer);
  }

  if (lowerName.endsWith(".pdf") || mimeType.includes("pdf")) {
    return extractPdfText(buffer);
  }

  return buffer.toString("utf8");
}

async function extractDocxText(buffer: Buffer) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "amanat-docx-"));
  const filePath = path.join(tempRoot, "upload.docx");
  const extractPath = path.join(tempRoot, "unzipped");
  fs.writeFileSync(filePath, buffer);

  try {
    await execFileAsync("powershell.exe", [
      "-NoProfile",
      "-Command",
      `Expand-Archive -LiteralPath '${filePath.replace(/'/g, "''")}' -DestinationPath '${extractPath.replace(/'/g, "''")}' -Force`,
    ]);
    const xmlPath = path.join(extractPath, "word", "document.xml");
    const xml = fs.readFileSync(xmlPath, "utf8");
    return xml
      .replace(/<w:p[^>]*>/g, "\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\n\s+/g, "\n")
      .trim();
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function extractPdfText(buffer: Buffer) {
  const raw = buffer.toString("latin1");
  const matches = raw.match(/[A-Za-z0-9\u00C0-\u024F][A-Za-z0-9\u00C0-\u024F\s,.;:!?()"'/-]{4,}/g) || [];
  return matches
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
