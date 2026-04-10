import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(
    express.static(distPath, {
      index: false,
      redirect: false,
    }),
  );

  // SPA fallback for non-API GET routes.
  app.use((req, res, next) => {
    const requestPath = typeof req.path === "string" ? req.path : "";
    if (req.method !== "GET" || !requestPath || requestPath.startsWith("/api")) {
      return next();
    }

    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
