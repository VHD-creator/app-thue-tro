import NguoiThue from '../models/NguoiThue.js';
import Phong from '../models/Phong.js';

// Tạo người thuê mới
export const taoNguoiThue = async (req, res) => {
    try {
        const nguoiThue = await NguoiThue.create(req.body);
        res.status(201).json({ success: true, data: nguoiThue });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Lấy tất cả người thuê
export const layTatCaNguoiThue = async (req, res) => {
    try {
        const nguoiThues = await NguoiThue.findAll({ include: ['Phong'] });
        res.status(200).json({ success: true, data: nguoiThues });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Tạo phòng mới
export const taoPhong = async (req, res) => {
    try {
        const phong = await Phong.create(req.body);
        res.status(201).json({ success: true, data: phong });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// Lấy tất cả phòng
export const layTatCaPhong = async (req, res) => {
    try {
        const phongs = await Phong.findAll();
        res.status(200).json({ success: true, data: phongs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};