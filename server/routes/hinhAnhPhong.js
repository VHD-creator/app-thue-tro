import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import HinhAnhPhong from '../models/HinhAnhPhong.js';
import Phong from '../models/Phong.js';
import { 
  verifyToken,
  requireChuTroOrAdmin,
  checkPhongOwnership 
} from '../middlewares/auth.js';
import { 
  uploadSingle, 
  uploadMultiple, 
  handleUploadError 
} from '../middlewares/upload.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==================== PUBLIC ENDPOINTS ====================

// GET /api/hinhAnhPhong/phong/:id_phong - Xem ảnh của phòng (Public)
router.get('/phong/:id_phong', async (req, res) => {
  try {
    const hinhAnhs = await HinhAnhPhong.findAll({
      where: { id_phong: req.params.id_phong },
      order: [
        ['la_anh_dai_dien', 'DESC'], // Ảnh đại diện lên đầu
        ['thu_tu', 'ASC'],
        ['ngay_upload', 'DESC']
      ]
    });

    res.json(hinhAnhs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hinhAnhPhong/:id - Xem chi tiết 1 ảnh (Public)
router.get('/:id_hinh_anh', async (req, res) => {
  try {
    const hinhAnh = await HinhAnhPhong.findByPk(req.params.id_hinh_anh, {
      include: [
        { model: Phong, as: 'Phong', attributes: ['id_phong', 'ten_phong'] }
      ]
    });

    if (!hinhAnh) {
      return res.status(404).json({ error: 'Hình ảnh không tồn tại' });
    }

    res.json(hinhAnh);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== CHỦ TRỌ / ADMIN ====================

// POST /api/hinhAnhPhong/phong/:id_phong - Upload 1 ảnh
router.post('/phong/:id_phong',
  verifyToken,
  requireChuTroOrAdmin,
  checkPhongOwnership,
  uploadSingle,
  handleUploadError,
  async (req, res) => {
    try {
      const { id_phong } = req.params;
      const { loai_hinh, la_anh_dai_dien, mo_ta, thu_tu } = req.body;

      if (!req.file) {
        return res.status(400).json({ error: 'Vui lòng chọn file ảnh' });
      }

      // Kiểm tra phòng tồn tại
      const phong = await Phong.findByPk(id_phong);
      if (!phong) {
        // Xóa file đã upload
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'Phòng không tồn tại' });
      }

      // Nếu set làm ảnh đại diện, bỏ ảnh đại diện cũ
      if (la_anh_dai_dien === 'true' || la_anh_dai_dien === true) {
        await HinhAnhPhong.update(
          { la_anh_dai_dien: false },
          { where: { id_phong } }
        );
      }

      // Tạo URL để truy cập ảnh
      const imageUrl = `/uploads/phong/${req.file.filename}`;

      // Lưu thông tin ảnh vào DB
      const hinhAnh = await HinhAnhPhong.create({
        id_phong,
        ten_file: req.file.originalname,
        duong_dan: imageUrl,
        loai_hinh: loai_hinh || 'khac',
        la_anh_dai_dien: la_anh_dai_dien === 'true' || la_anh_dai_dien === true,
        thu_tu: thu_tu || 0,
        mo_ta: mo_ta || '',
        kich_thuoc: req.file.size
      });

      res.status(201).json({
        message: 'Upload ảnh thành công',
        data: hinhAnh
      });
    } catch (error) {
      // Nếu có lỗi, xóa file đã upload
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /api/hinhAnhPhong/phong/:id_phong/multiple - Upload nhiều ảnh
router.post('/phong/:id_phong/multiple',
  verifyToken,
  requireChuTroOrAdmin,
  checkPhongOwnership,
  uploadMultiple,
  handleUploadError,
  async (req, res) => {
    try {
      const { id_phong } = req.params;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'Vui lòng chọn ít nhất 1 file ảnh' });
      }

      // Kiểm tra phòng tồn tại
      const phong = await Phong.findByPk(id_phong);
      if (!phong) {
        // Xóa tất cả file đã upload
        req.files.forEach(file => fs.unlinkSync(file.path));
        return res.status(404).json({ error: 'Phòng không tồn tại' });
      }

      // Tạo array để lưu DB
      const hinhAnhs = [];
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const imageUrl = `/uploads/phong/${file.filename}`;
        
        hinhAnhs.push({
          id_phong,
          ten_file: file.originalname,
          duong_dan: imageUrl,
          loai_hinh: 'khac',
          la_anh_dai_dien: i === 0, // Ảnh đầu tiên là ảnh đại diện
          thu_tu: i,
          kich_thuoc: file.size
        });
      }

      // Nếu ảnh đầu tiên là đại diện, bỏ ảnh đại diện cũ
      if (hinhAnhs[0].la_anh_dai_dien) {
        await HinhAnhPhong.update(
          { la_anh_dai_dien: false },
          { where: { id_phong } }
        );
      }

      // Bulk insert
      const created = await HinhAnhPhong.bulkCreate(hinhAnhs);

      res.status(201).json({
        message: `Upload ${req.files.length} ảnh thành công`,
        data: created
      });
    } catch (error) {
      // Nếu có lỗi, xóa tất cả file đã upload
      if (req.files) {
        req.files.forEach(file => fs.unlinkSync(file.path));
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// PUT /api/hinhAnhPhong/:id - Cập nhật thông tin ảnh
router.put('/:id_hinh_anh',
  verifyToken,
  requireChuTroOrAdmin,
  async (req, res) => {
    try {
      const hinhAnh = await HinhAnhPhong.findByPk(req.params.id_hinh_anh, {
        include: [{ model: Phong, as: 'Phong' }]
      });

      if (!hinhAnh) {
        return res.status(404).json({ error: 'Hình ảnh không tồn tại' });
      }

      // Kiểm tra quyền sửa
      if (req.userRole === 'CHU_TRO' && req.idChuTro) {
        if (hinhAnh.Phong.id_chu_tro !== req.idChuTro) {
          return res.status(403).json({ error: 'Bạn không có quyền sửa ảnh này' });
        }
      }

      const { loai_hinh, la_anh_dai_dien, mo_ta, thu_tu } = req.body;

      // Nếu set làm ảnh đại diện, bỏ ảnh đại diện cũ
      if (la_anh_dai_dien === true) {
        await HinhAnhPhong.update(
          { la_anh_dai_dien: false },
          { where: { id_phong: hinhAnh.id_phong } }
        );
      }

      // Update
      if (loai_hinh) hinhAnh.loai_hinh = loai_hinh;
      if (la_anh_dai_dien !== undefined) hinhAnh.la_anh_dai_dien = la_anh_dai_dien;
      if (mo_ta !== undefined) hinhAnh.mo_ta = mo_ta;
      if (thu_tu !== undefined) hinhAnh.thu_tu = thu_tu;

      await hinhAnh.save();

      res.json({
        message: 'Cập nhật thông tin ảnh thành công',
        data: hinhAnh
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE /api/hinhAnhPhong/:id - Xóa ảnh
router.delete('/:id_hinh_anh',
  verifyToken,
  requireChuTroOrAdmin,
  async (req, res) => {
    try {
      const hinhAnh = await HinhAnhPhong.findByPk(req.params.id_hinh_anh, {
        include: [{ model: Phong, as: 'Phong' }]
      });

      if (!hinhAnh) {
        return res.status(404).json({ error: 'Hình ảnh không tồn tại' });
      }

      // Kiểm tra quyền xóa
      if (req.userRole === 'CHU_TRO' && req.idChuTro) {
        if (hinhAnh.Phong.id_chu_tro !== req.idChuTro) {
          return res.status(403).json({ error: 'Bạn không có quyền xóa ảnh này' });
        }
      }

      // Xóa file vật lý
      const filePath = path.join(__dirname, '..', hinhAnh.duong_dan);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Xóa record trong DB
      await hinhAnh.destroy();

      res.json({
        message: 'Xóa ảnh thành công',
        id_hinh_anh: parseInt(req.params.id_hinh_anh)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// PUT /api/hinhAnhPhong/:id/set-dai-dien - Set ảnh đại diện
router.put('/:id_hinh_anh/set-dai-dien',
  verifyToken,
  requireChuTroOrAdmin,
  async (req, res) => {
    try {
      const hinhAnh = await HinhAnhPhong.findByPk(req.params.id_hinh_anh, {
        include: [{ model: Phong, as: 'Phong' }]
      });

      if (!hinhAnh) {
        return res.status(404).json({ error: 'Hình ảnh không tồn tại' });
      }

      // Kiểm tra quyền
      if (req.userRole === 'CHU_TRO' && req.idChuTro) {
        if (hinhAnh.Phong.id_chu_tro !== req.idChuTro) {
          return res.status(403).json({ error: 'Bạn không có quyền thực hiện' });
        }
      }

      // Bỏ ảnh đại diện cũ
      await HinhAnhPhong.update(
        { la_anh_dai_dien: false },
        { where: { id_phong: hinhAnh.id_phong } }
      );

      // Set ảnh này làm đại diện
      hinhAnh.la_anh_dai_dien = true;
      await hinhAnh.save();

      res.json({
        message: 'Đặt ảnh đại diện thành công',
        data: hinhAnh
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE /api/hinhAnhPhong/phong/:id_phong - Xóa tất cả ảnh của phòng
router.delete('/phong/:id_phong',
  verifyToken,
  requireChuTroOrAdmin,
  checkPhongOwnership,
  async (req, res) => {
    try {
      const hinhAnhs = await HinhAnhPhong.findAll({
        where: { id_phong: req.params.id_phong }
      });

      if (hinhAnhs.length === 0) {
        return res.status(404).json({ error: 'Phòng chưa có ảnh nào' });
      }

      // Xóa tất cả file vật lý
      hinhAnhs.forEach(hinhAnh => {
        const filePath = path.join(__dirname, '..', hinhAnh.duong_dan);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      // Xóa records trong DB
      await HinhAnhPhong.destroy({
        where: { id_phong: req.params.id_phong }
      });

      res.json({
        message: `Xóa ${hinhAnhs.length} ảnh thành công`,
        count: hinhAnhs.length
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;