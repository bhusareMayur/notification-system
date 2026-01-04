// src/controllers/notification.controller.js

const db = require("../db/mysql");
const { publishToQueue } = require("../queue/rabbitmq");

const createNotification = (req, res) => {
  // 1. Accept new fields: channel, phoneNumber, deviceToken
  const { 
    channel, // EMAIL, SMS, PUSH
    email, 
    phoneNumber, 
    deviceToken, 
    name, 
    template, 
    idempotencyKey 
  } = req.body;

  // 2. Validation per channel
  if (!channel) return res.status(400).json({ message: "Channel is required" });

  if (channel === 'EMAIL' && !email) return res.status(400).json({ message: "Email required for EMAIL channel" });
  if (channel === 'SMS' && !phoneNumber) return res.status(400).json({ message: "Phone Number required for SMS channel" });
  if (channel === 'PUSH' && !deviceToken) return res.status(400).json({ message: "Device Token required for PUSH channel" });

  // 3. Insert into DB with new columns
  const query =
    "INSERT INTO notifications (channel, email, phone_number, device_token, name, template, status, idempotency_key) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

  db.query(
    query,
    [channel, email || null, phoneNumber || null, deviceToken || null, name, template, "PENDING", idempotencyKey || null],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res.status(200).json({ status: "ALREADY_PROCESSED" });
        }
        console.error("DB Insert Error:", err);
        return res.status(500).json({ message: "DB error" });
      }

      const notificationId = result.insertId;

      // 4. Publish Event to Queue
      // The worker will look at 'channel' to decide if it should process this msg
      publishToQueue({
        notificationId,
        channel,
        email,
        phoneNumber,
        deviceToken,
        name,
        template
      }).catch((err) => console.error("Queue error:", err));

      return res.status(202).json({
        status: "ACCEPTED",
        notificationId,
        channel
      });
    }
  );
};

const retryNotification = (req, res) => {
  // ... (Existing retry logic remains mostly the same, just ensure you select all new columns)
  // For brevity, assuming existing logic works but pulls updated row data
};

module.exports = { createNotification, retryNotification };