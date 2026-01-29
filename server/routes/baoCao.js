import express from 'express';
import PDFDocument from 'pdfkit';
import { Op } from 'sequelize';
import HoaDon from '../models/HoaDon.js';
import ThanhToan from '../models/ThanhToan.js';
import NguoiThue from '../models/NguoiThue.js';
import Phong from '../models/Phong.js';
import TaiKhoan from '../models/TaiKhoan.js';

const router = express.Router();


// Middleware: Check admin role
const checkAdminRole = async (req, res, next) => {
  try {
    const taiKhoan = await TaiKhoan.findByPk(req.session.userId);
    if (!taiKhoan || taiKhoan.vai_tro !== 'ADMIN') {
      return res.status(403).json({ error: 'Chỉ admin mới có quyền' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/baoCao/hoaDon - Xuất báo cáo hóa đơn PDF (admin)
router.get('/hoaDon', checkAdminRole, async (req, res) => {
  try {
    const hoaDons = await HoaDon.findAll({
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
    doc.fontSize(20).font('Helvetica-Bold').text('BÁNG CÁO HÓA ĐƠN', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, { align: 'right' });
    doc.moveDown();

    // Table header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('ID', 20, doc.y);
    doc.text('Phòng', 60, doc.y);
    doc.text('Tháng/Năm', 120, doc.y);
    doc.text('Tổng Tiền', 190, doc.y);
    doc.text('Trạng Thái', 280, doc.y);
    doc.moveDown();
    doc.moveTo(20, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(5);

    // Table rows
    doc.font('Helvetica').fontSize(9);
    hoaDons.forEach(hoaDon => {
      const trangThai = hoaDon.trang_thai === 0 ? 'Chưa thanh toán' : 
                       hoaDon.trang_thai === 1 ? 'Đã thanh toán' : 'Nợ';
      
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

// GET /api/baoCao/thanhToan - Xuất báo cáo thanh toán PDF (admin)
router.get('/thanhToan', checkAdminRole, async (req, res) => {
  try {
    const thanhToans = await ThanhToan.findAll({
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
    doc.fontSize(20).font('Helvetica-Bold').text('BÁO CÁO THANH TOÁN', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`, { align: 'right' });
    doc.moveDown();

    // Table header
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('ID', 20, doc.y);
    doc.text('Phòng', 70, doc.y);
    doc.text('Hóa Đơn', 130, doc.y);
    doc.text('Số Tiền', 190, doc.y);
    doc.text('Ngày Thanh Toán', 280, doc.y);
    doc.text('Hình Thức', 380, doc.y);
    doc.moveDown();
    doc.moveTo(20, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(5);

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

// GET /api/baoCao/doanhThu - Báo cáo doanh thu (admin)
router.get('/doanhThu', checkAdminRole, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'Vui lòng cung cấp startDate và endDate (DD-MM-YYYY)' 
      });
    }

    const thanhToans = await ThanhToan.findAll({
      where: {
        ngay_thanh_toan: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
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
      success: true, 
      data: { 
        tongDoanhThu: tongDoanhThu.toLocaleString('vi-VN'),
        soLuongThanhToan: thanhToans.length,
        khoangThoiGian: `${startDate} đến ${endDate}`,
        chiTiet: thanhToans.map(tt => ({
          id: tt.id_thanh_toan,
          phong: tt.HoaDon.Phong.ten_phong,
          soTien: tt.so_tien,
          ngayThanhToan: tt.ngay_thanh_toan,
          hinhThuc: tt.hinh_thuc
        }))
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/baoCao/tongHop - Báo cáo tổng hợp (admin)
router.get('/tongHop', checkAdminRole, async (req, res) => {
  try {
    // Tổng phòng
    const tongPhong = await Phong.count();
    const phongTrong = await Phong.count({ where: { trang_thai: 0 } });
    const phongChoThue = await Phong.count({ where: { trang_thai: 1 } });

    // Tổng hóa đơn
    const tongHoaDon = await HoaDon.count();
    const hoaDonChaThanhtoan = await HoaDon.count({ where: { trang_thai: 0 } });
    const hoaDonDaThanhtoan = await HoaDon.count({ where: { trang_thai: 1 } });

    // Tổng doanh thu
    const thanhToans = await ThanhToan.findAll();
    const tongDoanhThu = thanhToans.reduce((sum, tt) => sum + parseFloat(tt.so_tien), 0);

    res.json({
      success: true,
      data: {
        phong: {
          tong: tongPhong,
          trong: phongTrong,
          choThue: phongChoThue
        },
        hoaDon: {
          tong: tongHoaDon,
          chaThanhtoan: hoaDonChaThanhtoan,
          daThanhtoan: hoaDonDaThanhtoan
        },
        doanhThu: tongDoanhThu.toLocaleString('vi-VN'),
        tongThanhToan: thanhToans.length
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;