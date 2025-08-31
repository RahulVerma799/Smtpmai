const express = require("express");
const nodemailer = require("nodemailer");
const multer = require("multer");
require("dotenv").config();
const cors = require("cors"); 
const { connectDb } = require("./config/config");
const cluster = require("cluster");
const os = require("os");

const numCPUs = os.cpus().length;

// Multer setup (uploads folder me file save hogi)
const upload = multer({ dest: "uploads/" });

if (cluster.isPrimary) {
  console.log(`🟢 Master process running (PID: ${process.pid})`);
  console.log(`🖥️ Spawning ${numCPUs} workers...`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`⚠️ Worker ${worker.process.pid} died. Starting new worker...`);
    cluster.fork();
  });

} else {
  const app = express();
  app.use(express.json());

  app.use(cors());

  // Connect DB
  connectDb();

  // Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  app.get("/", (req, res) => {
    res.send(`Welcome from worker PID: ${process.pid}`);
  });

  // ✅ Route for sending email with optional file
  app.post("/send", upload.single("file"), async (req, res) => {
    try {
      const { emails, subject, message } = req.body;

      if (!emails) {
        return res.status(400).send("Email list is required!");
      }

      // Agar frontend comma-separated bhej raha ho to array me convert kar lo
      const emailList = Array.isArray(emails) ? emails : emails.split(",");

      let results = [];

      for (let recipient of emailList) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: recipient.trim(),
          subject: subject || "Test Email",
          text: message || "Hello from Nodemailer!",
          attachments: req.file
            ? [{ filename: req.file.originalname, path: req.file.path }]
            : []
        };

        let info = await transporter.sendMail(mailOptions);
        console.log(`📧 Worker ${process.pid} sent to: ${recipient} | Response: ${info.response}`);

        results.push({ recipient, status: "sent", response: info.response });
      }

      console.log(`✅ Worker ${process.pid} sent ${results.length} emails!`);

      res.status(200).json({
        message: `All ${results.length} emails processed by worker ${process.pid}!`,
        results
      });

    } catch (error) {
      console.error(`❌ Worker ${process.pid} error:`, error);
      res.status(500).send("Error sending emails!");
    }
  });

  const PORT = process.env.PORT;
  app.listen(PORT, () => {
    console.log(`🚀 Worker ${process.pid} running on port ${PORT}`);
  });
}
