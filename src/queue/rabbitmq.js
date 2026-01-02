const amqp = require("amqplib");
require("dotenv").config();


const QUEUE_NAME = "notifications";

let channel;

const connectQueue = async () => {
  if (channel) return channel;

// const connection = await amqp.connect(process.env.RABBITMQ_URL);
const connection = await amqp.connect(
  "amqp://admin:admin123@127.0.0.1:5672"
);



  channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  return channel;
};

const publishToQueue = async (message) => {
  const ch = await connectQueue();
  ch.sendToQueue(
    QUEUE_NAME,
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );
};

module.exports = { publishToQueue, QUEUE_NAME };
