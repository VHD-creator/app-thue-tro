import express from 'express';
import PDFDocument from 'pdfkit';
import { Op } from 'sequelize';
import HoaDon from '../models/HoaDon.js';
import ThanhToan from '../models/ThanhToan.js';
import Phong from '../models/Phong.js';
import { verifyToken, requireChuTroOrAdmin } from '../middlewares/auth.js';

const router = express.Router();

// GET /api/baoCao/hoaDon - Xuất báo cáo hóa đơn PDF (Chủ trọ/Admin)
router.get('/hoaDon', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    let whereCondition = {};
    
    // Chủ trọ chỉ xem hóa đơn của phòng mình
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      const danhSachPhong = await Phong.findAll({
        where: { id_chu_tro: req.idChuTro },
        attributes: ['id_phong']
      });
      const idPhongs = danhSachPhong.map(p => p.id_phong);
      whereCondition.id_phong = idPhongs;
    }
    
    const hoaDons = await HoaDon.findAll({
      where: whereCondition,
      include: [
        { 
          model: Phong, 
          as: 'Phong',
          attributes: ['id_phong', 'ten_phong', 'gia_phong']
        }
      ],
      order: [['ngay_tao', 'DESC']]
    });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="bao-cao-hoa-don.pdf"');
    doc.pipe(res);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('BAO CAO HOA DON', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, { align: 'right' });
    doc.moveDown();

    // Table header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('ID', 20, doc.y);
    doc.text('Phong', 60, doc.y);
    doc.text('Thang/Nam', 120, doc.y);
    doc.text('Tong Tien', 190, doc.y);
    doc.text('Trang Thai', 280, doc.y);
    doc.moveDown();
    doc.moveTo(20, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Table rows
    doc.font('Helvetica').fontSize(9);
    hoaDons.forEach(hoaDon => {
      const trangThai = hoaDon.trang_thai === 0 ? 'Chua thanh toan' : 
                       hoaDon.trang_thai === 1 ? 'Da thanh toan' : 'No';
      
      doc.text(hoaDon.id_hoa_don, 20, doc.y);
      doc.text(hoaDon.Phong.ten_phong, 60, doc.y);
      doc.text(hoaDon.thang_nam, 120, doc.y);
      doc.text(`${hoaDon.tong_tien.toLocaleString('vi-VN')} VND`, 190, doc.y);
      doc.text(trangThai, 280, doc.y);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/baoCao/thanhToan - Xuất báo cáo thanh toán PDF (Chủ trọ/Admin)
router.get('/thanhToan', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    let whereCondition = {};
    
    // Chủ trọ chỉ xem thanh toán của phòng mình
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      const danhSachPhong = await Phong.findAll({
        where: { id_chu_tro: req.idChuTro },
        attributes: ['id_phong']
      });
      const idPhongs = danhSachPhong.map(p => p.id_phong);
      
      // Filter hóa đơn theo phòng
      const hoaDonIds = await HoaDon.findAll({
        where: { id_phong: idPhongs },
        attributes: ['id_hoa_don']
      });
      whereCondition.id_hoa_don = hoaDonIds.map(h => h.id_hoa_don);
    }
    
    const thanhToans = await ThanhToan.findAll({
      where: whereCondition,
      include: [
        { 
          model: HoaDon, 
          as: 'HoaDon',
          attributes: ['id_hoa_don', 'id_phong', 'thang_nam'],
          include: [
            { model: Phong, as: 'Phong', attributes: ['ten_phong'] }
          ]
        }
      ],
      order: [['ngay_thanh_toan', 'DESC']]
    });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="bao-cao-thanh-toan.pdf"');
    doc.pipe(res);

    // Title
    doc.fontSize(20).font('Helvetica-Bold').text('BAO CAO THANH TOAN', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Ngay xuat: ${new Date().toLocaleDateString('vi-VN')}`, { align: 'right' });
    doc.moveDown();

    // Table header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('ID', 20, doc.y);
    doc.text('Phong', 70, doc.y);
    doc.text('Hoa Don', 130, doc.y);
    doc.text('So Tien', 190, doc.y);
    doc.text('Ngay Thanh Toan', 280, doc.y);
    doc.text('Hinh Thuc', 380, doc.y);
    doc.moveDown();
    doc.moveTo(20, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Table rows
    doc.font('Helvetica').fontSize(9);
    thanhToans.forEach(thanhToan => {
      doc.text(thanhToan.id_thanh_toan, 20, doc.y);
      doc.text(thanhToan.HoaDon.Phong.ten_phong, 70, doc.y);
      doc.text(thanhToan.HoaDon.thang_nam, 130, doc.y);
      doc.text(`${thanhToan.so_tien.toLocaleString('vi-VN')} VND`, 190, doc.y);
      doc.text(new Date(thanhToan.ngay_thanh_toan).toLocaleDateString('vi-VN'), 280, doc.y);
      doc.text(thanhToan.hinh_thuc, 380, doc.y);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/baoCao/doanhThu - Báo cáo doanh thu (Chủ trọ/Admin)
router.get('/doanhThu', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Vui long cung cap startDate va endDate (YYYY-MM-DD)' 
      });
    }

    let whereCondition = {
      ngay_thanh_toan: {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      }
    };
    
    // Chủ trọ chỉ xem doanh thu của phòng mình
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      const danhSachPhong = await Phong.findAll({
        where: { id_chu_tro: req.idChuTro },
        attributes: ['id_phong']
      });
      const idPhongs = danhSachPhong.map(p => p.id_phong);
      
      const hoaDonIds = await HoaDon.findAll({
        where: { id_phong: idPhongs },
        attributes: ['id_hoa_don']
      });
      whereCondition.id_hoa_don = hoaDonIds.map(h => h.id_hoa_don);
    }
    
    const thanhToans = await ThanhToan.findAll({
      where: whereCondition,
      include: [
        { 
          model: HoaDon, 
          as: 'HoaDon',
          attributes: ['id_phong'],
          include: [{ model: Phong, as: 'Phong', attributes: ['ten_phong'] }]
        }
      ]
    });

    const tongDoanhThu = thanhToans.reduce((sum, tt) => sum + parseFloat(tt.so_tien), 0);

    res.json({ 
      tongDoanhThu: tongDoanhThu,
      soLuongThanhToan: thanhToans.length,
      khoangThoiGian: `${startDate} den ${endDate}`,
      chiTiet: thanhToans.map(tt => ({
        id: tt.id_thanh_toan,
        phong: tt.HoaDon.Phong.ten_phong,
        soTien: tt.so_tien,
        ngayThanhToan: tt.ngay_thanh_toan,
        hinhThuc: tt.hinh_thuc
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/baoCao/tongHop - Báo cáo tổng hợp (Chủ trọ/Admin)
router.get('/tongHop', verifyToken, requireChuTroOrAdmin, async (req, res) => {
  try {
    let phongFilter = {};
    let hoaDonFilter = {};
    
    // Chủ trọ chỉ xem thống kê của mình
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      phongFilter.id_chu_tro = req.idChuTro;
      
      const danhSachPhong = await Phong.findAll({
        where: phongFilter,
        attributes: ['id_phong']
      });
      const idPhongs = danhSachPhong.map(p => p.id_phong);
      hoaDonFilter.id_phong = idPhongs;
    }
    
    // Tổng phòng
    const tongPhong = await Phong.count({ where: phongFilter });
    const phongTrong = await Phong.count({ where: { ...phongFilter, trang_thai: 0 } });
    const phongChoThue = await Phong.count({ where: { ...phongFilter, trang_thai: 1 } });

    // Tổng hóa đơn
    const tongHoaDon = await HoaDon.count({ where: hoaDonFilter });
    const hoaDonChuaThanhtoan = await HoaDon.count({ where: { ...hoaDonFilter, trang_thai: 0 } });
    const hoaDonDaThanhtoan = await HoaDon.count({ where: { ...hoaDonFilter, trang_thai: 1 } });

    // Tổng doanh thu
    let thanhToanFilter = {};
    if (req.userRole === 'CHU_TRO' && req.idChuTro) {
      const hoaDonIds = await HoaDon.findAll({
        where: hoaDonFilter,
        attributes: ['id_hoa_don']
      });
      thanhToanFilter.id_hoa_don = hoaDonIds.map(h => h.id_hoa_don);
    }
    
    const thanhToans = await ThanhToan.findAll({ where: thanhToanFilter });
    const tongDoanhThu = thanhToans.reduce((sum, tt) => sum + parseFloat(tt.so_tien), 0);

    res.json({
      phong: {
        tong: tongPhong,
        trong: phongTrong,
        choThue: phongChoThue
      },
      hoaDon: {
        tong: tongHoaDon,
        chuaThanhtoan: hoaDonChuaThanhtoan,
        daThanhtoan: hoaDonDaThanhtoan
      },
      doanhThu: tongDoanhThu,
      tongThanhToan: thanhToans.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;