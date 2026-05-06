import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPayment, fetchInvoiceById, fetchPaymentsByInvoice, fetchVietQR } from '../api/api';
import { Invoice, Payment, VietQRResponse, User } from '../types';

const PAYMENT_METHODS = ['tiền mặt', 'VietQR - Chuyển khoản'];

export default function PaymentPage({ user }: { user: User }) {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalPaid, setTotalPaid] = useState(0);

  // VietQR state
  const [vietQrData, setVietQrData] = useState<VietQRResponse | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  useEffect(() => {
    if (!invoiceId) return;
    Promise.all([
      fetchInvoiceById(Number(invoiceId)),
      fetchPaymentsByInvoice(Number(invoiceId))
    ])
      .then(([invoiceData, paymentsData]) => {
        setInvoice(invoiceData);
        setPayments(paymentsData);
        const total = paymentsData.reduce((sum, p) => sum + p.so_tien, 0);
        setTotalPaid(total);
        setAmount((invoiceData.tong_tien - total).toString());
      })
      .catch(() => {});
  }, [invoiceId]);

  useEffect(() => {
    if (method === 'VietQR - Chuyển khoản' && invoiceId) {
      setQrLoading(true);
      fetchVietQR(Number(invoiceId))
        .then(data => setVietQrData(data))
        .catch(err => setError(err instanceof Error ? err.message : 'Không thể lấy thông tin VietQR'))
        .finally(() => setQrLoading(false));
    }
  }, [method, invoiceId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invoiceId) return;
    setError('');
    setSuccess('');

    const amountValue = parseFloat(amount);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      setError('Số tiền phải là số dương');
      return;
    }

    if (invoice && totalPaid + amountValue > invoice.tong_tien) {
      setError(`Tổng thanh toán (${(totalPaid + amountValue).toLocaleString()}) vượt quá tổng hóa đơn (${invoice.tong_tien.toLocaleString()})`);
      return;
    }

    setLoading(true);
    try {
      const response = await createPayment({ 
        id_hoa_don: Number(invoiceId), 
        so_tien: amountValue, 
        hinh_thuc: method 
      });
      setSuccess(response.message || 'Thanh toán thành công');
      setAmount('');
      
      // Refresh
      const [updatedInvoice, updatedPayments] = await Promise.all([
        fetchInvoiceById(Number(invoiceId)),
        fetchPaymentsByInvoice(Number(invoiceId))
      ]);
      setInvoice(updatedInvoice);
      setPayments(updatedPayments);
      const newTotal = updatedPayments.reduce((sum, p) => sum + p.so_tien, 0);
      setTotalPaid(newTotal);
      
      setTimeout(() => navigate(`/invoices/${invoiceId}`), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thanh toán');
    } finally {
      setLoading(false);
    }
  }

  const remaining = invoice ? invoice.tong_tien - totalPaid : 0;
  const isPaid = remaining <= 0;

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Thanh toán hóa đơn</h2>
          <p className="text-muted">Ghi nhận hoặc thực hiện thanh toán hóa đơn.</p>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
        <div className="card shadow-sm">
          <div style={{
            padding: '16px',
            backgroundColor: isPaid ? '#ecfdf5' : '#fef3c7',
            border: `1px solid ${isPaid ? '#10b981' : '#f59e0b'}`,
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <p style={{ margin: '0 0 12px 0', fontWeight: 'bold', fontSize: '1.1rem' }}>
              {isPaid ? '✅ Hóa đơn đã tất toán' : '⏳ Hóa đơn còn nợ'}
            </p>
            <div style={{ display: 'grid', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tổng tiền:</span>
                <strong>{invoice?.tong_tien.toLocaleString() || 0} VNĐ</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                <span>Đã trả:</span>
                <strong>{totalPaid.toLocaleString()} VNĐ</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: isPaid ? '#059669' : '#dc2626' }}>
                <span>Dư nợ:</span>
                <strong style={{ fontSize: '1.2rem' }}>{remaining.toLocaleString()} VNĐ</strong>
              </div>
            </div>
          </div>

          {!isPaid ? (
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
              <div>
                <label>Hình thức thanh toán</label>
                <select value={method} onChange={(event) => setMethod(event.target.value)}>
                  {PAYMENT_METHODS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div>
                <label>Số tiền thanh toán (VNĐ)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder={remaining.toString()}
                  max={remaining}
                  required
                />
              </div>
              
              {error && <div style={{ color: '#b91c1c', padding: '8px', backgroundColor: '#fef2f2', borderRadius: 4 }}>{error}</div>}
              {success && <div style={{ color: '#0f766e', padding: '8px', backgroundColor: '#f0fdf4', borderRadius: 4 }}>{success}</div>}
              
              <button type="submit" className="button button-primary" disabled={loading} style={{ padding: '12px' }}>
                {loading ? 'Đang xử lý...' : method.includes('VietQR') ? 'Xác nhận đã chuyển khoản' : 'Xác nhận thanh toán'}
              </button>
            </form>
          ) : (
            <div style={{ padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ margin: 0, color: '#166534' }}>✅ Hóa đơn đã hoàn tất thanh toán.</p>
            </div>
          )}

          <button 
            type="button" 
            className="button button-secondary"
            onClick={() => navigate(-1)}
            style={{ marginTop: '16px', width: '100%', border: 'none', background: 'transparent', color: '#666' }}
          >
            ← Quay lại
          </button>
        </div>

        {/* Cột QR hoặc Lịch sử */}
        <div style={{ display: 'grid', gap: 24 }}>
          {method === 'VietQR - Chuyển khoản' && !isPaid && (
            <div className="card shadow-sm" style={{ textAlign: 'center', border: '2px solid #2563eb' }}>
              <h3>Quét mã QR để thanh toán</h3>
              {qrLoading ? (
                <div style={{ padding: 40 }}>Đang tạo mã QR...</div>
              ) : vietQrData ? (
                <div style={{ marginTop: 16 }}>
                  <img 
                    src={vietQrData.thanh_toan.qr_url} 
                    alt="VietQR" 
                    style={{ maxWidth: 280, width: '100%', height: 'auto', marginBottom: 16 }}
                  />
                  <div style={{ textAlign: 'left', backgroundColor: '#f8fafc', padding: 16, borderRadius: 8, fontSize: '0.9rem' }}>
                    <p><strong>Ngân hàng:</strong> {vietQrData.thanh_toan.ma_ngan_hang}</p>
                    <p><strong>Chủ TK:</strong> {vietQrData.thanh_toan.ten_nguoi_nhan}</p>
                    <p><strong>Số TK:</strong> {vietQrData.thanh_toan.so_tai_khoan}</p>
                    <p><strong>Số tiền:</strong> <span style={{ color: '#2563eb', fontWeight: 'bold' }}>{vietQrData.thanh_toan.so_tien.toLocaleString()} VNĐ</span></p>
                    <p><strong>Nội dung:</strong> <span style={{ color: '#d97706', fontWeight: 'bold' }}>{vietQrData.thanh_toan.noi_dung}</span></p>
                    
                    <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 12 }}>
                      {vietQrData.thanh_toan.huong_dan.map((hd, idx) => (
                        <p key={idx} style={{ margin: '4px 0', fontSize: '0.8rem', color: '#64748b' }}>{hd}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="panel" style={{ color: '#b91c1c' }}>Không thể tải mã QR. Quay lại sau.</div>
              )}
            </div>
          )}

          {payments.length > 0 && (
            <div className="card shadow-sm">
              <h4 style={{ marginBottom: 16 }}>Lịch sử giao dịch</h4>
              <div style={{ display: 'grid', gap: '12px' }}>
                {payments.map((payment) => (
                  <div key={payment.id_thanh_toan} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px',
                    backgroundColor: '#f9fafb',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <strong>{payment.hinh_thuc}</strong>
                      <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{new Date(payment.ngay_thanh_toan).toLocaleString('vi-VN')}</div>
                    </div>
                    <div style={{ textAlign: 'right', color: '#10b981', fontWeight: 'bold' }}>
                      +{payment.so_tien.toLocaleString()} VNĐ
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
