import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function generateContractPdf(hopDong, chuTro, nguoiThue, phong, res) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      // Cài đặt thông tin file trả về
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=HopDongThuePhong_${hopDong.id_hop_dong}.pdf`);
      
      doc.pipe(res);

      // Load font tiếng Việt
      let fontPath = path.join(__dirname, '..', 'utils', 'fonts', 'times.ttf');
      if (!fs.existsSync(fontPath)) {
        // Thử lấy font hệ thống Windows nếu không có trong folder utils
        fontPath = 'C:\\Windows\\Fonts\\times.ttf';
      }

      if (fs.existsSync(fontPath)) {
        doc.font(fontPath);
      } else {
        const fallbackFont = path.join(__dirname, '..', 'utils', 'fonts', 'Roboto-Regular.ttf');
        if (fs.existsSync(fallbackFont)) {
          doc.font(fallbackFont);
        }
        console.warn('Không tìm thấy font Times New Roman, sử dụng font mặc định.');
      }

      // Format số tiền
      const formatCurrency = (amount) => {
        return Number(amount).toLocaleString('vi-VN') + ' VNĐ';
      };

      const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
      };

      // Header
      doc.fontSize(14).text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { align: 'center' });
      doc.fontSize(13).text('Độc lập - Tự do - Hạnh phúc', { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(12).text('-----------------------', { align: 'center' });
      doc.moveDown(1);
      
      doc.fontSize(16).font(fontPath).text('HỢP ĐỒNG CHO THUÊ PHÒNG TRỌ', { align: 'center' });
      doc.moveDown(2);

      // Hôm nay
      const now = new Date();
      doc.fontSize(12).text(`Hôm nay, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}, tại địa chỉ phòng trọ, chúng tôi gồm có:`);
      doc.moveDown(1);

      // Bên A
      doc.fontSize(13).text('BÊN A: BÊN CHO THUÊ', { underline: true });
      doc.fontSize(12).text(`Họ và tên: ${chuTro.ho_ten || '........................................'}`);
      doc.text(`Số CMND/CCCD: ${chuTro.cccd || '........................................'}`);
      doc.text(`Số điện thoại: ${chuTro.so_dien_thoai || '........................................'}`);
      if (chuTro.ten_ngan_hang && chuTro.so_tai_khoan) {
        doc.text(`Tài khoản ngân hàng: ${chuTro.so_tai_khoan} - Ngân hàng ${chuTro.ten_ngan_hang}`);
      }
      doc.moveDown(1);

      // Bên B
      doc.fontSize(13).text('BÊN B: BÊN THUÊ', { underline: true });
      doc.fontSize(12).text(`Họ và tên: ${nguoiThue.ho_ten || '........................................'}`);
      doc.text(`Số CMND/CCCD: ${nguoiThue.cccd || '........................................'}`);
      doc.text(`Số điện thoại: ${nguoiThue.so_dien_thoai || '........................................'}`);
      doc.text(`Email: ${nguoiThue.email || '........................................'}`);
      doc.moveDown(1);

      // Nội dung hợp đồng
      doc.fontSize(12).text('Hai bên thống nhất ký kết hợp đồng thuê phòng trọ với các điều khoản sau:');
      doc.moveDown(1);

      doc.fontSize(12).text('Điều 1: Thông tin phòng thuê', { underline: true });
      doc.text(`- Tên phòng: ${phong.ten_phong}`);
      doc.text(`- Giá thuê: ${formatCurrency(phong.gia_phong)}/tháng`);
      doc.text(`- Tiền đặt cọc: ${formatCurrency(hopDong.tien_coc)}`);
      doc.text(`- Thời hạn thuê: Từ ngày ${formatDate(hopDong.ngay_bat_dau)} đến ngày ${formatDate(hopDong.ngay_ket_thuc)}`);
      doc.moveDown(1);

      doc.fontSize(12).text('Điều 2: Trách nhiệm của Bên A', { underline: true });
      doc.text('- Bàn giao phòng và trang thiết bị cho Bên B đúng như thỏa thuận.');
      doc.text('- Đảm bảo các điều kiện sinh hoạt bình thường: điện, nước, an ninh.');
      doc.text('- Hướng dẫn Bên B thực hiện các quy định về đăng ký tạm trú.');
      doc.moveDown(1);

      doc.fontSize(12).text('Điều 3: Trách nhiệm của Bên B', { underline: true });
      doc.text('- Thanh toán tiền thuê phòng đúng hạn.');
      doc.text('- Sử dụng phòng đúng mục đích, không gây mất an ninh trật tự.');
      doc.text('- Giữ gìn vệ sinh chung, bảo quản trang thiết bị của phòng.');
      doc.text('- Bồi thường nếu làm hư hỏng tài sản của Bên A.');
      doc.moveDown(1);

      doc.fontSize(12).text('Điều 4: Cam kết chung', { underline: true });
      doc.text('Hai bên cam kết thực hiện đúng các điều khoản đã ghi trong hợp đồng. Nếu có tranh chấp sẽ thương lượng giải quyết trên tinh thần hợp tác.');
      doc.moveDown(2);

      // Kiểm tra khoảng trống để kí tên
      if (doc.y > 700) {
        doc.addPage();
      }

      // Ký tên
      const signatureY = doc.y;
      doc.fontSize(12).text('ĐẠI DIỆN BÊN A', 50, signatureY, { width: 250, align: 'center' });
      doc.text('(Ký và ghi rõ họ tên)', 50, signatureY + 15, { width: 250, align: 'center' });

      doc.text('ĐẠI DIỆN BÊN B', 300, signatureY, { width: 250, align: 'center' });
      doc.text('(Ký và ghi rõ họ tên)', 300, signatureY + 15, { width: 250, align: 'center' });

      // Kết thúc file
      doc.end();

      res.on('finish', () => {
        resolve(true);
      });

      res.on('error', (err) => {
        reject(err);
      });

    } catch (error) {
      reject(error);
    }
  });
}

export function generateInvoicePdf(invoiceData, res) {
  try {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    doc.pipe(res);

    // Load font tiếng Việt
    let fontPath = path.join(__dirname, '..', 'utils', 'fonts', 'times.ttf');
    if (!fs.existsSync(fontPath)) {
      fontPath = 'C:\\Windows\\Fonts\\times.ttf';
    }

    if (fs.existsSync(fontPath)) {
      doc.font(fontPath);
    } else {
      const fallbackFont = path.join(__dirname, '..', 'utils', 'fonts', 'Roboto-Regular.ttf');
      if (fs.existsSync(fallbackFont)) {
        doc.font(fallbackFont);
      }
    }

    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('vi-VN').format(Number(amount) || 0) + ' VNĐ';
    };

    const formatDate = (dateString) => {
      if (!dateString) return '';
      const d = new Date(dateString);
      return isNaN(d.getTime()) ? '' : `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    };

    // Header
    doc.fontSize(20).text('HÓA ĐƠN TIỀN TRỌ', { align: 'center' });
    doc.fontSize(12).text(`Tháng ${invoiceData.thang_nam || '--/----'}`, { align: 'center' });
    doc.moveDown(1.5);

    // Thông tin chung
    doc.fontSize(12).text(`Phòng: ${invoiceData.ten_phong || 'N/A'}`);
    doc.text(`Ngày lập: ${formatDate(invoiceData.ngay_tao || new Date())}`);
    doc.moveDown();

    doc.text('--------------------------------------------------');
    doc.moveDown();

    // Chi tiết dịch vụ (Dạng bảng)
    doc.fontSize(13).text('CHI TIẾT THANH TOÁN:', { underline: true });
    doc.moveDown(1);

    const tableTop = doc.y;
    const itemX = 50;
    const descX = 100;
    const detailX = 250;
    const amountX = 400;
    const rowHeight = 30;

    // Helper vẽ dòng kẻ ngang
    const drawLine = (y) => {
      doc.moveTo(itemX, y).lineTo(550, y).stroke();
    };

    // Header bảng
    doc.fontSize(11).font(fontPath); // Đảm bảo dùng font tiếng Việt
    doc.text('STT', itemX + 5, tableTop + 10);
    doc.text('Nội dung', descX + 5, tableTop + 10);
    doc.text('Chi tiết', detailX + 5, tableTop + 10);
    doc.text('Thành tiền', amountX + 5, tableTop + 10, { width: 145, align: 'right' });
    
    let currentY = tableTop + rowHeight;
    drawLine(tableTop);
    drawLine(currentY);

    let stt = 1;

    // Dòng 1: Tiền phòng
    doc.text(stt++, itemX + 10, currentY + 10);
    doc.text('Tiền phòng', descX + 5, currentY + 10);
    doc.text('-', detailX + 10, currentY + 10);
    doc.text(formatCurrency(invoiceData.tien_phong), amountX + 5, currentY + 10, { width: 145, align: 'right' });
    currentY += rowHeight;
    drawLine(currentY);

    // Dòng 2: Tiền điện (nếu có)
    if (Number(invoiceData.so_dien_moi) > 0) {
      doc.text(stt++, itemX + 10, currentY + 10);
      doc.text('Tiền điện', descX + 5, currentY + 10);
      doc.fontSize(9).text(`${invoiceData.so_dien_cu} -> ${invoiceData.so_dien_moi} (${Number(invoiceData.so_dien_moi) - Number(invoiceData.so_dien_cu)} kWh)`, detailX + 5, currentY + 10);
      doc.fontSize(11).text(formatCurrency(invoiceData.tien_dien), amountX + 5, currentY + 10, { width: 145, align: 'right' });
      currentY += rowHeight;
      drawLine(currentY);
    }

    // Dòng 3: Tiền nước (nếu có)
    if (Number(invoiceData.so_nuoc_moi) > 0) {
      doc.text(stt++, itemX + 10, currentY + 10);
      doc.text('Tiền nước', descX + 5, currentY + 10);
      doc.fontSize(9).text(`${invoiceData.so_nuoc_cu} -> ${invoiceData.so_nuoc_moi} (${Number(invoiceData.so_nuoc_moi) - Number(invoiceData.so_nuoc_cu)} m3)`, detailX + 5, currentY + 10);
      doc.fontSize(11).text(formatCurrency(invoiceData.tien_nuoc), amountX + 5, currentY + 10, { width: 145, align: 'right' });
      currentY += rowHeight;
      drawLine(currentY);
    }

    // Tổng cộng
    doc.moveDown(2);
    const finalY = doc.y;
    doc.fontSize(15).fillColor('#b91c1c').text('TỔNG CỘNG:', 50, finalY);
    doc.text(formatCurrency(invoiceData.tong_tien), 50, finalY, { align: 'right', width: 500 });
    doc.fillColor('#000000');
    
    doc.moveDown(1.5);
    const status = invoiceData.trang_thai === 1 ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN';
    doc.fontSize(12).fillColor(invoiceData.trang_thai === 1 ? '#059669' : '#d97706').text(`Trạng thái: ${status}`, { align: 'right', width: 500 });
    doc.fillColor('#000000');
    
    doc.moveDown(3);
    doc.fontSize(12).text('Cảm ơn quý khách!', { align: 'center', italic: true });

    doc.end();
  } catch (err) {
    console.error('Lỗi tạo PDF hóa đơn:', err);
    throw err;
  }
}
