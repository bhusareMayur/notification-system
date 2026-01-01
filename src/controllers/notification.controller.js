const db = require("../db/mysql");
const { sendEmailAsync } = require("../services/email.service");

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

      // NON-BLOCKING email sending
      setImmediate(() => {
        sendEmailAsync(notificationId, email, name);
      });

      return res.status(202).json({
        status: "ACCEPTED",
        notificationId: notificationId
      });
    }
  );
};

module.exports = { createNotification };
