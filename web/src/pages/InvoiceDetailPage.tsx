import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { downloadInvoicePdf, fetchInvoiceById, fetchPaymentsByInvoice } from '../api/api';
import { Invoice, Payment, User } from '../types';

export default function InvoiceDetailPage({ user }: { user: User }) {
  const isTenant = user.vai_tro === 'NGUOI_THUE';
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');

    Promise.all([fetchInvoiceById(Number(id)), fetchPaymentsByInvoice(Number(id))])
      .then(([invoiceData, paymentData]) => {
        setInvoice(invoiceData);
        setPayments(paymentData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu hóa đơn'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    if (!invoice) return;
    try {
      setDownloading(true);
      const fileName = `HoaDon_${invoice.thang_nam}_Phong_${invoice.id_phong}.pdf`;
      await downloadInvoicePdf(invoice.id_hoa_don, fileName);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Chi tiết hóa đơn</h2>
          <p className="text-muted">Chi tiết hóa đơn và lịch sử thanh toán.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link className="button button-secondary" to={isTenant ? "/tenant/invoices" : "/invoices"}>
            Quay lại
          </Link>
          {invoice ? (
            <>
              <button className="button button-outline" onClick={handleDownload} disabled={downloading}>
                {downloading ? 'Đang tải...' : 'Tải PDF'}
              </button>
              {isTenant && invoice.trang_thai === 0 && (
                <button className="button button-primary" onClick={() => navigate(`/payments/${invoice.id_hoa_don}`)}>
                  Thanh toán
                </button>
              )}
              {!isTenant && (
                <Link className="button button-secondary" to={`/invoices/${invoice.id_hoa_don}/edit`}>
                  Sửa hóa đơn
                </Link>
              )}
            </>
          ) : null}
        </div>
      </div>
      {loading ? (
        <div className="panel">Đang tải hóa đơn...</div>
      ) : error ? (
        <div className="panel">{error}</div>
      ) : invoice ? (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3>Hóa đơn #{invoice.id_hoa_don}</h3>
            <p>
              <strong>Phòng:</strong> {invoice.Phong?.ten_phong || invoice.id_phong}
            </p>
            <p>
              <strong>Tháng:</strong> {invoice.thang_nam}
            </p>
            <p>
              <strong>Tổng tiền:</strong> {invoice.tong_tien.toLocaleString()} VNĐ
            </p>
            <p>
              <strong>Trạng thái:</strong> {invoice.trang_thai === 1 ? 'Đã thanh toán' : invoice.trang_thai === 2 ? 'Đang chờ xử lý' : 'Chưa thanh toán'}
            </p>
            <p>
              <strong>Chi tiết chi phí:</strong>
            </p>
            <ul>
              <li>Điện: {invoice.tien_dien?.toLocaleString() || 0} VNĐ</li>
              <li>Nước: {invoice.tien_nuoc?.toLocaleString() || 0} VNĐ</li>
              <li>Phòng: {invoice.tien_phong?.toLocaleString() || 0} VNĐ</li>
            </ul>
          </div>
          <div className="card">
            <h3>Thanh toán</h3>
            {payments.length ? (
              <div className="list-card">
                {payments.map((payment: Payment) => (
                  <div key={payment.id_thanh_toan} className="list-item">
                    <div>
                      <h4>{payment.hinh_thuc}</h4>
                      <small>{payment.ngay_thanh_toan}</small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div>{payment.so_tien.toLocaleString()} VNĐ</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel">Chưa có thanh toán.</div>
            )}
          </div>
        </>
      ) : (
        <div className="panel">Không tìm thấy hóa đơn.</div>
      )}
    </div>
  );
}
