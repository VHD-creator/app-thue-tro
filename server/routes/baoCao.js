import express from 'express';
import PDFDocument from 'pdfkit';
import { Op } from 'sequelize';
import { HoaDon, ThanhToan, Phong, HopDong, NguoiThue } from '../models/quanHe.js';
import { verifyToken, requireChuTroOrAdmin } from '../middlewares/auth.js';

const router = express.Router();

// ✅ GET /api/baoCao/thongKe - Thống kê nhanh theo chủ trọ
router.get('/thongKe', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    let phongFilter = {};
    let hoaDonFilter = {};

    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      phongFilter.id_chu_tro = req.idChuTro;
    }

    // Thống kê phòng
    const tongPhong = await Phong.count({ where: phongFilter });
    const phongTrong = await Phong.count({ where: { ...phongFilter, trang_thai: 0 } });
    const phongDangThue = await Phong.count({ where: { ...phongFilter, trang_thai: 1 } });
    const phongChoDuyet = await Phong.count({ where: { ...phongFilter, trang_thai: 2 } });

    // Lấy danh sách id phòng để filter hóa đơn
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      const danhSachPhong = await Phong.findAll({ where: phongFilter, attributes: ['id_phong'] });
      hoaDonFilter.id_phong = danhSachPhong.map(p => p.id_phong);
    }

    // Thống kê hóa đơn
    const tongHoaDon = await HoaDon.count({ where: hoaDonFilter });
    const hoaDonChuaThanhToan = await HoaDon.count({ where: { ...hoaDonFilter, trang_thai: 0 } });
    const hoaDonDaThanhToan = await HoaDon.count({ where: { ...hoaDonFilter, trang_thai: 1 } });

    // Doanh thu tháng này
    const now = new Date();
    const thangNay = `${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    const hoaDonThangNay = await HoaDon.findAll({
      where: { ...hoaDonFilter, thang_nam: thangNay }
    });
    const doanhThuThangNay = hoaDonThangNay.reduce((sum, hd) => sum + parseFloat(hd.tong_tien || 0), 0);

    // Doanh thu đã thu (hóa đơn đã thanh toán tháng này)
    const hoaDonDaThanhToanThangNay = hoaDonThangNay.filter(hd => hd.trang_thai === 1);
    const daThus = hoaDonDaThanhToanThangNay.reduce((sum, hd) => sum + parseFloat(hd.tong_tien || 0), 0);

    // Hợp đồng đang hoạt động
    let hopDongFilter = {};
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      const danhSachPhong = await Phong.findAll({ where: phongFilter, attributes: ['id_phong'] });
      hopDongFilter.id_phong = danhSachPhong.map(p => p.id_phong);
    }
    const hopDongDangHoatDong = await HopDong.count({ where: { ...hopDongFilter, trang_thai: 1 } });

    res.json({
      phong: {
        tong: tongPhong,
        trong: phongTrong,
        dang_thue: phongDangThue,
        cho_duyet: phongChoDuyet,
        ty_le_lap_day: tongPhong > 0 ? Math.round((phongDangThue / tongPhong) * 100) : 0
      },
      hoa_don: {
        tong: tongHoaDon,
        chua_thanh_toan: hoaDonChuaThanhToan,
        da_thanh_toan: hoaDonDaThanhToan
      },
      thang_nay: {
        thang: thangNay,
        tong_can_thu: doanhThuThangNay,
        da_thu: daThus,
        con_lai: doanhThuThangNay - daThus
      },
      hop_dong_dang_hoat_dong: hopDongDangHoatDong
    });
  } catch (error) {
    console.error('Error in /api/baoCao/thongKe:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/baoCao/tongHop - Báo cáo tổng hợp
router.get('/tongHop', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    let phongFilter = {};
    let hoaDonFilter = {};
    
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      phongFilter.id_chu_tro = req.idChuTro;
      const danhSachPhong = await Phong.findAll({ where: phongFilter, attributes: ['id_phong'] });
      hoaDonFilter.id_phong = danhSachPhong.map(p => p.id_phong);
    }
    
    const tongPhong = await Phong.count({ where: phongFilter });
    const phongTrong = await Phong.count({ where: { ...phongFilter, trang_thai: 0 } });
    const phongChoThue = await Phong.count({ where: { ...phongFilter, trang_thai: 1 } });
    const phongChoDuyet = await Phong.count({ where: { ...phongFilter, trang_thai: 2 } });
    const tongHoaDon = await HoaDon.count({ where: hoaDonFilter });
    const hoaDonChuaThanhtoan = await HoaDon.count({ where: { ...hoaDonFilter, trang_thai: 0 } });
    const hoaDonDaThanhtoan = await HoaDon.count({ where: { ...hoaDonFilter, trang_thai: 1 } });

    let thanhToanFilter = {};
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      const hoaDonIds = await HoaDon.findAll({ where: hoaDonFilter, attributes: ['id_hoa_don'] });
      thanhToanFilter.id_hoa_don = hoaDonIds.map(h => h.id_hoa_don);
    }
    
    const thanhToans = await ThanhToan.findAll({ where: thanhToanFilter });
    const tongDoanhThu = thanhToans.reduce((sum, tt) => {
      const val = parseFloat(tt.so_tien || 0);
      return sum + (isNaN(val) ? 0 : val);
    }, 0);

    res.json({
      phong: { tong: tongPhong, trong: phongTrong, choThue: phongChoThue, choDuyet: phongChoDuyet },
      hoaDon: { tong: tongHoaDon, chuaThanhtoan: hoaDonChuaThanhtoan, daThanhtoan: hoaDonDaThanhtoan },
      doanhThu: tongDoanhThu,
      tongThanhToan: thanhToans.length
    });
  } catch (error) {
    console.error('Error in /api/baoCao/tongHop:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/baoCao/doanhThu - Báo cáo doanh thu theo khoảng thời gian
router.get('/doanhThu', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Vui lòng cung cấp startDate và endDate (YYYY-MM-DD)' });
    }

    let whereCondition = {
      ngay_thanh_toan: { [Op.between]: [new Date(startDate), new Date(endDate)] }
    };
    
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      const danhSachPhong = await Phong.findAll({ where: { id_chu_tro: req.idChuTro }, attributes: ['id_phong'] });
      const hoaDonIds = await HoaDon.findAll({ where: { id_phong: danhSachPhong.map(p => p.id_phong) }, attributes: ['id_hoa_don'] });
      whereCondition.id_hoa_don = hoaDonIds.map(h => h.id_hoa_don);
    }
    
    const thanhToans = await ThanhToan.findAll({
      where: whereCondition,
      include: [{ 
        model: HoaDon, as: 'HoaDon', attributes: ['id_phong'],
        include: [{ model: Phong, as: 'Phong', attributes: ['ten_phong'] }]
      }]
    });

    const tongDoanhThu = thanhToans.reduce((sum, tt) => sum + parseFloat(tt.so_tien), 0);

    res.json({ 
      tongDoanhThu,
      soLuongThanhToan: thanhToans.length,
      khoangThoiGian: `${startDate} đến ${endDate}`,
      chiTiet: thanhToans.map(tt => ({
        id: tt.id_thanh_toan,
        phong: tt.HoaDon?.Phong?.ten_phong,
        soTien: tt.so_tien,
        ngayThanhToan: tt.ngay_thanh_toan,
        hinhThuc: tt.hinh_thuc
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/baoCao/hoaDon - Xuất báo cáo hóa đơn PDF
router.get('/hoaDon', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    let whereCondition = {};
    
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      const danhSachPhong = await Phong.findAll({ where: { id_chu_tro: req.idChuTro }, attributes: ['id_phong'] });
      whereCondition.id_phong = danhSachPhong.map(p => p.id_phong);
    }
    
    const hoaDons = await HoaDon.findAll({
      where: whereCondition,
      include: [{ model: Phong, as: 'Phong', attributes: ['id_phong', 'ten_phong', 'gia_phong'] }],
      order: [['ngay_tao', 'DESC']]
    });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="bao-cao-hoa-don.pdf"');
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('BAO CAO HOA DON', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, { align: 'right' });
    doc.moveDown();

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('ID', 20, doc.y);
    doc.text('Phong', 60, doc.y);
    doc.text('Thang/Nam', 120, doc.y);
    doc.text('Tong Tien', 190, doc.y);
    doc.text('Trang Thai', 280, doc.y);
    doc.moveDown();
    doc.moveTo(20, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(9);
    hoaDons.forEach(hoaDon => {
      const trangThai = hoaDon.trang_thai === 0 ? 'Chua thanh toan' : hoaDon.trang_thai === 1 ? 'Da thanh toan' : 'No';
      doc.text(hoaDon.id_hoa_don, 20, doc.y);
      doc.text(hoaDon.Phong?.ten_phong || '', 60, doc.y);
      doc.text(hoaDon.thang_nam, 120, doc.y);
      doc.text(`${Number(hoaDon.tong_tien).toLocaleString('vi-VN')} VND`, 190, doc.y);
      doc.text(trangThai, 280, doc.y);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/baoCao/thanhToan - Xuất báo cáo thanh toán PDF
router.get('/thanhToan', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    let whereCondition = {};
    
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      const danhSachPhong = await Phong.findAll({ where: { id_chu_tro: req.idChuTro }, attributes: ['id_phong'] });
      const hoaDonIds = await HoaDon.findAll({ where: { id_phong: danhSachPhong.map(p => p.id_phong) }, attributes: ['id_hoa_don'] });
      whereCondition.id_hoa_don = hoaDonIds.map(h => h.id_hoa_don);
    }
    
    const thanhToans = await ThanhToan.findAll({
      where: whereCondition,
      include: [{ 
        model: HoaDon, as: 'HoaDon', attributes: ['id_hoa_don', 'id_phong', 'thang_nam'],
        include: [{ model: Phong, as: 'Phong', attributes: ['ten_phong'] }]
      }],
      order: [['ngay_thanh_toan', 'DESC']]
    });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="bao-cao-thanh-toan.pdf"');
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('BAO CAO THANH TOAN', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, { align: 'right' });
    doc.moveDown();

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('ID', 20, doc.y);
    doc.text('Phong', 70, doc.y);
    doc.text('Thang', 140, doc.y);
    doc.text('So Tien', 200, doc.y);
    doc.text('Ngay TT', 290, doc.y);
    doc.text('Hinh Thuc', 380, doc.y);
    doc.moveDown();
    doc.moveTo(20, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(9);
    thanhToans.forEach(tt => {
      doc.text(tt.id_thanh_toan, 20, doc.y);
      doc.text(tt.HoaDon?.Phong?.ten_phong || '', 70, doc.y);
      doc.text(tt.HoaDon?.thang_nam || '', 140, doc.y);
      doc.text(`${Number(tt.so_tien).toLocaleString('vi-VN')} VND`, 200, doc.y);
      doc.text(new Date(tt.ngay_thanh_toan).toLocaleDateString('vi-VN'), 290, doc.y);
      doc.text(tt.hinh_thuc || '', 380, doc.y);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;