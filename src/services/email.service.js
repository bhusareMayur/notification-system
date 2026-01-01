const nodemailer = require("nodemailer");
const db = require("../db/mysql");
require("dotenv").config();


const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmailAsync = async (id, email, name) => {
  try {
    await transporter.sendMail({
      from: `Notification System <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome",
      text: `Hello ${name}, welcome to our platform`
    });

    db.query(
      "UPDATE notifications SET status=? WHERE id=?",
      ["SENT", id]
    );
  } catch (err) {
    db.query(
      "UPDATE notifications SET status=? WHERE id=?",
      ["FAILED", id]
    );
  }
};

module.exports = { sendEmailAsync };
