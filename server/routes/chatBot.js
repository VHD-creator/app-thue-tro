import express from 'express';
import { processMessageGemini } from '../services/geminiService.js';
import { verifyToken, optionalAuth, loadChuTro } from '../middlewares/auth.js';

const router = express.Router();

// POST /api/chatbot
// ✅ optionalAuth + loadChuTro - lấy thông tin vai trò người dùng
router.post('/', optionalAuth, loadChuTro, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Vui lòng nhập tin nhắn' });
    }

    const userInfo = {
      role: req.userRole || 'GUEST',
      idChuTro: req.idChuTro,
      hoTen: req.chuTro?.ho_ten || req.user?.ten_dang_nhap
    };

    const result = await processMessageGemini(message, [], userInfo);
    res.json(result);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;