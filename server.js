import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import checkPaymentHandler from './api/check-payment.js';
import sepayWebhookHandler from './api/sepay-webhook.js';
import sendEmailHandler from './api/send-email.js';
import sendSequenceHandler from './api/send-sequence.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CostcoHealth USA Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// API Routes (Vercel Serverless Function Adapters)
app.all('/api/check-payment', async (req, res) => {
  try {
    await checkPaymentHandler(req, res);
  } catch (err) {
    console.error('Lỗi check-payment:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

app.all('/api/sepay-webhook', async (req, res) => {
  try {
    await sepayWebhookHandler(req, res);
  } catch (err) {
    console.error('Lỗi sepay-webhook:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

app.all('/api/send-email', async (req, res) => {
  try {
    await sendEmailHandler(req, res);
  } catch (err) {
    console.error('Lỗi send-email:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

app.all('/api/send-sequence', async (req, res) => {
  try {
    await sendSequenceHandler(req, res);
  } catch (err) {
    console.error('Lỗi send-sequence:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, '127.0.0.1', () => {
  console.log(`[CostcoHealth] API Server is running on http://127.0.0.1:${PORT}`);
});
