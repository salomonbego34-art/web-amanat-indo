import type { Express } from "express";
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { authStorage } from "./storage";
import { isAuthenticated } from "./auth";
import { hashPassword, verifyPassword } from "./security";

function sanitizeUser(user: any) {
  if (!user) return user;
  return { ...user, password: "", status: user.status || user.accountStatus };
}

function sessionRegenerate(req: any): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err: unknown) => (err ? reject(err) : resolve()));
  });
}

function sessionSave(req: any): Promise<void> {
  return new Promise((resolve, reject) => {
    req.session.save((err: unknown) => (err ? reject(err) : resolve()));
  });
}

export function registerAuthRoutes(app: Express): void {
  const registerUser = async (req: any, res: any) => {
    try {
      const {
        name,
        username,
        password,
        email,
        bio,
        aimsNumber,
        waqfNumber,
        wasiyatNumber,
        waisiyatNumber,
        birthDate,
        interests,
        achievements,
      } = req.body ?? {};

      if (!name || !username || !aimsNumber || !password) {
        return res.status(400).json({ message: "Required fields missing" });
      }

      const normalizedUsername = String(username).trim();
      const existing = await authStorage.getUserByUsername(normalizedUsername);
      if (existing) {
        return res.status(409).json({ message: "Username already used" });
      }

      const existingUsers = await authStorage.getUsers();
      const isFirstUser = existingUsers.length === 0;
      const trimmedName = String(name).trim();
      const [firstNamePart, ...restNameParts] = trimmedName.split(/\s+/);
      const lastNamePart = restNameParts.join(" ").trim() || null;

      const user = await authStorage.createUser({
        id: randomUUID(),
        name: trimmedName,
        nama: trimmedName,
        username: normalizedUsername,
        password: hashPassword(String(password)),
        firstName: firstNamePart || null,
        lastName: lastNamePart,
        email: email ? String(email).trim() : null,
        profileImageUrl: null,
        location: null,
        bio: bio ? String(bio) : null,
        accountStatus: isFirstUser ? "active" : "pending",
        achievements: achievements ? String(achievements) : null,
        interests: interests ? String(interests) : null,
        birthDate: birthDate ? String(birthDate) : null,
        aimsNumber: String(aimsNumber).trim(),
        wasiyatNumber: wasiyatNumber
          ? String(wasiyatNumber).trim()
          : waisiyatNumber
            ? String(waisiyatNumber).trim()
            : null,
        waqfNumber: waqfNumber ? String(waqfNumber).trim() : null,
        role: isFirstUser ? "superadmin" : "user",
      });

      await sessionRegenerate(req);
      req.session.userId = user.id;
      await sessionSave(req);

      if (user.accountStatus === "pending") {
        try {
          const admins = await authStorage.getUsers();
          const adminUsers = admins.filter((item) => ["admin", "superadmin"].includes(item.role));
          const { storage } = await import("../storage");

          for (const admin of adminUsers) {
            await storage.createNotification({
              userId: admin.id,
              actorId: user.id,
              type: "approval_request",
              message: `Pengguna baru @${user.username} menunggu persetujuan.`,
            });
          }
        } catch (error) {
          console.error("Failed to notify admins:", error);
        }
      }

      return res.status(user.accountStatus === "pending" ? 202 : 201).json({
        ...sanitizeUser(user),
        message:
          user.accountStatus === "pending"
            ? "Registration successful! Your account is pending approval by an administrator."
            : "Registration successful!",
      });
    } catch (error) {
      console.error("Register failed:", error);
      return res.status(500).json({ message: "Failed to register" });
    }
  };

  const getCurrentUser = async (req: any, res: any) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await authStorage.getUser(userId);
      return res.json(sanitizeUser(user));
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Failed to fetch user" });
    }
  };

  const updateCurrentProfile = async (req: any, res: any) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      let profileImagePath = req.body?.profileImageUrl;
      if (typeof profileImagePath === "string" && profileImagePath.startsWith("data:image/")) {
        profileImagePath = saveProfileImage(userId, profileImagePath);
      }

      const profile = await authStorage.updateProfile(userId, {
        name: req.body?.name ?? req.body?.nama,
        nama: req.body?.nama,
        firstName: req.body?.firstName,
        lastName: req.body?.lastName,
        bio: req.body?.bio,
        accountStatus: req.body?.accountStatus || req.body?.status,
        achievements: req.body?.achievements,
        interests: req.body?.interests,
        location: req.body?.location,
        profileImageUrl: profileImagePath,
        birthDate: req.body?.birthDate ? String(req.body.birthDate) : undefined,
        aimsNumber: req.body?.aimsNumber,
        wasiyatNumber: req.body?.wasiyatNumber ?? req.body?.waisiyatNumber,
        waqfNumber: req.body?.waqfNumber,
        hizebStatus: req.body?.hizebStatus || req.body?.registrationStatus,
      });

      return res.json(sanitizeUser(profile));
    } catch {
      return res.status(500).json({ message: "Failed to update profile" });
    }
  };

  app.get("/api/profile", isAuthenticated, getCurrentUser);
  app.put("/api/profile", isAuthenticated, updateCurrentProfile);
  app.post("/api/register", registerUser);
  app.post("/api/auth/register", registerUser);

  app.post("/api/auth/login", async (req: any, res) => {
    try {
      const { username, password } = req.body ?? {};
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await authStorage.getUserByLogin(String(username).trim());
      if (!user || !verifyPassword(String(password), user.password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "Your account has been banned. Please contact admin." });
      }

      await sessionRegenerate(req);
      req.session.userId = user.id;
      await sessionSave(req);

      return res.status(200).json(sanitizeUser(user));
    } catch (error) {
      console.error("Login failed:", error);
      return res.status(500).json({ message: "Failed to login" });
    }
  });

  app.get("/api/auth/user", isAuthenticated, getCurrentUser);
  app.put("/api/auth/profile", isAuthenticated, updateCurrentProfile);
}

function saveProfileImage(userId: string, dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return dataUrl;

  const mime = match[1];
  const ext = mime.split("/")[1]?.replace("jpeg", "jpg") || "png";
  const outputDir = path.resolve(process.cwd(), "uploads", "profiles");
  fs.mkdirSync(outputDir, { recursive: true });
  const fileName = `${userId}-${Date.now()}.${ext}`;
  const outputPath = path.join(outputDir, fileName);
  fs.writeFileSync(outputPath, Buffer.from(match[2], "base64"));
  return `/uploads/profiles/${fileName}`;
}
