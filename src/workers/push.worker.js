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
    if (data.channel !== 'PUSH') {
      return channel.nack(msg, false, true);
    }

    try {
      console.log(`[Push Worker] Processing ${data.notificationId}`);
      await sendPushAsync(data.notificationId, data.deviceToken, "New Alert", data.template);
      channel.ack(msg);
    } catch (err) {
      console.log("Error sending Push, handling retry...");
      channel.nack(msg, false, false); 
    }
  });
};

startWorker();