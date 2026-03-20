import cron from 'node-cron';
import { Op } from 'sequelize';
import HoaDon from '../models/HoaDon.js';
import NguoiThue from '../models/NguoiThue.js';
import { guiNhacNhoThanhToan, guiThongBaoQuaHan } from './emailService.js';

// Chạy hàng ngày lúc 9:00 sáng
cron.schedule('0 9 * * *', async () => {
  console.log('Kiểm tra hóa đơn cần nhắc nhở...');

  const ngayHienTai = new Date();
  const ngayMai = new Date(ngayHienTai);
  ngayMai.setDate(ngayHienTai.getDate() + 1);

  try {
    // Tìm hóa đơn đáo hạn ngày mai và chưa thanh toán
    const hoaDonsSapDaoHan = await HoaDon.findAll({
      where: {
        dueDate: {
          [Op.lte]: ngayMai,
          [Op.gte]: ngayHienTai
        },
        status: 'pending'
      },
      include: [{ model: NguoiThue, as: 'NguoiThue' }]
    });

    for (const hoaDon of hoaDonsSapDaoHan) {
      await guiNhacNhoThanhToan(
        hoaDon.NguoiThue.email,
        hoaDon.NguoiThue.name,
        hoaDon.amount,
        hoaDon.dueDate
      );
    }

    // Tìm hóa đơn đã quá hạn
    const hoaDonsQuaHan = await HoaDon.findAll({
      where: {
        dueDate: {
          [Op.lt]: ngayHienTai
        },
        status: 'pending'
      },
      include: [{ model: NguoiThue, as: 'NguoiThue' }]
    });

    for (const hoaDon of hoaDonsQuaHan) {
      // Cập nhật trạng thái thành overdue
      await HoaDon.update({ status: 'overdue' }, { where: { id: hoaDon.id } });

      await guiThongBaoQuaHan(
        hoaDon.NguoiThue.email,
        hoaDon.NguoiThue.name,
        hoaDon.amount
      );
    }

    console.log('Hoàn thành kiểm tra hóa đơn');
  } catch (error) {
    console.error('Lỗi trong scheduler:', error);
  }
});

console.log('Scheduler đã được khởi động');