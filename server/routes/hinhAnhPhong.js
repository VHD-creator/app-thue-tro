import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { HinhAnhPhong, Phong } from '../models/quanHe.js';
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

// ==================== PUBLIC ====================

// GET /api/hinhAnh/phong/:id_phong - Xem ảnh của phòng
router.get('/phong/:id_phong', async (req, res) => {
  try {
    const hinhAnhs = await HinhAnhPhong.findAll({
      where: { id_phong: req.params.id_phong },
      order: [
        ['la_anh_dai_dien', 'DESC'],
        ['thu_tu', 'ASC'],
        ['ngay_upload', 'DESC']
      ]
    });
    res.json(hinhAnhs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/hinhAnh/:id_hinh_anh - Xem chi tiết 1 ảnh
router.get('/:id_hinh_anh', async (req, res) => {
  try {
    const hinhAnh = await HinhAnhPhong.findByPk(req.params.id_hinh_anh, {
      include: [{ model: Phong, as: 'Phong', attributes: ['id_phong', 'ten_phong'] }]
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

// POST /api/hinhAnh/phong/:id_phong - Upload 1 ảnh
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
        console.log("lỗi 2");
        return res.status(400).json({ error: 'Vui lòng chọn file ảnh' });
      }

      const phong = await Phong.findByPk(id_phong);
      if (!phong) {
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ error: 'Phòng không tồn tại' });
      }

      const isAnhDaiDien = la_anh_dai_dien === 'true' || la_anh_dai_dien === true;

      if (isAnhDaiDien) {
        await HinhAnhPhong.update({ la_anh_dai_dien: false }, { where: { id_phong } });
      }

      const imageUrl = `/uploads/phong/${req.file.filename}`;

      const hinhAnh = await HinhAnhPhong.create({
        id_phong,
        ten_file: req.file.originalname,
        duong_dan: imageUrl,
        loai_hinh: loai_hinh || 'khac',
        la_anh_dai_dien: isAnhDaiDien,
        thu_tu: thu_tu || 0,
        mo_ta: mo_ta || '',
        kich_thuoc: req.file.size
      });

      res.status(201).json({ message: 'Upload ảnh thành công', data: hinhAnh });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// POST /api/hinhAnh/phong/:id_phong/multiple - Upload nhiều ảnh
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
        console.log("lỗi 1");
        return res.status(400).json({ error: 'Vui lòng chọn ít nhất 1 file ảnh' });
      }

      const phong = await Phong.findByPk(id_phong);
      if (!phong) {
        req.files.forEach(file => fs.existsSync(file.path) && fs.unlinkSync(file.path));
        return res.status(404).json({ error: 'Phòng không tồn tại' });
      }

      // Bỏ ảnh đại diện cũ vì ảnh đầu tiên sẽ là đại diện
      await HinhAnhPhong.update({ la_anh_dai_dien: false }, { where: { id_phong } });

      const hinhAnhs = req.files.map((file, i) => ({
        id_phong,
        ten_file: file.originalname,
        duong_dan: `/uploads/phong/${file.filename}`,
        loai_hinh: 'khac',
        la_anh_dai_dien: i === 0,
        thu_tu: i,
        kich_thuoc: file.size
      }));

      const created = await HinhAnhPhong.bulkCreate(hinhAnhs);

      res.status(201).json({
        message: `Upload ${req.files.length} ảnh thành công`,
        data: created
      });
    } catch (error) {
      if (req.files) {
        req.files.forEach(file => fs.existsSync(file.path) && fs.unlinkSync(file.path));
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// PUT /api/hinhAnh/:id_hinh_anh/set-dai-dien - Set ảnh đại diện
// ⚠️ PHẢI đặt TRƯỚC PUT /:id_hinh_anh để tránh conflict
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

      if (req.userRole === 'CHU_TRO' && req.idChuTro) {
        if (hinhAnh.Phong.id_chu_tro !== req.idChuTro) {
          return res.status(403).json({ error: 'Bạn không có quyền thực hiện' });
        }
      }

      await HinhAnhPhong.update(
        { la_anh_dai_dien: false },
        { where: { id_phong: hinhAnh.id_phong } }
      );

      hinhAnh.la_anh_dai_dien = true;
      await hinhAnh.save();

      res.json({ message: 'Đặt ảnh đại diện thành công', data: hinhAnh });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// PUT /api/hinhAnh/:id_hinh_anh - Cập nhật thông tin ảnh
// ⚠️ PHẢI đặt SAU PUT /:id_hinh_anh/set-dai-dien
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

      if (req.userRole === 'CHU_TRO' && req.idChuTro) {
        if (hinhAnh.Phong.id_chu_tro !== req.idChuTro) {
          return res.status(403).json({ error: 'Bạn không có quyền sửa ảnh này' });
        }
      }

      const { loai_hinh, la_anh_dai_dien, mo_ta, thu_tu } = req.body;

      if (la_anh_dai_dien === true) {
        await HinhAnhPhong.update(
          { la_anh_dai_dien: false },
          { where: { id_phong: hinhAnh.id_phong } }
        );
      }

      if (loai_hinh !== undefined) hinhAnh.loai_hinh = loai_hinh;
      if (la_anh_dai_dien !== undefined) hinhAnh.la_anh_dai_dien = la_anh_dai_dien;
      if (mo_ta !== undefined) hinhAnh.mo_ta = mo_ta;
      if (thu_tu !== undefined) hinhAnh.thu_tu = thu_tu;

      await hinhAnh.save();

      res.json({ message: 'Cập nhật thông tin ảnh thành công', data: hinhAnh });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE /api/hinhAnh/phong/:id_phong - Xóa tất cả ảnh của phòng
// ⚠️ PHẢI đặt TRƯỚC DELETE /:id_hinh_anh để tránh conflict
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

      hinhAnhs.forEach(hinhAnh => {
        const filePath = path.join(__dirname, '..', hinhAnh.duong_dan);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      });

      await HinhAnhPhong.destroy({ where: { id_phong: req.params.id_phong } });

      res.json({ message: `Xóa ${hinhAnhs.length} ảnh thành công`, count: hinhAnhs.length });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// DELETE /api/hinhAnh/:id_hinh_anh - Xóa 1 ảnh
// ⚠️ PHẢI đặt SAU DELETE /phong/:id_phong
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

      if (req.userRole === 'CHU_TRO' && req.idChuTro) {
        if (hinhAnh.Phong.id_chu_tro !== req.idChuTro) {
          return res.status(403).json({ error: 'Bạn không có quyền xóa ảnh này' });
        }
      }

      const filePath = path.join(__dirname, '..', hinhAnh.duong_dan);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await hinhAnh.destroy();

      res.json({ message: 'Xóa ảnh thành công', id_hinh_anh: parseInt(req.params.id_hinh_anh) });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

export default router;