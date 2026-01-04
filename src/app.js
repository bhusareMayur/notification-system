
//src/app.js
const express = require("express");
const app = express();

const notificationRoutes = require("./routes/notification.routes");

app.use(express.json());

// ✅ THIS LINE IS REQUIRED
app.use("/api", notificationRoutes);

// fallback 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl
  });
});

module.exports = app;
