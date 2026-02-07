const express = require("express");
const cors = require("cors");

const scanRoutes = require("./routes/dastRoutes");

function createApp() {
  const app = express();

  // Global middleware
  app.use(cors());
  app.use(express.json());

  // Health check
  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // API routes (versioned/grouped under /api)
  app.use("/api", scanRoutes);

  return app;
}

module.exports = { createApp };

