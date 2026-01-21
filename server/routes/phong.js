import express from 'express';
import Phong from '../models/Phong.js';

const router = express.Router();

// ✅ Danh sách phòng trống
router.get('/trong', async (req, res) => {
  try {
    const dsPhongTrong = await Phong.findAll({
      where: {
        trang_thai: 0
      }
    });

    res.json({
      success: true,
      count: dsPhongTrong.length,
      data: dsPhongTrong
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ✅ Tất cả phòng
router.get('/', async (req, res) => {
  const data = await Phong.findAll();
  res.json(data);
});

export default router;
