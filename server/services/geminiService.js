import { GoogleGenerativeAI } from '@google/generative-ai';
import { Op } from 'sequelize';
import { Phong, ChuTro, HoaDon, HopDong, NguoiThue } from '../models/quanHe.js';

// ✅ Lấy data phòng công khai cho khách (chỉ lấy phòng trống)
const getPublicContextData = async () => {
  const phongs = await Phong.findAll({
    where: { trang_thai: 0 },
    limit: 20,
    order: [['gia_phong', 'ASC']],
    include: [{
      model: ChuTro,
      as: 'ChuTro',
      attributes: ['ho_ten', 'so_dien_thoai', 'email', 'dia_chi']
    }]
  });

  return phongs.map(p => ({
    ten_phong: p.ten_phong,
    gia_phong: `${Number(p.gia_phong).toLocaleString('vi-VN')} VND`,
    mo_ta: p.mo_ta || 'Không có mô tả',
    chu_tro: p.ChuTro ? {
      ho_ten: p.ChuTro.ho_ten,
      so_dien_thoai: p.ChuTro.so_dien_thoai,
      dia_chi: p.ChuTro.dia_chi
    } : null
  }));
};

// ✅ Lấy data chi tiết cho Chủ trọ (Báo cáo kinh doanh)
const getLandlordContextData = async (idChuTro) => {
  const phongs = await Phong.findAll({
    where: { id_chu_tro: idChuTro, trang_thai: { [Op.ne]: -1 } }
  });

  const phongIds = phongs.map(p => p.id_phong);

  const hoaDons = await HoaDon.findAll({
    where: { id_phong: phongIds, trang_thai: 0 },
    include: [{ model: Phong, as: 'Phong', attributes: ['ten_phong'] }]
  });

  const hopDongs = await HopDong.findAll({
    where: { id_phong: phongIds, trang_thai: 1 },
    include: [{ model: NguoiThue, as: 'NguoiThue', attributes: ['ho_ten'] }]
  });

  return {
    thong_ke_phong: {
      tong_so: phongs.length,
      phong_trong: phongs.filter(p => p.trang_thai === 0).map(p => p.ten_phong),
      dang_thue: phongs.filter(p => p.trang_thai === 1).length,
      cho_duyet: phongs.filter(p => p.trang_thai === 2).length
    },
    hoa_don_chua_thu: hoaDons.map(h => ({
      phong: h.Phong?.ten_phong,
      thang: h.thang_nam,
      so_tien: `${Number(h.tong_tien).toLocaleString('vi-VN')} VND`,
      ghi_chu: h.ghi_chu
    })),
    hop_dong_dang_chay: hopDongs.length
  };
};

export const processMessageGemini = async (message, chatHistory = [], userInfo = {}) => {
  try {
    let contextData = null;
    let rolePrompt = '';

    if (userInfo.role === 'CHU_TRO' && userInfo.idChuTro) {
      contextData = await getLandlordContextData(userInfo.idChuTro);
      rolePrompt = `Bạn là TRỢ LÝ RIÊNG của Chủ trọ tên là ${userInfo.hoTen || 'Chủ trọ'}.
Dữ liệu kinh doanh hiện tại của họ:
${JSON.stringify(contextData, null, 2)}

Nhiệm vụ:
1. Báo cáo tình hình phòng (trống bao nhiêu, căn nào, bao nhiêu căn đang chờ duyệt).
2. Tổng hợp nợ nần: Liệt kê chi tiết các hóa đơn chưa thu tiền (phòng nào, bao nhiêu tiền).
3. Đưa ra lời khuyên quản lý nếu cần.
Trả lời với phong cách chuyên nghiệp, tận tâm, như một thư ký thực thụ.`;
    } else {
      contextData = await getPublicContextData();
      rolePrompt = `Bạn là trợ lý hỗ trợ TÌM PHÒNG TRỌ cho khách hàng.
Dữ liệu phòng trống hiện có:
${JSON.stringify(contextData, null, 2)}

Nhiệm vụ:
1. Giúp khách lọc phòng phù hợp theo giá và nhu cầu.
2. Cung cấp thông tin liên hệ của chủ trọ từ dữ liệu.
3. Nếu không có phòng, hãy xin lỗi và gợi ý khách quay lại sau.
Trả lời thân thiện, nhiệt tình, dùng nhiều emoji.`;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const systemPrompt = `${rolePrompt}

QUY TẮC:
- Chỉ trả lời dựa trên DỮ LIỆU ĐƯỢC CUNG CẤP. Không bịa đặt thông tin không có trong context.
- Trả lời bằng tiếng Việt, ngắn gọn, súc tích.
- Luôn giữ thái độ lịch sự.`;

    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: 'Xin chào! Tôi là trợ lý AI của hệ thống quản lý trọ. Tôi có thể giúp gì cho bạn?' }]
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