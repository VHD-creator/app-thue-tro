import express from 'express';
import Phong from '../models/Phong.js';
import NguoiThue from '../models/NguoiThue.js';
import { Sequelize } from 'sequelize';

const router = express.Router();

// Lấy tất cả phòng
router.get('/', async (req, res) => {
  try {
    const rooms = await Phong.findAll();
    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy phòng theo ID
router.get('/:id', async (req, res) => {
  try {
    const room = await Phong.findByPk(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
    }
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Lấy danh sách phòng trống (không có người thuê)
router.get('/trong', async (req, res) => {
  try {
    const rooms = await Phong.findAll({
      include: [{
        model: NguoiThue,
        required: false,
        attributes: []
      }],
      where: Sequelize.where(Sequelize.col('DanhSachNguoiThue.id'), null)
    });

    res.json({
      success: true,
      data: Phong
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Tạo phòng mới
router.post('/', async (req, res) => {
  try {
    const room = await Phong.create(req.body);
    res.status(201).json({ success: true, data: room });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Cập nhật phòng
router.put('/:id', async (req, res) => {
  try {
    const [updated] = await Phong.update(req.body, { where: { id: req.params.id } });
    if (updated) {
      const updatedRoom = await Phong.findByPk(req.params.id);
      res.json({ success: true, data: updatedRoom });
    } else {
      res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
    }
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// Xóa phòng
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Phong.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.json({ success: true, message: 'Phòng đã được xóa' });
    } else {
      res.status(404).json({ success: false, message: 'Phòng không tồn tại' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;