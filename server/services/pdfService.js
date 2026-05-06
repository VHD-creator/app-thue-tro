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
      const fontPath = path.join(__dirname, '..', 'utils', 'fonts', 'Roboto-Regular.ttf');
      if (fs.existsSync(fontPath)) {
        doc.font(fontPath);
      } else {
        console.warn('Không tìm thấy font tiếng Việt, có thể lỗi hiển thị.');
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
      doc.moveDown(2);
      
      doc.fontSize(16).text('HỢP ĐỒNG CHO THUÊ PHÒNG TRỌ', { align: 'center' });
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

      // Ký tên
      const currentY = doc.y;
      doc.text('ĐẠI DIỆN BÊN A', 100, currentY, { align: 'left' });
      doc.text('(Ký và ghi rõ họ tên)', 100, currentY + 15, { align: 'left' });

      doc.text('ĐẠI DIỆN BÊN B', 0, currentY, { align: 'right' });
      doc.text('(Ký và ghi rõ họ tên)', 0, currentY + 15, { align: 'right' });

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
