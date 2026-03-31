import express from 'express';
import { processMessage } from '../services/chatbotService.js';
import { verifyToken, optionalAuth } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/chatbot
// ✅ optionalAuth - đăng nhập thì tốt, không đăng nhập cũng được (chatbot công khai)
router.post('/', optionalAuth, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập tin nhắn' });
    }

    const result = await processMessage(message);
    res.json(result);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;