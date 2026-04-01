import { Op } from 'sequelize';
import sequelize from './config/database.js';
import Phong from './models/Phong.js';
import HopDong from './models/HopDong.js';
import HoaDon from './models/HoaDon.js';
import ThanhToan from './models/ThanhToan.js';

const fullCleanup = async () => {
    try {
        await sequelize.authenticate();
        console.log('Đã kết nối MySQL.');

        console.log('--- Đang đồng bộ cấu trúc Database (Sync) ---');
        await sequelize.sync({ alter: true });
        console.log('Đã đồng bộ xong các cột còn thiếu (như ngay_tao).');

        console.log('--- Đang dọn dẹp toàn bộ dữ liệu giao dịch ---');

        // Phải xóa theo thứ tự để tránh lỗi khóa ngoại
        // 1. Xóa Thanh toán (ThanhToan)
        await ThanhToan.destroy({ where: {}, truncate: false });
        console.log('- Đã xóa toàn bộ Lịch sử thanh toán.');

        // 2. Xóa Hóa đơn (HoaDon)
        await HoaDon.destroy({ where: {}, truncate: false });
        console.log('- Đã xóa toàn bộ Hóa đơn.');

        // 3. Xóa Hợp đồng (HopDong)
        await HopDong.destroy({ where: {}, truncate: false });
        console.log('- Đã xóa toàn bộ Hợp đồng.');

        // 4. Reset toàn bộ trạng thái phòng về 0 (Còn trống)
        const [updatedCount] = await Phong.update(
            { trang_thai: 0 },
            { where: {} }
        );
        console.log(`- Đã reset ${updatedCount} phòng về trạng thái 'Còn trống' (0).`);

        console.log('--- DỌN DẸP HOÀN TẤT ---');
        console.log('Bây giờ bạn có thể bắt đầu thử nghiệm quy trình mới từ đầu.');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi khi cleanup:', error);
        process.exit(1);
    }
};

fullCleanup();
