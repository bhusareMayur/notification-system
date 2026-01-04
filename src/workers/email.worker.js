// src/workers/email.worker.js

require("dotenv").config();
const amqp = require("amqplib");
const { sendEmailAsync } = require("../services/email.service");

const MAIN_QUEUE = "notifications";
const MAX_RETRIES = 3;

const getRetryCount = (msg) => {
  const deaths = msg.properties.headers["x-death"];
  if (!deaths || deaths.length === 0) return 0;
  return deaths[0].count;
};

const startWorker = async () => {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await connection.createChannel();

  channel.prefetch(1);
  await channel.assertQueue(MAIN_QUEUE, { durable: true });

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
        // Send to DLQ
        channel.reject(msg, false);
      } else {
        // Retry via TTL + DLX
        channel.nack(msg, false, false);
      }
    }
  });
};

startWorker();
