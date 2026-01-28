import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' });

console.log('DB_USER:', process.env.DB_USER);

import sequelize from './config/database.js';
import indexRouter from './routes/index.js';
import usersRouter from './routes/users.js';
import adminRouter from './routes/admin.js';
import phongRouter from './routes/phong.js';
import nguoiThueRouter from './routes/nguoiThue.js';
import hoaDonRouter from './routes/hoaDon.js';
import thanhToanRouter from './routes/thanhToan.js';
import baoCaoRouter from './routes/baoCao.js';

// Import models để tạo associations
import Phong from './models/Phong.js';
import HoaDon from './models/HoaDon.js';
import ThanhToan from './models/ThanhToan.js';
import NguoiThue from './models/NguoiThue.js';
import ChuTro from './models/ChuTro.js';
import HopDong from './models/HopDong.js';
import TaiKhoan from './models/TaiKhoan.js';

import './models/quanHe.js';
import './services/scheduler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var app = express();

// Kiểm tra kết nối database
sequelize.authenticate()
  .then(() => console.log('Kết nối MySQL thành công'))
  .catch(err => console.error('Lỗi kết nối MySQL:', err));
//app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/phong', phongRouter);
app.use('/api/nguoiThue', nguoiThueRouter);
app.use('/api/hoaDon', hoaDonRouter);
app.use('/api/thanhToan', thanhToanRouter);
app.use('/api/baoCao', baoCaoRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500).json({
    success: false,
    message: err.message
  });
  
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export default app;
