// src/workers/email.worker.js
require("dotenv").config();
const { connectQueue } = require("../queue/rabbitmq");
const { sendEmailAsync } = require("../services/email.service");

const MAIN_QUEUE = "notifications";
const DLQ_QUEUE = "notifications.dlq";
const MAX_RETRIES = 3;

const startWorker = async () => {
  const channel = await connectQueue();
  channel.prefetch(1);
  console.log("✉️  EMAIL Worker running...");

  channel.consume(MAIN_QUEUE, async (msg) => {
    if (!msg) return;

    const data = JSON.parse(msg.content.toString());

    //  FILTER: If this is NOT an email, ignore it (Requeue for other workers)
    if (data.channel !== 'EMAIL') {
      // nack(message, allUpTo=false, requeue=true)
      return channel.nack(msg, false, true);
    }

    try {
      console.log(`[Email Worker] Processing ${data.notificationId}`);
      await sendEmailAsync(data.notificationId, data.email, data.name);
      channel.ack(msg);
    } catch (err) {
      // ... (Existing Retry/DLQ logic here)
      // For brevity: if retries exhausted -> DLQ; else -> nack(false, false) for delay
      console.log("Error sending email, handling retry...");
      channel.nack(msg, false, false); // Send to retry queue
    }
  });
};

startWorker();