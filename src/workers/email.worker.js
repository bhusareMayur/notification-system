// src/workers/email.worker.js

require("dotenv").config();
const { connectQueue } = require("../queue/rabbitmq");
const { sendEmailAsync } = require("../services/email.service");

const MAIN_QUEUE = "notifications";
const DLQ_QUEUE = "notifications.dlq"; // ✅ Define the explicit DLQ name
const MAX_RETRIES = 3;

const getRetryCount = (msg) => {
  const deaths = msg.properties.headers["x-death"];
  if (!deaths || deaths.length === 0) return 0;
  return deaths[0].count;
};

const startWorker = async () => {
  const channel = await connectQueue();

  channel.prefetch(1);

  console.log("Email worker running (Retry + DLQ)");

  channel.consume(MAIN_QUEUE, async (msg) => {
    if (!msg) return;

    const data = JSON.parse(msg.content.toString());
    const retryCount = getRetryCount(msg);

    try {
      await sendEmailAsync(
        data.notificationId,
        data.email,
        data.name
      );

      channel.ack(msg);
    } catch (err) {
      console.log(`Retry attempt ${retryCount + 1}`);

      if (retryCount >= MAX_RETRIES) {
        // ✅ FIX: Manually send to final DLQ.
        // Calling reject() here would send it back to 'notifications.retry' (infinite loop)
        console.log("Max retries reached. Moving to DLQ.");
        
        channel.sendToQueue(DLQ_QUEUE, msg.content, { persistent: true });
        
        // ✅ ACK the message to remove it from the main queue cycle
        channel.ack(msg);
      } else {
        // Retry via TTL + DLX
        // This relies on the queue's DLX setting to move it to 'notifications.retry'
        channel.nack(msg, false, false);
      }
    }
  });
};

startWorker();