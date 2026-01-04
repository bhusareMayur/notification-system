// src/controllers/notification.controller.js

const db = require("../db/mysql");
const { publishToQueue } = require("../queue/rabbitmq");

// 1. Create Notification (Existing)
const createNotification = (req, res) => {
  const { email, name, type, template } = req.body;

  if (!email || !type) {
    return res.status(400).json({ message: "Invalid request" });
  }

  const query =
    "INSERT INTO notifications (email, name, type, template, status) VALUES (?, ?, ?, ?, ?)";

  db.query(
    query,
    [email, name, type, template, "PENDING"],
    (err, result) => {
      if (err) {
        return res.status(500).json({ message: "DB error" });
      }

      const notificationId = result.insertId;

      // ✅ FIRE-AND-FORGET
      publishToQueue({
        notificationId,
        email,
        name
      }).catch((err) => {
        console.error("Queue publish failed:", err.message);
      });

      return res.status(202).json({
        status: "ACCEPTED",
        notificationId
      });
    }
  );
};

// 2. Retry Notification (New)
const retryNotification = (req, res) => {
  const { id } = req.params;

  // Step A: Find the notification in DB
  const querySelect = "SELECT * FROM notifications WHERE id = ?";
  
  db.query(querySelect, [id], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "DB error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const notification = results[0];

    // Step B: Update status to PENDING so the system knows it's active again
    const queryUpdate = "UPDATE notifications SET status = ? WHERE id = ?";
    
    db.query(queryUpdate, ["PENDING", id], (err, updateResult) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Failed to update status" });
      }

      // Step C: Push back to RabbitMQ (Main Queue)
      publishToQueue({
        notificationId: notification.id,
        email: notification.email,
        name: notification.name
      }).catch((err) => {
        console.error("Queue retry publish failed:", err.message);
      });

      // Step D: Respond success
      return res.status(200).json({
        status: "RETRY_INITIATED",
        message: "Notification moved to main queue",
        notificationId: notification.id
      });
    });
  });
};

module.exports = { 
  createNotification,
  retryNotification 
};