import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import react from "@vitejs/plugin-react";
import { type Server } from "http";
import fs from "fs";
import path from "path";

const viteLogger = createLogger();

const viteBaseConfig = {
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "..", "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "..", "shared"),
      "@assets": path.resolve(import.meta.dirname, "..", "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "..", "client"),
};

export async function setupVite(server: Server, app: Express) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteBaseConfig,
    plugins: [react()],
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  const normalizePath = (requestPath: unknown): string => {
    if (typeof requestPath === "string") {
      return requestPath;
    }
    return "";
  };

  const shouldServeApp = (requestPath: unknown) => {
    const pathValue = normalizePath(requestPath);
    if (pathValue === "" || pathValue === "/") {
      return true;
    }

    if (
      pathValue.startsWith("/api") ||
      pathValue.startsWith("/uploads") ||
      pathValue.startsWith("/@vite") ||
      pathValue.startsWith("/@react-refresh") ||
      pathValue.startsWith("/@fs") ||
      pathValue.startsWith("/src/") ||
      pathValue.startsWith("/node_modules/") ||
      pathValue === "/vite-hmr"
    ) {
      return false;
    }

    return path.extname(pathValue) === "";
  };

  app.use(async (req, res, next) => {
    const requestPath = normalizePath(req.path || req.url);
    if (req.method !== "GET" || !shouldServeApp(requestPath)) {
      return next();
    }

    const url = normalizePath(req.originalUrl);

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e: unknown) {
      console.error("Error in Vite page handler", e);
      if (e instanceof Error) {
        console.error(e.stack);
      }
      if (e instanceof Error) {
        vite.ssrFixStacktrace(e);
      }
      next(e);
    }
  });

  app.use(vite.middlewares);
}
