require("dotenv").config();

const amqp = require("amqplib");
const { sendEmailAsync } = require("../services/email.service");

const QUEUE_NAME = "notifications";

const startWorker = async () => {
  const connection = await amqp.connect(process.env.RABBITMQ_URL);

  const channel = await connection.createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  console.log("Email worker connected to RabbitMQ");

  channel.consume(QUEUE_NAME, async (msg) => {
    if (!msg) return;

    const data = JSON.parse(msg.content.toString());

    await sendEmailAsync(
      data.notificationId,
      data.email,
      data.name
    );

    channel.ack(msg);
  });
};

startWorker();
