import express from 'express';
import PDFDocument from 'pdfkit';
import { Op } from 'sequelize';
import HoaDon from '../models/HoaDon.js';
import ThanhToan from '../models/ThanhToan.js';
import NguoiThue from '../models/NguoiThue.js';
import Phong from '../models/Phong.js';

const router = express.Router();

// Xuất báo cáo hóa đơn
router.get('/hoaDon', async (req, res) => {
  try {
    const hoaDons = await HoaDon.findAll({
      include: [
        { model: NguoiThue, as: 'NguoiThue' },
        { model: Phong, as: 'Phong' }
      ]
    });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="bao-cao-hoa-don.pdf"');
    doc.pipe(res);

    doc.fontSize(20).text('Báo Cáo Hóa Đơn', { align: 'center' });
    doc.moveDown();

    hoaDons.forEach(hoaDon => {
      doc.fontSize(12).text(`ID Hóa Đơn: ${hoaDon.id}`);
      doc.text(`Người Thuê: ${hoaDon.NguoiThue.name}`);
      doc.text(`Phòng: ${hoaDon.Phong.roomNumber}`);
      doc.text(`Số Tiền: ${hoaDon.amount} VND`);
      doc.text(`Ngày Đáo Hạn: ${hoaDon.dueDate.toDateString()}`);
      doc.text(`Trạng Thái: ${hoaDon.status}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xuất báo cáo thanh toán
router.get('/thanhToan', async (req, res) => {
  try {
    const thanhToans = await ThanhToan.findAll({
      include: [
        { model: HoaDon, as: 'HoaDon', include: [{ model: NguoiThue, as: 'NguoiThue' }] },
        { model: NguoiThue, as: 'NguoiThue' }
      ]
    });

    const doc = new PDFDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="bao-cao-thanh-toan.pdf"');
    doc.pipe(res);

    doc.fontSize(20).text('Báo Cáo Thanh Toán', { align: 'center' });
    doc.moveDown();

    thanhToans.forEach(thanhToan => {
      doc.fontSize(12).text(`ID Thanh Toán: ${thanhToan.id}`);
      doc.text(`Người Thuê: ${thanhToan.NguoiThue.name}`);
      doc.text(`Số Tiền: ${thanhToan.amount} VND`);
      doc.text(`Ngày Thanh Toán: ${thanhToan.paymentDate.toDateString()}`);
      doc.text(`Phương Thức: ${thanhToan.method}`);
      doc.moveDown();
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Báo cáo doanh thu
router.get('/doanhThu', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const thanhToans = await ThanhToan.findAll({
      where: {
        paymentDate: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      }
    });

    const tongDoanhThu = thanhToans.reduce((sum, thanhToan) => sum + parseFloat(thanhToan.amount), 0);

    res.json({ success: true, data: { tongDoanhThu, soLuongThanhToan: thanhToans.length } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;