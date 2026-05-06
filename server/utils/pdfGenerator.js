import PDFDocument from 'pdfkit';

export const generateInvoicePDF = (invoiceData, stream) => {
    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(stream);

    // Font hỗ trợ tiếng Việt (Sử dụng font hệ thống hoặc đính kèm)
    // Lưu ý: PDFKit mặc định không hỗ trợ tiếng Việt có dấu, 
    // bạn cần trỏ đến một font .ttf hỗ trợ Unicode.
    // Ở đây tôi dùng font mặc định, nếu muốn đẹp hãy tải font Roboto/Inter.
    
    // Header
    doc.fontSize(20).text('HÓA ĐƠN TIỀN TRỌ', { align: 'center' });
    doc.moveDown();

    // Thông tin chung
    doc.fontSize(12).text(`Phòng: ${invoiceData.ten_phong}`);
    doc.text(`Tháng/Năm: ${invoiceData.thang_nam}`);
    doc.text(`Ngày tạo: ${new Date(invoiceData.ngay_tao).toLocaleDateString('vi-VN')}`);
    doc.moveDown();

    doc.text('--------------------------------------------------');
    doc.moveDown();

    // Chi tiết dịch vụ
    doc.text(`Tiền phòng: ${String.formatCurrency(invoiceData.tien_phong)} VNĐ`);
    doc.text(`Tiền điện (${invoiceData.so_dien_cu} - ${invoiceData.so_dien_moi}): ${String.formatCurrency(invoiceData.tien_dien)} VNĐ`);
    doc.text(`Tiền nước (${invoiceData.so_nuoc_cu} - ${invoiceData.so_nuoc_moi}): ${String.formatCurrency(invoiceData.tien_nuoc)} VNĐ`);
    doc.moveDown();

    doc.fontSize(14).text(`TỔNG CỘNG: ${String.formatCurrency(invoiceData.tong_tien)} VNĐ`, { bold: true });
    doc.moveDown();

    doc.fontSize(10).text('Trạng thái: ' + (invoiceData.trang_thai === 1 ? 'Đã thanh toán' : 'Chưa thanh toán'));
    
    doc.moveDown(2);
    doc.fontSize(12).text('Cảm ơn quý khách!', { align: 'center', italic: true });

    doc.end();
};

// Helper format currency
String.formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
};
