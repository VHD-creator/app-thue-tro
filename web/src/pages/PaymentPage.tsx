import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createPayment, fetchInvoiceById, fetchPaymentsByInvoice } from '../api/api';
import { Invoice, Payment } from '../types';

const PAYMENT_METHODS = ['tiền mặt', 'VietQR - Chuyển khoản'];

export default function PaymentPage() {
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
      })
      .catch(() => {});
  }, [invoiceId]);

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
      
      // Refresh payments and invoice
      const [updatedInvoice, updatedPayments] = await Promise.all([
        fetchInvoiceById(Number(invoiceId)),
        fetchPaymentsByInvoice(Number(invoiceId))
      ]);
      setInvoice(updatedInvoice);
      setPayments(updatedPayments);
      const newTotal = updatedPayments.reduce((sum, p) => sum + p.so_tien, 0);
      setTotalPaid(newTotal);
      
      setTimeout(() => navigate(`/invoices/${invoiceId}`), 1500);
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
          <p className="text-muted">Ghi nhận thanh toán mới cho hóa đơn.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        <div style={{
          padding: '16px',
          backgroundColor: isPaid ? '#ecfdf5' : '#fef3c7',
          border: `2px solid ${isPaid ? '#10b981' : '#f59e0b'}`,
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <p style={{ margin: '0 0 12px 0', fontWeight: 'bold' }}>
            {isPaid ? '✅ Hóa đơn đã thanh toán đủ' : '⏳ Hóa đơn chưa thanh toán đủ'}
          </p>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Tổng tiền:</span>
              <strong>{invoice?.tong_tien.toLocaleString() || 0} VNĐ</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
              <span>Đã thanh toán:</span>
              <strong>{totalPaid.toLocaleString()} VNĐ</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: isPaid ? '#059669' : '#dc2626' }}>
              <span>Còn lại:</span>
              <strong>{remaining.toLocaleString()} VNĐ</strong>
            </div>
          </div>
        </div>

        {/* Payment History */}
        {payments.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h4>Lịch sử thanh toán ({payments.length})</h4>
            <div style={{
              display: 'grid',
              gap: '8px',
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '12px'
            }}>
              {payments.map((payment) => (
                <div key={payment.id_thanh_toan} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingBottom: '8px',
                  borderBottom: '1px solid #e5e7eb'
                }}>
                  <div>
                    <strong>{payment.hinh_thuc}</strong>
                    <br />
                    <small style={{ color: '#666' }}>
                      {new Date(payment.ngay_thanh_toan).toLocaleDateString('vi-VN')}
                    </small>
                  </div>
                  <div style={{ textAlign: 'right', color: '#10b981' }}>
                    <strong>{payment.so_tien.toLocaleString()} VNĐ</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!isPaid ? (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            <div>
              <label htmlFor="amount">Số tiền cần thanh toán</label>
              <input
                id="amount"
                type="number"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder={remaining.toString()}
                max={remaining}
                required
              />
              <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                Tối đa: {remaining.toLocaleString()} VNĐ
              </small>
            </div>
            <div>
              <label htmlFor="method">Hình thức thanh toán</label>
              <select id="method" value={method} onChange={(event) => setMethod(event.target.value)}>
                {PAYMENT_METHODS.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
            {error ? <div style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</div> : null}
            {success ? <div style={{ color: '#0f766e', fontWeight: 600 }}>{success}</div> : null}
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Xác nhận thanh toán'}
            </button>
          </form>
        ) : (
          <div style={{
            padding: '16px',
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, color: '#166534' }}>
              ✅ Hóa đơn đã được thanh toán đầy đủ.
            </p>
          </div>
        )}

        <button 
          type="button" 
          className="button button-secondary"
          onClick={() => navigate(`/invoices/${invoiceId}`)}
          style={{ marginTop: '16px', width: '100%' }}
        >
          Quay lại chi tiết hóa đơn
        </button>
      </div>
    </div>
  );
}
