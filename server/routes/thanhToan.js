import express from 'express';
import ThanhToan from '../models/ThanhToan.js';
import HoaDon from '../models/HoaDon.js';
import NguoiThue from '../models/NguoiThue.js';

const router = express.Router();

// Lấy tất cả thanh toán
router.get('/', async (req, res) => {
  try {
    const thanhToans = await ThanhToan.findAll({
      include: [
        { model: HoaDon, as: 'HoaDon' },
        { model: NguoiThue, as: 'NguoiThue' }
      ]
    });
    res.json({ success: true, data: thanhToans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy thanh toán theo ID
router.get('/:id', async (req, res) => {
  try {
    const thanhToan = await ThanhToan.findByPk(req.params.id, {
      include: [
        { model: HoaDon, as: 'HoaDon' },
        { model: NguoiThue, as: 'NguoiThue' }
      ]
    });
    if (!thanhToan) {
      return res.status(404).json({ success: false, message: 'Thanh toán không tồn tại' });
    }
    res.json({ success: true, data: thanhToan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tạo thanh toán mới
router.post('/', async (req, res) => {
  try {
    const thanhToan = await ThanhToan.create(req.body);

    // Cập nhật trạng thái hóa đơn thành 'paid'
    await HoaDon.update({ status: 'paid' }, { where: { id: req.body.billId } });

    res.status(201).json({ success: true, data: thanhToan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Cập nhật thanh toán
router.put('/:id', async (req, res) => {
  try {
    const [updated] = await ThanhToan.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      const updatedThanhToan = await ThanhToan.findByPk(req.params.id);
      res.json({ success: true, data: updatedThanhToan });
    } else {
      res.status(404).json({ success: false, message: 'Thanh toán không tồn tại' });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Xóa thanh toán
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await ThanhToan.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.json({ success: true, message: 'Thanh toán đã được xóa' });
    } else {
      res.status(404).json({ success: false, message: 'Thanh toán không tồn tại' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;