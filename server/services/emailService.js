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

export const guiEmailQuenMatKhau = async (email, hoTen, otpCode) => {
  if (!email || !otpCode) return;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '[Khôi phục mật khẩu] Mã xác nhận của bạn',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h3 style="color: #333;">Xin chào ${hoTen || 'người dùng'},</h3>
        <p>Bạn đã yêu cầu khôi phục mật khẩu trên hệ thống Quản lý Phòng trọ.</p>
        <p>Đây là mã xác nhận của bạn (Mã có hiệu lực trong 15 phút):</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 5px; padding: 10px 20px; border: 2px dashed #007bff; border-radius: 5px; background-color: #f0f7ff;">
            ${otpCode}
          </span>
        </div>
        <p style="color: #666; font-size: 14px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này để bảo mật tài khoản.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #888; font-size: 12px; text-align: center;">Trân trọng,<br/>Đội ngũ Quản lý Phòng trọ</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Đã gửi email khôi phục mật khẩu tới ${email}`);
  } catch (error) {
    console.error('❌ Lỗi gửi email khôi phục mật khẩu:', error.message);
  }
};

export default transporter;