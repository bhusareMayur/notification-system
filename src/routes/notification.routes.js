// src/routes/notification.routes.js
const express = require("express");
const router = express.Router();

const {
  createNotification,
  retryNotification
} = require("../controllers/notification.controller");

// Create a new notification
router.post("/notifications", createNotification);

// Retry a failed notification
router.post("/notifications/retry/:id", retryNotification);

module.exports = router;