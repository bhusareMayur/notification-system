// src/routes/notification.routes.js

const express = require("express");
const router = express.Router();

const {
  createNotification,
  retryNotification
} = require("../controllers/notification.controller");

// Route to create a new notification
router.post("/notifications", createNotification);

// Route to manually retry a failed notification by ID
router.post("/notifications/retry/:id", retryNotification);

module.exports = router;