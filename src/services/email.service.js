// src/services/email.service.js

const nodemailer = require("nodemailer");
const mysql = require("mysql2/promise");
require("dotenv").config();

// Create MySQL promise pool (safe for async/await)
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 30,
  queueLimit: 0
});

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465, // true only for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmailAsync = async (id, email, name) => {
  try {
    // IDEMPOTENCY CHECK (Consumer Side)
    // Check if this notification was already successfully sent.
    // This protects against "At-Least-Once" delivery where RabbitMQ might redeliver a message.
    const [rows] = await db.execute(
      "SELECT status FROM notifications WHERE id = ?", 
      [id]
    );

    if (rows.length > 0 && rows[0].status === "SENT") {
      console.log(`[Idempotency] Notification ${id} already SENT. Skipping.`);
      return true; // We return 'true' to tell the worker "Job done, acknowledge the message"
    }

    // Send email
    await transporter.sendMail({
      from: `Notification System <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome",
      text: `Hello ${name}, welcome to our platform`
    });

    // Update DB on success
    await db.execute(
      "UPDATE notifications SET status = ? WHERE id = ?",
      ["SENT", id]
    );

    return true;
  } catch (err) {
    // Update DB on failure
    await db.execute(
      "UPDATE notifications SET status = ? WHERE id = ?",
      ["FAILED", id]
    );

    // REQUIRED: let worker retry logic handle it
    throw err;
  }
};

module.exports = { sendEmailAsync };