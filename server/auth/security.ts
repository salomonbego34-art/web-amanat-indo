import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";
import { authStorage } from "./storage";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  if (!stored.includes(":")) {
    return password === stored;
  }

  const [salt, hashed] = stored.split(":");
  const derived = scryptSync(password, salt, 64);
  const hashedBuffer = Buffer.from(hashed, "hex");
  if (hashedBuffer.length !== derived.length) return false;
  return timingSafeEqual(derived, hashedBuffer);
}

// Role-based middlewares
export const requireRole = (allowedRoles: string[]): RequestHandler => {
  return async (req: any, res, next) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await authStorage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }

    if (user.isBanned) {
      return res.status(403).json({ message: "Your account has been banned" });
    }

    req.user = { claims: { sub: user.id }, role: user.role };
    return next();
  };
};

export const requireModerator: RequestHandler = async (req: any, res, next) => {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await authStorage.getUser(userId);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!["moderator", "admin", "superadmin"].includes(user.role)) {
    return res.status(403).json({ message: "Forbidden: only moderators can perform this action" });
  }

  if (user.isBanned) {
    return res.status(403).json({ message: "Your account has been banned" });
  }

  req.user = { claims: { sub: user.id }, role: user.role };
  return next();
};

export const requireAdmin: RequestHandler = async (req: any, res, next) => {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await authStorage.getUser(userId);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!["admin", "superadmin"].includes(user.role)) {
    return res.status(403).json({ message: "Forbidden: only admins can perform this action" });
  }

  if (user.isBanned) {
    return res.status(403).json({ message: "Your account has been banned" });
  }

  req.user = { claims: { sub: user.id }, role: user.role };
  return next();
};

export const requireSuperAdmin: RequestHandler = async (req: any, res, next) => {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await authStorage.getUser(userId);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (user.role !== "superadmin") {
    return res.status(403).json({ message: "Forbidden: only super admins can perform this action" });
  }

  if (user.isBanned) {
    return res.status(403).json({ message: "Your account has been banned" });
  }

  req.user = { claims: { sub: user.id }, role: user.role };
  return next();
};
