//src/queue/rabbitmq.js

require("dotenv").config();
const amqp = require("amqplib");

const MAIN_QUEUE = "notifications";
const RETRY_QUEUE = "notifications.retry";
const DLQ = "notifications.dlq";

let channel;

const connectQueue = async () => {
  if (channel) return channel;

  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();

  // Dead Letter Queue (final failure)
  await channel.assertQueue(DLQ, {
    durable: true
  });

  // Retry Queue (delayed)
  await channel.assertQueue(RETRY_QUEUE, {
    durable: true,
    arguments: {
      "x-message-ttl": 5000,
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": MAIN_QUEUE
    }
  });

  // Main Queue
  await channel.assertQueue(MAIN_QUEUE, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": "",
      "x-dead-letter-routing-key": RETRY_QUEUE
    }
  });

  console.log("RabbitMQ queues ready (Retry + DLQ)");

  return channel;
};

const publishToQueue = async (data) => {
  const ch = await connectQueue();

  ch.sendToQueue(
    MAIN_QUEUE,
    Buffer.from(JSON.stringify(data)),
    { persistent: true }
  );
};

// module.exports = { connectQueue };
module.exports = {
  connectQueue,
  publishToQueue
};

