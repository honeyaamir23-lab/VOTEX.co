import express from "express";
import http from "http";
import path from "path";

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json());

  // ====== BACKEND LOGIC LAYOUT: TIMERS & COMMISSION ======
  // In a real production app, this would be a Google Cloud Function scheduled via pub/sub,
  // or a background worker process querying Firestore.
  
  app.get("/api/process-battles", async (req, res) => {
    // LAYOUT FOR BATTLE RESOLUTION LOGIC
    // Moved to client-side optimistic resolution / active polling in GameContext
    try {
      res.json({ success: true, message: "Battle logic layout executed." });
    } catch (e) {
      res.status(500).json({ error: "Configuration required" });
    }
  });

  // ====== VITE MIDDLEWARE (Production Fallback) ======
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
