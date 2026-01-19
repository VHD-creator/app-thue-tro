import express from 'express';
import NguoiThue from '../models/NguoiThue.js';

const router = express.Router();

// Lấy tất cả người thuê
router.get('/', async (req, res) => {
  try {
    const tenants = await NguoiThue.findAll({ include: ['Phong'] });
    res.json({ success: true, data: tenants });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy người thuê theo ID
router.get('/:id', async (req, res) => {
  try {
    const tenant = await NguoiThue.findByPk(req.params.id, { include: ['Phong'] });
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Người thuê không tồn tại' });
    }
    res.json({ success: true, data: tenant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Tạo người thuê mới
router.post('/', async (req, res) => {
  try {
    const tenant = await NguoiThue.create(req.body);
    res.status(201).json({ success: true, data: tenant });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Cập nhật người thuê
router.put('/:id', async (req, res) => {
  try {
    const [updated] = await NguoiThue.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      const updatedTenant = await NguoiThue.findByPk(req.params.id);
      res.json({ success: true, data: updatedTenant });
    } else {
      res.status(404).json({ success: false, message: 'Người thuê không tồn tại' });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Xóa người thuê
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await NguoiThue.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.json({ success: true, message: 'Người thuê đã được xóa' });
    } else {
      res.status(404).json({ success: false, message: 'Người thuê không tồn tại' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;