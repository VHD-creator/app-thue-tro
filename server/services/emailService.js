import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ✅ Gửi email nhắc nhở thanh toán
export const guiNhacNhoThanhToan = async (email, tenNguoiThue, soTien, thangNam) => {
  if (!email) return;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `[Nhắc nhở] Thanh toán hóa đơn tháng ${thangNam}`,
    html: `
      <h3>Kính chào ${tenNguoiThue},</h3>
      <p>Bạn có hóa đơn thuê phòng tháng <strong>${thangNam}</strong> chưa thanh toán.</p>
      <p>Số tiền cần thanh toán: <strong>${Number(soTien).toLocaleString('vi-VN')} VNĐ</strong></p>
      <p>Vui lòng thanh toán đúng hạn để tránh phát sinh thêm.</p>
      <br/>
      <p>Trân trọng,<br/>Đội ngũ Quản lý Phòng trọ</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Đã gửi email nhắc nhở tới ${email}`);
  } catch (error) {
    console.error('❌ Lỗi gửi email nhắc nhở:', error.message);
  }
};

// ✅ Gửi email thông báo hóa đơn quá hạn
export const guiThongBaoQuaHan = async (email, tenNguoiThue, soTien) => {
  if (!email) return;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '[Quan trọng] Hóa đơn thuê phòng đã quá hạn',
    html: `
      <h3>Kính chào ${tenNguoiThue},</h3>
      <p>Hóa đơn thuê phòng của bạn với số tiền <strong>${Number(soTien).toLocaleString('vi-VN')} VNĐ</strong> đã <strong style="color:red">quá hạn thanh toán</strong>.</p>
      <p>Vui lòng thanh toán ngay để tránh các biện pháp xử lý thêm.</p>
      <br/>
      <p>Trân trọng,<br/>Đội ngũ Quản lý Phòng trọ</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Đã gửi email quá hạn tới ${email}`);
  } catch (error) {
    console.error('❌ Lỗi gửi email quá hạn:', error.message);
  }
};

export const guiEmailXacThuc = async (email, hoTen, verifyUrl) => {
  if (!email || !verifyUrl) return;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '[Xác thực email] Hoàn tất đăng ký chủ trọ',
    html: `
      <h3>Xin chào ${hoTen || 'Chủ trọ'},</h3>
      <p>Cảm ơn bạn đã đăng ký làm chủ trọ trên hệ thống.</p>
      <p>Vui lòng bấm vào đường dẫn bên dưới để xác thực email và hoàn tất kích hoạt tài khoản:</p>
      <p><a href="${verifyUrl}" target="_blank">Xác thực email</a></p>
      <p>Nếu đường dẫn không hoạt động, sao chép và dán vào trình duyệt của bạn:</p>
      <p>${verifyUrl}</p>
      <br/>
      <p>Trân trọng,<br/>Đội ngũ Quản lý Phòng trọ</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Đã gửi email xác thực tới ${email}`);
  } catch (error) {
    console.error('❌ Lỗi gửi email xác thực:', error.message);
  }
};

export default transporter;