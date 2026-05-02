import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Default port 5000 for Replit dev/deploy; honour PORT override so the
  // Electron desktop app can boot this same bundle on a random free local
  // port. HOST defaults to 0.0.0.0 so Replit deployments stay reachable;
  // Electron sets HOST=127.0.0.1 explicitly to keep the till backend
  // loopback-only. reusePort is Linux-only AND only useful for Replit's
  // hot-reload pattern (binding 5000 on 0.0.0.0); skip it everywhere else.
  const port = parseInt(process.env.PORT || '', 10) || 5000;
  const host = process.env.HOST || '0.0.0.0';
  const listenOpts: any = { port, host };
  if (!process.env.PORT && !process.env.HOST && process.platform === 'linux') {
    listenOpts.reusePort = true;
  }
  server.listen(listenOpts, () => {
    log(`serving on ${host}:${port}`);
  });
})();
