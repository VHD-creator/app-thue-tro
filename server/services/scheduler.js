import cron from 'node-cron';
import { HoaDon, HopDong, NguoiThue, Phong } from '../models/quanHe.js';
import { guiNhacNhoThanhToan } from './emailService.js';

// ✅ Chạy mỗi ngày lúc 9:00 sáng
cron.schedule('0 9 * * *', async () => {
  console.log('⏰ Kiểm tra hóa đơn chưa thanh toán...');

  try {
    // Lấy tất cả hóa đơn chưa thanh toán
    const hoaDonsChuaThanhToan = await HoaDon.findAll({
      where: { trang_thai: 0 },
      include: [{
        model: Phong,
        as: 'Phong',
        attributes: ['id_phong', 'ten_phong']
      }]
    });

    if (hoaDonsChuaThanhToan.length === 0) {
      console.log('✅ Không có hóa đơn chưa thanh toán');
      return;
    }

    console.log(`📋 Có ${hoaDonsChuaThanhToan.length} hóa đơn chưa thanh toán`);

    for (const hoaDon of hoaDonsChuaThanhToan) {
      try {
        // Tìm hợp đồng đang hoạt động của phòng → lấy người thuê
        const hopDong = await HopDong.findOne({
          where: { id_phong: hoaDon.id_phong, trang_thai: 1 },
          include: [{
            model: NguoiThue,
            as: 'NguoiThue',
            attributes: ['ho_ten', 'email']
          }]
        });

        if (hopDong?.NguoiThue?.email) {
          await guiNhacNhoThanhToan(
            hopDong.NguoiThue.email,
            hopDong.NguoiThue.ho_ten,
            hoaDon.tong_tien,
            hoaDon.thang_nam
          );
          console.log(`📧 Đã gửi nhắc nhở tới: ${hopDong.NguoiThue.email}`);
        }
      } catch (err) {
        console.error(`❌ Lỗi gửi email hóa đơn ${hoaDon.id_hoa_don}:`, err.message);
      }
    }

    console.log('✅ Hoàn thành kiểm tra hóa đơn');
  } catch (error) {
    console.error('❌ Lỗi trong scheduler:', error.message);
  }
});

console.log('⏰ Scheduler đã được khởi động');