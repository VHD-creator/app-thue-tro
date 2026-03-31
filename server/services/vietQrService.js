// ==================== DANH SÁCH MÃ NGÂN HÀNG VIETQR ====================
// Nguồn: https://api.vietqr.io/v2/banks
export const DANH_SACH_NGAN_HANG = [
  { ten: 'Vietcombank', ma_bin: '970436', ten_viet_tat: 'VCB' },
  { ten: 'BIDV', ma_bin: '970418', ten_viet_tat: 'BIDV' },
  { ten: 'VietinBank', ma_bin: '970415', ten_viet_tat: 'CTG' },
  { ten: 'Agribank', ma_bin: '970405', ten_viet_tat: 'AGR' },
  { ten: 'Techcombank', ma_bin: '970407', ten_viet_tat: 'TCB' },
  { ten: 'MB Bank', ma_bin: '970422', ten_viet_tat: 'MB' },
  { ten: 'ACB', ma_bin: '970416', ten_viet_tat: 'ACB' },
  { ten: 'VPBank', ma_bin: '970432', ten_viet_tat: 'VPB' },
  { ten: 'TPBank', ma_bin: '970423', ten_viet_tat: 'TPB' },
  { ten: 'Sacombank', ma_bin: '970403', ten_viet_tat: 'STB' },
  { ten: 'HDBank', ma_bin: '970437', ten_viet_tat: 'HDB' },
  { ten: 'VIB', ma_bin: '970441', ten_viet_tat: 'VIB' },
  { ten: 'SHB', ma_bin: '970443', ten_viet_tat: 'SHB' },
  { ten: 'OCB', ma_bin: '970448', ten_viet_tat: 'OCB' },
  { ten: 'MSB', ma_bin: '970426', ten_viet_tat: 'MSB' },
  { ten: 'SeABank', ma_bin: '970440', ten_viet_tat: 'SEAB' },
  { ten: 'Eximbank', ma_bin: '970431', ten_viet_tat: 'EIB' },
  { ten: 'LienVietPostBank', ma_bin: '970449', ten_viet_tat: 'LPB' },
  { ten: 'Nam A Bank', ma_bin: '970428', ten_viet_tat: 'NAB' },
  { ten: 'Bac A Bank', ma_bin: '970409', ten_viet_tat: 'BAB' },
];

/**
 * Tạo URL QR VietQR cho thanh toán
 * Sử dụng VietQR API (miễn phí, không cần đăng ký)
 *
 * @param {string} maNganHang - Mã BIN ngân hàng (VD: 970436)
 * @param {string} soTaiKhoan - Số tài khoản
 * @param {number} soTien - Số tiền (VND)
 * @param {string} noiDung - Nội dung chuyển khoản
 * @param {string} tenNguoiNhan - Tên người nhận
 * @returns {object} - URL ảnh QR và thông tin thanh toán
 */
export const taoVietQR = (maNganHang, soTaiKhoan, soTien, noiDung, tenNguoiNhan) => {
  // Encode nội dung chuyển khoản
  const noiDungEncoded = encodeURIComponent(noiDung);
  const tenEncoded = encodeURIComponent(tenNguoiNhan);

  // ✅ VietQR API - Tạo URL ảnh QR trực tiếp (không cần API key)
  const qrUrl = `https://img.vietqr.io/image/${maNganHang}-${soTaiKhoan}-compact2.png?amount=${soTien}&addInfo=${noiDungEncoded}&accountName=${tenEncoded}`;

  return {
    qr_url: qrUrl,
    so_tai_khoan: soTaiKhoan,
    ma_ngan_hang: maNganHang,
    so_tien: soTien,
    noi_dung: noiDung,
    ten_nguoi_nhan: tenNguoiNhan
  };
};

/**
 * Tạo nội dung chuyển khoản chuẩn
 * VD: "HDTT001 THANG 01-2025"
 */
export const taoNoiDungChuyenKhoan = (idHoaDon, thangNam) => {
  return `HD${idHoaDon} THANG ${thangNam}`;
};