import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';

// ✅ database.js đã tự gọi dotenv.config() bên trong
// nên không cần gọi lại ở đây
import sequelize from './config/database.js';

import phongRouter from './routes/phong.js';
import nguoiThueRouter from './routes/nguoiThue.js';
import hopDongRouter from './routes/hopDong.js';
import taiKhoanRouter from './routes/taiKhoan.js';
import hoaDonRouter from './routes/hoaDon.js';
import thanhToanRouter from './routes/thanhToan.js';
import baoCaoRouter from './routes/baoCao.js';
import authRouter from './routes/auth.js';
import hinhAnhRouter from './routes/hinhAnhPhong.js';
import chatbotRouter from './routes/chatBot.js';
import yeuCauThueRouter from './routes/yeuCauThue.js';
import vietQRRouter from './routes/vietQR.js';
import chuTroRouter from './routes/chuTro.js';

import './models/quanHe.js';
import './services/scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// ✅ CORS
app.use(cors());

// Kiểm tra kết nối database
sequelize.authenticate()
  .then(() => console.log('✅ Kết nối MySQL thành công'))
  .catch(err => console.error('❌ Lỗi kết nối MySQL:', err));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ==================== ROUTES ====================
app.use('/api/phong', phongRouter);
app.use('/api/nguoiThue', nguoiThueRouter);
app.use('/api/hopDong', hopDongRouter);
app.use('/api/taiKhoan', taiKhoanRouter);
app.use('/api/hoaDon', hoaDonRouter);
app.use('/api/thanhToan', thanhToanRouter);
app.use('/api/baoCao', baoCaoRouter);
app.use('/api/auth', authRouter);
app.use('/api/hinhAnh', hinhAnhRouter);
app.use('/api/chatbot', chatbotRouter);
app.use('/api/yeuCauThue', yeuCauThueRouter);
app.use('/api/vietqr', vietQRRouter);
app.use('/api/chuTro', chuTroRouter);

// ==================== 404 HANDLER ====================
app.use(function (req, res, next) {
  next(createError(404));
});

// ==================== ERROR HANDLER ====================
app.use(function (err, req, res, next) {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi server'
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`);
});

export default app;