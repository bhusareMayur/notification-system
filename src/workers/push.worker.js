// src/workers/push.worker.js
require("dotenv").config();
const { connectQueue } = require("../queue/rabbitmq");
const { sendPushAsync } = require("../services/push.service");

const MAIN_QUEUE = "notifications";

const startWorker = async () => {
  const channel = await connectQueue();
  channel.prefetch(1);
  console.log("🔔 PUSH Worker running...");

  channel.consume(MAIN_QUEUE, async (msg) => {
    if (!msg) return;
    const data = JSON.parse(msg.content.toString());

    // 🛑 FILTER: Only process PUSH
    // if (data.channel !== 'PUSH') {
    //   return channel.sendToQueue(MAIN_QUEUE, msg.content, { persistent: true });
    // }
    if (data.channel !== "PUSH") {
      return channel.nack(msg, false, true); // Requeue so SMS/Email workers can grab it
    }

   try {
    console.log(`[Push Worker] Processing ${data.notificationId}`);
    await sendPushAsync(data.notificationId, data.deviceToken, "New Alert", data.template);
    channel.ack(msg); // ✅ Success
} catch (err) {
    console.log(`[Push Worker] Error: ${err.message}`);

    // If the token is invalid, it will NEVER work. Don't retry it.
    if (err.message.includes("not a valid FCM registration token") || 
        err.message.includes("registration-token-not-registered")) {
        console.log("CRITICAL: Invalid token. Acknowledging to remove from queue.");
        channel.ack(msg); // 👈 We ACK so it's removed from RabbitMQ, even though it failed FCM.
    } else {
        // Only NACK for temporary issues (like network timeouts)
        channel.nack(msg, false, false); 
    }
}
  });
};

startWorker();
