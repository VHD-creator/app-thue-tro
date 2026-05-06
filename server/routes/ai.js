import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Phong } from '../models/quanHe.js';
import { verifyToken } from '../middlewares/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 1. Lấy dữ liệu phòng hiện có để làm ngữ cảnh (Context)
    const availableRooms = await Phong.findAll({
      where: { trang_thai: 0 }, // Chỉ lấy phòng trống
      attributes: ['ten_phong', 'gia_phong', 'tang', 'mo_ta']
    });

    const roomContext = availableRooms.map(p => 
      `- ${p.ten_phong}: Giá ${p.gia_phong.toLocaleString('vi-VN')} VNĐ, Tầng ${p.tang}. Mô tả: ${p.mo_ta || 'Không có'}`
    ).join('\n');

    const systemInstruction = `
      Bạn là trợ lý ảo thông minh của ứng dụng "Phòng Trọ 55". 
      Nhiệm vụ của bạn là hỗ trợ người dùng tìm phòng trọ và giải đáp các thắc mắc về dịch vụ thuê trọ.
      
      Dưới đây là danh sách các phòng đang trống hiện có:
      ${roomContext}
      
      Hãy trả lời thân thiện, ngắn gọn và hữu ích bằng tiếng Việt. 
      Nếu người dùng hỏi về phòng, hãy dựa vào danh sách trên để tư vấn.
      Nếu người dùng hỏi những câu hỏi ngoài phạm vi thuê trọ, hãy khéo léo từ chối.
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Cấu hình chat
    const chat = model.startChat({
      history: history || [],
      generationConfig: {
        maxOutputTokens: 500,
      },
    });

    // Thêm instruction vào tin nhắn đầu tiên nếu history trống
    const prompt = history && history.length > 0 ? message : `${systemInstruction}\n\nNgười dùng: ${message}`;

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ 
      reply: text,
      history: await chat.getHistory()
    });

  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ error: 'Lỗi xử lý AI: ' + error.message });
  }
});

export default router;
