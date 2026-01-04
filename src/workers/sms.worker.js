// src/workers/sms.worker.js
require("dotenv").config();
const { connectQueue } = require("../queue/rabbitmq");
const { sendSmsAsync } = require("../services/sms.service");

const MAIN_QUEUE = "notifications";

const startWorker = async () => {
  const channel = await connectQueue();
  channel.prefetch(1);
  console.log("📱 SMS Worker running...");

  channel.consume(MAIN_QUEUE, async (msg) => {
    if (!msg) return;
    const data = JSON.parse(msg.content.toString());

    // 🛑 FILTER: Only process SMS
    if (data.channel !== 'SMS') {
      return channel.nack(msg, false, true);
    }

    try {
      console.log(`[SMS Worker] Processing ${data.notificationId}`);
      await sendSmsAsync(data.notificationId, data.phoneNumber, data.template);
      channel.ack(msg);
    } catch (err) {
      console.log("Error sending SMS, handling retry...");
      channel.nack(msg, false, false); 
    }
  });
};

startWorker();