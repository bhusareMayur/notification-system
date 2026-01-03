require("dotenv").config();
const amqp = require("amqplib");

const QUEUE_NAME = "notifications";
let channel;

const connectQueue = async () => {
  if (channel) return channel;

  const connection = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log("API connected to RabbitMQ");

  return channel;
};

const publishToQueue = async (data) => {
  const ch = await connectQueue();
  ch.sendToQueue(
    QUEUE_NAME,
    Buffer.from(JSON.stringify(data)),
    { persistent: true }
  );
};

module.exports = { publishToQueue };
