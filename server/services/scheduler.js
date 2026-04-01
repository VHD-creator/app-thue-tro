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

// Reset phòng "Hết hợp đồng" (4) về "Trống" (0) vào ngày 1 hàng tháng
cron.schedule('0 0 1 * *', async () => {
  console.log('Đang chạy tác vụ tự động reset trạng thái phòng...');
  try {
    const Phong = (await import('../models/Phong.js')).default;
    const [updatedCount] = await Phong.update(
      { trang_thai: 0 },
      { where: { trang_thai: 4 } }
    );
    console.log(`Đã reset ${updatedCount} phòng từ "Hết hợp đồng" về "Trống".`);
  } catch (error) {
    console.error('Lỗi khi reset trạng thái phòng:', error);
  }
});

// Tự động hủy hợp đồng chờ cọc quá 3 ngày
// Chạy hàng ngày lúc 01:00 sáng
cron.schedule('0 1 * * *', async () => {
  console.log('Đang kiểm tra các hợp đồng chờ cọc quá hạn (3 ngày)...');
  try {
    const HopDong = (await import('../models/HopDong.js')).default;
    const Phong = (await import('../models/Phong.js')).default;
    const HoaDon = (await import('../models/HoaDon.js')).default;

    const baNgayTruoc = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const hopDongsQuaHan = await HopDong.findAll({
      where: {
        trang_thai: 2, // Chờ cọc
        ngay_tao: {
          [Op.lt]: baNgayTruoc
        }
      }
    });

    console.log(`Tìm thấy ${hopDongsQuaHan.length} hợp đồng quá hạn cần hủy.`);

    for (const hd of hopDongsQuaHan) {
      // 1. Xóa các hóa đơn liên quan
      await HoaDon.destroy({ where: { id_hop_dong: hd.id_hop_dong } });

      // 2. Reset trạng thái phòng về 0 (Trống)
      await Phong.update({ trang_thai: 0 }, { where: { id_phong: hd.id_phong } });

      // 3. Xóa hợp đồng
      await hd.destroy();
      
      console.log(`Đã hủy hợp đồng #${hd.id_hop_dong} và giải phóng phòng #${hd.id_phong}`);
    }

    if (hopDongsQuaHan.length > 0) {
      console.log(`Hoàn tất hủy ${hopDongsQuaHan.length} hợp đồng quá hạn.`);
    }
  } catch (error) {
    console.error('Lỗi trong tác vụ tự động hủy hợp đồng:', error);
  }
});

console.log('⏰ Scheduler đã được khởi động');
