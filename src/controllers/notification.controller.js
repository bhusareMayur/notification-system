//src/controllers/notification.controller.js

const db = require("../db/mysql");
const { publishToQueue } = require("../queue/rabbitmq");

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

      // ✅ FIRE-AND-FORGET (NO await)
      publishToQueue({
        notificationId,
        email,
        name
      }).catch((err) => {
        console.error("Queue publish failed:", err.message);
      });

      // ✅ Respond immediately
      return res.status(202).json({
        status: "ACCEPTED",
        notificationId
      });
    }
  );
};

module.exports = { createNotification };
