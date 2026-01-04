// src/controllers/notification.controller.js

const db = require("../db/mysql");
const { publishToQueue } = require("../queue/rabbitmq");

// 1. Create Notification (With Idempotency)
const createNotification = (req, res) => {
  // 1. Get idempotencyKey from body
  const { email, name, type, template, idempotencyKey } = req.body;

  if (!email || !type) {
    return res.status(400).json({ message: "Invalid request" });
  }

  // 2. Insert idempotency_key into DB
  const query =
    "INSERT INTO notifications (email, name, type, template, status, idempotency_key) VALUES (?, ?, ?, ?, ?, ?)";

  db.query(
    query,
    // Pass 'idempotencyKey' (or null if the user didn't send one)
    [email, name, type, template, "PENDING", idempotencyKey || null],
    (err, result) => {
      if (err) {
        // IDEMPOTENCY CHECK (Producer Side)
        // If MySQL complains about a duplicate entry (code 1062 / ER_DUP_ENTRY)
        if (err.code === "ER_DUP_ENTRY") {
          console.log(`[Idempotency] Duplicate request blocked: ${idempotencyKey}`);
          
          // Fetch the ORIGINAL notification to return to the user
          const findQuery = "SELECT id, status FROM notifications WHERE idempotency_key = ?";
          db.query(findQuery, [idempotencyKey], (findErr, findResult) => {
            if (findErr) return res.status(500).json({ message: "DB Error fetching duplicate" });
            
            // Return 200 OK (not 202 Accepted) because we aren't creating anything new
            return res.status(200).json({
              status: "ALREADY_PROCESSED",
              notificationId: findResult[0].id,
              currentStatus: findResult[0].status
            });
          });
          return; // Stop execution here
        }

        console.error("DB Insert Error:", err);
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

// 2. Retry Notification (Existing Logic)
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