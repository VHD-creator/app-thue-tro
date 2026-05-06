import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchInvoices, fetchMyInvoices } from '../api/api';
import { Invoice, User } from '../types';

const statusClass = (status: number) => {
  switch (status) {
    case 1:
      return 'paid';
    case 2:
      return 'pending';
    default:
      return 'unpaid';
  }
};

export default function InvoiceListPage({ user }: { user: User }) {
  const isTenant = user.vai_tro === 'NGUOI_THUE';
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredInvoices = useMemo(
    () =>
      invoices.filter((invoice) => {
        const query = search.toLowerCase();
        return (
          invoice.id_hoa_don.toString().includes(query) ||
          invoice.id_phong.toString().includes(query) ||
          invoice.thang_nam.toLowerCase().includes(query)
        );
      }),
    [invoices, search]
  );

  useEffect(() => {
    setLoading(true);
    const apiCall = isTenant ? fetchMyInvoices() : fetchInvoices();

    apiCall
      .then(setInvoices)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Không tải được hóa đơn'))
      .finally(() => setLoading(false));
  }, [isTenant]);

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Danh sách hóa đơn</h2>
          <p className="text-muted">Xem trạng thái và tổng tiền hóa đơn.</p>
        </div>
        {!isTenant && (
          <Link className="button button-primary" to="/invoices/new">
            Thêm hóa đơn
          </Link>
        )}
      </div>
      <div className="list-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Tìm hóa đơn theo số, phòng hoặc tháng..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      {loading ? (
        <div className="panel">Đang tải hóa đơn...</div>
      ) : error ? (
        <div className="panel">{error}</div>
      ) : (
        <div className="list-card">
          {filteredInvoices.map((invoice) => (
            <Link key={invoice.id_hoa_don} to={`/invoices/${invoice.id_hoa_don}`} className="list-item list-item-link">
              <div>
                <h3>Hóa đơn #{invoice.id_hoa_don}</h3>
                <small>Phòng {invoice.id_phong} • Tháng {invoice.thang_nam}</small>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>{invoice.tong_tien.toLocaleString()} VNĐ</div>
                <div className={`status-chip ${statusClass(invoice.trang_thai)}`} style={{ marginTop: 8 }}>
                  {invoice.trang_thai === 1 ? 'Đã thanh toán' : invoice.trang_thai === 2 ? 'Đang chờ' : 'Chưa thanh toán'}
                </div>
              </div>
            </Link>
          ))}
          {filteredInvoices.length === 0 ? <div className="panel">Không có hóa đơn phù hợp.</div> : null}
        </div>
      )}
    </div>
  );
}
