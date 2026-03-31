import { GoogleGenerativeAI } from '@google/generative-ai';
import { Phong, ChuTro } from '../models/quanHe.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Lấy data phòng từ DB
const getContextData = async () => {
  const phongs = await Phong.findAll({
    include: [{
      model: ChuTro,
      as: 'ChuTro',
      attributes: ['ho_ten', 'so_dien_thoai', 'email', 'dia_chi']
    }],
    order: [['gia_phong', 'ASC']]
  });

  return phongs.map(p => ({
    id: p.id_phong,
    ten_phong: p.ten_phong,
    gia_phong: `${Number(p.gia_phong).toLocaleString('vi-VN')} VND`,
    trang_thai: p.trang_thai === 0 ? 'Còn trống' : 'Đã thuê',
    mo_ta: p.mo_ta || 'Không có mô tả',
    chu_tro: p.ChuTro ? {
      ho_ten: p.ChuTro.ho_ten,
      so_dien_thoai: p.ChuTro.so_dien_thoai,
      email: p.ChuTro.email,
      dia_chi: p.ChuTro.dia_chi
    } : null
  }));
};

export const processMessageGemini = async (message, chatHistory = []) => {
  try {
    const phongData = await getContextData();

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const systemPrompt = `Bạn là chatbot hỗ trợ tìm phòng trọ, trả lời bằng tiếng Việt, ngắn gọn và thân thiện.

Dữ liệu phòng hiện tại trong hệ thống:
${JSON.stringify(phongData, null, 2)}

Quy tắc:
- Chỉ tư vấn dựa trên dữ liệu phòng trên, KHÔNG bịa thêm
- Khi khách hỏi tìm phòng → lọc theo yêu cầu (giá, trạng thái)
- Khi khách hỏi liên hệ → cung cấp SĐT/email của chủ trọ từ data
- Khi không có phòng phù hợp → thông báo lịch sự và gợi ý thay thế
- Dùng emoji cho thân thiện
- Trả lời ngắn gọn, không dài dòng`;

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: 'Xin chào! 👋 Mình là trợ lý tìm phòng trọ. Bạn cần tìm phòng hay cần hỗ trợ gì?' }]
        },
        ...chatHistory
      ]
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    return { reply };

  } catch (error) {
    throw new Error(`Gemini error: ${error.message}`);
  }
};