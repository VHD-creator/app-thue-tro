import dotenv from 'dotenv';
dotenv.config(); // ✅ CHỈ 1 LẦN, KHÔNG set path

import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bodyParser from 'body-parser';

import sequelize from './config/database.js';

// routes
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import phongRouter from './routes/phong.js';
import nguoiThueRouter from './routes/nguoiThue.js';
import hoaDonRouter from './routes/hoaDon.js';
import thanhToanRouter from './routes/thanhToan.js';
import baoCaoRouter from './routes/baoCao.js';
import authRoutes from './routes/auth.js';

// models & services
import './models/quanHe.js';
import './services/scheduler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

/* ================= KẾT NỐI DATABASE ================= */
console.log('DB_USER:', process.env.DB_USER);

sequelize
  .authenticate()
  .then(() => console.log(' Kết nối MySQL thành công'))
  .catch((err) => console.error(' Lỗi kết nối MySQL:', err));

/* ================= MIDDLEWARE ================= */
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

/* ================= ROUTES ================= */
app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/api/auth', authRoutes);
app.use('/api/phong', phongRouter);
app.use('/api/nguoiThue', nguoiThueRouter);
app.use('/api/hoaDon', hoaDonRouter);
app.use('/api/thanhToan', thanhToanRouter);
app.use('/api/baoCao', baoCaoRouter);

/* ================= 404 ================= */
app.use((req, res, next) => {
  next(createError(404, 'API không tồn tại'));
});

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi server',
  });
});

/* ================= START SERVER ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(` Server is running on port ${PORT}`);
});

export default app;
