// // src/services/push.service.js
// require("dotenv").config();
// const mysql = require("mysql2/promise");
// const admin = require("firebase-admin");
// const path = require("path");

// // Initialize Firebase Admin SDK
// // Make sure serviceAccountKey.json is in your project root
// try {
//   const serviceAccount = require(path.join(__dirname, "../../serviceAccountKey.json"));
//   admin.initializeApp({
//     credential: admin.credential.cert(serviceAccount)
//   });
//   console.log("🔥 Firebase Admin Initialized");
// } catch (error) {
//   console.error("❌ Firebase Init Error: Missing serviceAccountKey.json?");
// }

// const db = mysql.createPool({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });

// const sendPushAsync = async (id, deviceToken, title, body) => {
//   console.log(`[Push Service] Processing push for ID: ${id}`);

//   try {
//     // 1. IDEMPOTENCY CHECK
//     const [rows] = await db.execute("SELECT status FROM notifications WHERE id = ?", [id]);
//     if (rows.length > 0 && rows[0].status === "SENT") {
//       console.log(`[Idempotency] Push ${id} already SENT.`);
//       return true;
//     }

//     // 2. REAL PUSH CALL (FCM)
//     const message = {
//       token: deviceToken,
//       notification: {
//         title: title || "New Notification",
//         body: body
//       }
//     };

//     const response = await admin.messaging().send(message);
//     console.log(`[FCM] Successfully sent message: ${response}`);

//     // 3. Update DB on Success
//     await db.execute("UPDATE notifications SET status = ? WHERE id = ?", ["SENT", id]);
//     console.log(`[Push Service] Push ${id} marked as SENT.`);
//     return true;

//   } catch (err) {
//     console.error(`[Push Service] Failed: ${err.message}`);
    
//     // Update DB on Failure
//     await db.execute("UPDATE notifications SET status = ? WHERE id = ?", ["FAILED", id]);
    
//     // Throw error so the worker knows to retry
//     throw err;
//   }
// };

// module.exports = { sendPushAsync };





// src/services/push.service.js

const sendPushAsync = async (id, deviceToken, title, body) => {
  console.log(`[Push Service] Processing push for ID: ${id}`);

  try {
    const [rows] = await db.execute("SELECT status FROM notifications WHERE id = ?", [id]);
    if (rows.length > 0 && rows[0].status === "SENT") {
      console.log(`[Idempotency] Push ${id} already SENT.`);
      return true;
    }

    let response;
    // Check if we are in test mode to avoid real FCM calls
    if (process.env.NODE_ENV === 'test') {
      console.log(`[MOCK FCM] Mocking push for token: ${deviceToken}`);
      response = "projects/notification-system/messages/mock-id-12345";
    } else {
      const message = {
        token: deviceToken,
        notification: {
          title: title || "New Notification",
          body: body
        }
      };
      response = await admin.messaging().send(message);
      console.log(`[FCM] Successfully sent message: ${response}`);
    }

    await db.execute("UPDATE notifications SET status = ? WHERE id = ?", ["SENT", id]);
    console.log(`[Push Service] Push ${id} marked as SENT.`);
    return true;

  } catch (err) {
    console.error(`[Push Service] Failed: ${err.message}`);
    await db.execute("UPDATE notifications SET status = ? WHERE id = ?", ["FAILED", id]);
    throw err;
  }
};