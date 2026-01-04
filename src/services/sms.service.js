// src/services/sms.service.js
require("dotenv").config();
const mysql = require("mysql2/promise");
const twilio = require("twilio");

// Initialize Twilio Client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const sendSmsAsync = async (id, phoneNumber, content) => {
  console.log(`[SMS Service] Preparing to send to ${phoneNumber}`);

  try {
    // 1. IDEMPOTENCY CHECK
    const [rows] = await db.execute("SELECT status FROM notifications WHERE id = ?", [id]);
    if (rows.length > 0 && rows[0].status === "SENT") {
      console.log(`[Idempotency] SMS ${id} already SENT.`);
      return true;
    }

    // 2. REAL SMS CALL (Twilio)
    const message = await client.messages.create({
      body: content,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log(`[Twilio] Message SID: ${message.sid}`);

    // 3. Update DB on Success
    await db.execute("UPDATE notifications SET status = ? WHERE id = ?", ["SENT", id]);
    console.log(`[SMS Service] SMS ${id} sent successfully.`);
    return true;

  } catch (err) {
    console.error(`[SMS Service] Failed: ${err.message}`);
    
    // Update DB on Failure
    await db.execute("UPDATE notifications SET status = ? WHERE id = ?", ["FAILED", id]);
    
    // Throw error so the Worker knows to Retry
    throw err;
  }
};

module.exports = { sendSmsAsync };