import express from 'express';
import HoaDon from '../models/HoaDon.js';
import NguoiThue from '../models/NguoiThue.js';
import Phong from '../models/Phong.js';

const router = express.Router();

// Lấy tất cả hóa đơn
router.get('/', async (req, res) => {
  try {
    const hoaDons = await HoaDon.findAll({
      include: [
        { model: NguoiThue, as: 'NguoiThue' },
        { model: Phong, as: 'Phong' }
      ]
    });
    res.json({ success: true, data: hoaDons });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy hóa đơn theo ID
router.get('/:id', async (req, res) => {
  try {
    const hoaDon = await HoaDon.findByPk(req.params.id, {
      include: [
        { model: NguoiThue, as: 'NguoiThue' },
        { model: Phong, as: 'Phong' }
      ]
    });
    if (!hoaDon) {
      return res.status(404).json({ success: false, message: 'Hóa đơn không tồn tại' });
    }
    res.json({ success: true, data: hoaDon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tạo hóa đơn mới
router.post('/', async (req, res) => {
  try {
    const hoaDon = await HoaDon.create(req.body);
    res.status(201).json({ success: true, data: hoaDon });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Cập nhật hóa đơn
router.put('/:id', async (req, res) => {
  try {
    const [updated] = await HoaDon.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      const updatedHoaDon = await HoaDon.findByPk(req.params.id);
      res.json({ success: true, data: updatedHoaDon });
    } else {
      res.status(404).json({ success: false, message: 'Hóa đơn không tồn tại' });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Xóa hóa đơn
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await HoaDon.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.json({ success: true, message: 'Hóa đơn đã được xóa' });
    } else {
      res.status(404).json({ success: false, message: 'Hóa đơn không tồn tại' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tính toán hóa đơn tự động cho người thuê
router.post('/tinhHoaDon/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { month, year } = req.body;

    // Lấy thông tin người thuê và phòng
    const nguoiThue = await NguoiThue.findByPk(tenantId, { include: [{ model: Phong, as: 'Phong' }] });
    if (!nguoiThue) {
      return res.status(404).json({ success: false, message: 'Người thuê không tồn tại' });
    }

    const phong = nguoiThue.Phong;
    const soTien = phong.price; // Giả sử giá phòng là tiền thuê hàng tháng

    // Tạo hóa đơn mới
    const hoaDon = await HoaDon.create({
      tenantId,
      roomId: phong.id,
      amount: soTien,
      dueDate: new Date(year, month - 1, 1), // Ngày 1 của tháng
      description: `Hóa đơn thuê phòng tháng ${month}/${year}`
    });

    res.status(201).json({ success: true, data: hoaDon });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;