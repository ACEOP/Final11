require('dotenv').config();
const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(bodyParser.json());

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("FATAL: BOT_TOKEN environment variable is required");
  process.exit(1);
}

// Create bot in webhook mode
const bot = new TelegramBot(token, { webHook: true });

// build the webhook path using token (keeps it unique)
const botPath = `/bot${token}`;

// If RENDER_EXTERNAL_URL is provided (Render sets it), use it to register webhook.
const publicUrl = process.env.RENDER_EXTERNAL_URL || process.env.BACKEND_PUBLIC_URL;
if (!publicUrl) {
  console.warn("WARN: RENDER_EXTERNAL_URL or BACKEND_PUBLIC_URL not set. You must set it in production.");
} else {
  const webhookUrl = `${publicUrl}${botPath}`;
  console.log("Setting webhook to:", webhookUrl);
  bot.setWebHook(webhookUrl).then(() => {
    console.log("Webhook set successfully");
  }).catch(err => {
    console.error("Error setting webhook:", err.message || err);
  });
}

// Webhook receiver
app.post(botPath, (req, res) => {
  try {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error("Failed to process update:", e);
    res.sendStatus(500);
  }
});

// Simple health check route
app.get('/health', (req, res) => res.json({ ok: true }));

// Telegram /start command handler
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const webAppUrl = process.env.VERCEL_FRONTEND_URL || 'https://11-gamma-six.vercel.app';
  bot.sendMessage(chatId, "Welcome to Fantasy Cricket!", {
    reply_markup: {
      keyboard: [[{ text: "Open App", web_app: { url: webAppUrl } }]],
      resize_keyboard: true
    }
  }).catch(err => console.error("sendMessage error:", err));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
