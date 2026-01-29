import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Gửi email nhắc nhở thanh toán
export const guiNhacNhoThanhToan = async (email, tenNguoiThue, soTien, ngayDaoHan) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Nhắc nhở thanh toán hóa đơn thuê phòng',
    text: `Kính chào ${tenNguoiThue},

Chúng tôi nhắc nhở bạn thanh toán hóa đơn thuê phòng với số tiền ${soTien} VND, đáo hạn vào ngày ${ngayDaoHan.toDateString()}.

Vui lòng thanh toán đúng hạn để tránh phí phạt.

Trân trọng,
Đội ngũ Quản lý Cho thuê Phòng`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email nhắc nhở đã được gửi thành công');
  } catch (error) {
    console.error('Lỗi gửi email:', error);
  }
};

// Gửi email thông báo hóa đơn quá hạn
export const guiThongBaoQuaHan = async (email, tenNguoiThue, soTien) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Thông báo hóa đơn thuê phòng quá hạn',
    text: `Kính chào ${tenNguoiThue},

Hóa đơn thuê phòng của bạn với số tiền ${soTien} VND đã quá hạn thanh toán.

Vui lòng thanh toán ngay để tránh các biện pháp xử lý thêm.

Trân trọng,
Đội ngũ Quản lý Cho thuê Phòng`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email thông báo quá hạn đã được gửi thành công');
  } catch (error) {
    console.error('Lỗi gửi email:', error);
  }
};

export default transporter;