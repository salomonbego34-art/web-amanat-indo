import session from "express-session";
import type { Express, RequestHandler } from "express";
import createMemoryStore from "memorystore";
import { authStorage } from "./storage";
import { markUserOffline } from "../presence";

declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const MemoryStore = createMemoryStore(session);
  const cookieSecure =
    process.env.SESSION_SECURE === "true" ||
    (process.env.NODE_ENV === "production" && process.env.SESSION_SECURE !== "false");

  return session({
    name: "cnh.sid",
    secret: process.env.SESSION_SECRET ?? "dev-session-secret",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 24 * 60 * 60 * 1000,
    }),
    cookie: {
      httpOnly: true,
      secure: cookieSecure,
      sameSite: "lax",
      maxAge: sessionTtl,
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  const destroySession = (req: any, res: any, redirect = false) => {
    const userId = req.session?.userId;

    req.session.destroy((err: any) => {
      if (err) {
        return redirect
          ? res.redirect("/auth")
          : res.status(500).json({ message: "Failed to logout" });
      }

      if (userId) {
        markUserOffline(userId);
      }

      if (typeof res.clearCookie === "function") {
        res.clearCookie("cnh.sid", {
          path: "/",
          httpOnly: true,
          sameSite: "lax",
        });
      } else if (typeof res.setHeader === "function") {
        res.setHeader("Set-Cookie", "cnh.sid=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax");
      }

      if (redirect) {
        return res.redirect("/auth");
      }

      return res.status(200).json({ ok: true });
    });
  };

  app.get("/api/logout", (req: any, res) => destroySession(req, res, true));
  app.post("/api/logout", (req: any, res) => destroySession(req, res));
  app.post("/api/auth/logout", (req: any, res) => destroySession(req, res));
}

export const isAuthenticated: RequestHandler = async (req: any, res, next) => {
  const userId = req.session?.userId;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = await authStorage.getUser(userId);
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  req.user = { claims: { sub: user.id } };
  return next();
};
