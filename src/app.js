// src/app.js
const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const notificationRoutes = require("./routes/notification.routes");

const app = express();
app.use(express.static("public"));
app.use(express.json());

// SWAGGER UI ROUTE
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API ROUTES
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