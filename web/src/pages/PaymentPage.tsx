import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPayment, fetchInvoiceById } from '../api/api';
import { Invoice } from '../types';

const PAYMENT_METHODS = ['tiền mặt', 'chuyển khoản', 'thẻ tín dụng', 'ví điện tử'];

export default function PaymentPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!invoiceId) return;
    fetchInvoiceById(Number(invoiceId)).then(setInvoice).catch(() => {});
  }, [invoiceId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!invoiceId) return;
    setError('');
    setSuccess('');
    setLoading(true);

    const amountValue = parseFloat(amount);
    if (Number.isNaN(amountValue) || amountValue <= 0) {
      setError('Số tiền phải là số dương');
      setLoading(false);
      return;
    }

    if (invoice && amountValue > invoice.tong_tien) {
      setError('Số tiền không được lớn hơn tổng hóa đơn');
      setLoading(false);
      return;
    }

    try {
      await createPayment({ id_hoa_don: Number(invoiceId), so_tien: amountValue, hinh_thuc: method });
      setSuccess('Thanh toán thành công. Chuyển về chi tiết hóa đơn.');
      setTimeout(() => navigate(`/invoices/${invoiceId}`), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thanh toán');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Thanh toán hóa đơn</h2>
          <p className="text-muted">Ghi nhận thanh toán mới cho hóa đơn.</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 560 }}>
        <p>
          <strong>Hóa đơn:</strong> #{invoice?.id_hoa_don}
        </p>
        <p>
          <strong>Tháng:</strong> {invoice?.thang_nam}
        </p>
        <p>
          <strong>Tổng tiền:</strong> {invoice?.tong_tien.toLocaleString() || 0} VNĐ
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16, marginTop: 16 }}>
          <div>
            <label htmlFor="amount">Số tiền</label>
            <input
              id="amount"
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder={invoice ? invoice.tong_tien.toString() : 'Nhập số tiền'}
              required
            />
          </div>
          <div>
            <label htmlFor="method">Hình thức</label>
            <select id="method" value={method} onChange={(event) => setMethod(event.target.value)}>
              {PAYMENT_METHODS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          {error ? <div style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</div> : null}
          {success ? <div style={{ color: '#0f766e', fontWeight: 600 }}>{success}</div> : null}
          <button type="submit" className="button button-primary" disabled={loading}>
            {loading ? 'Đang gửi...' : 'Xác nhận thanh toán'}
          </button>
        </form>
      </div>
    </div>
  );
}
