import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStats, fetchContracts, fetchInvoices } from '../api/api';
import { Stats, Contract, Invoice } from '../types';
import { useAuth } from '../hooks/useAuth';

function MetricCard({ title, value, label }: { title: string; value: string; label: string }) {
  return (
    <div className="metric-card card">
      <div className="icon">📊</div>
      <h3>{title}</h3>
      <p style={{ marginTop: 12, fontSize: '1.6rem', fontWeight: 700 }}>{value}</p>
      <p className="text-muted">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user, isLandlord, isTenant, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [tenantStats, setTenantStats] = useState({
    contracts: 0,
    upcomingInvoices: 0,
    totalPaid: 0
  });
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    if (isLandlord) {
      fetchStats()
        .then(setStats)
        .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được dữ liệu'))
        .finally(() => setLoading(false));
    } else if (isTenant) {
      Promise.all([
        fetchContracts(),
        fetchInvoices()
      ]).then(([ctrs, invs]) => {
        setContracts(ctrs);
        setInvoices(invs);
        setTenantStats({
          contracts: ctrs.length,
          upcomingInvoices: invs.filter(i => i.trang_thai === 0).length,
          totalPaid: invs.filter(i => i.trang_thai !== 0).reduce((sum, i) => sum + i.tong_tien, 0)
        });
      }).catch((err) => setError(err instanceof Error ? err.message : 'Không tải được dữ liệu'))
      .finally(() => setLoading(false));
    }
  }, [user, isLandlord, isTenant]);

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Dashboard</h2>
          <p className="text-muted">Tổng quan hệ thống và báo cáo nhanh.</p>
        </div>
      </div>
      {loading ? (
        <div className="panel">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="panel">{error}</div>
      ) : isLandlord && stats ? (
        <>
          <div className="grid-3 landlord-stats" style={{ marginBottom: 24 }}>
            <MetricCard title="🏠 Tổng phòng" value={stats.phong.tong.toString()} label="Phòng đã tạo" />
            <MetricCard title="📦 Phòng thuê" value={stats.phong.choThue.toString()} label="Đang cho thuê" />
            <MetricCard title="🆓 Phòng trống" value={stats.phong.trong.toString()} label="Sẵn sàng" />
          </div>
          <div className="grid-3 landlord-stats" style={{ marginBottom: 24 }}>
            <MetricCard title="💸 Chưa thu" value={stats.hoaDon.chuaThanhtoan.toString()} label="Hóa đơn chưa thanh toán" />
            <MetricCard title="✅ Đã thu" value={stats.hoaDon.daThanhtoan.toString()} label="Hóa đơn đã thanh toán" />
            <MetricCard title="💰 Doanh thu" value={`${stats.doanhThu.toLocaleString()} VNĐ`} label="Tổng doanh thu tháng" />
          </div>
          <div className="quick-grid">
            <Link to="/rooms" className="quick-card-link">
              <div className="quick-card">
                <div className="icon">🏠</div>
                <h3>Quản lý phòng</h3>
                <p className="text-muted">Xem, thêm, sửa phòng trọ</p>
              </div>
            </Link>
            <Link to="/tenants" className="quick-card-link">
              <div className="quick-card">
                <div className="icon">👥</div>
                <h3>Người thuê</h3>
                <p className="text-muted">Quản lý danh sách khách thuê</p>
              </div>
            </Link>
            <Link to="/contracts" className="quick-card-link">
              <div className="quick-card">
                <div className="icon">📝</div>
                <h3>Hợp đồng</h3>
                <p className="text-muted">Theo dõi hợp đồng hoạt động</p>
              </div>
            </Link>
            <Link to="/invoices" className="quick-card-link">
              <div className="quick-card">
                <div className="icon">💵</div>
                <h3>Hóa đơn</h3>
                <p className="text-muted">Tạo & theo dõi thanh toán</p>
              </div>
            </Link>
          </div>
        </>
      ) : isTenant && tenantStats ? (
        <>
          <div className="section-title">
            <h2>Xin chào, {user!.profile?.ho_ten || user!.ten_dang_nhap}!</h2>
            <p className="text-muted">Tổng quan tài khoản người thuê của bạn.</p>
          </div>
          <div className="grid-3 tenant-stats" style={{ marginBottom: 24 }}>
            <MetricCard title="📝 Hợp đồng" value={tenantStats.contracts.toString()} label="Hợp đồng đang hoạt động" />
            <MetricCard title="⏰ Hóa đơn đến hạn" value={tenantStats.upcomingInvoices.toString()} label="Chưa thanh toán" />
            <MetricCard title="💰 Đã trả" value={`${tenantStats.totalPaid.toLocaleString()} VNĐ`} label="Tổng đã thanh toán" />
          </div>
          <div className="quick-grid">
            <Link to="/tenant/rooms" className="quick-card-link">
              <div className="quick-card">
                <div className="icon">🏠</div>
                <h3>Phòng của tôi</h3>
                <p className="text-muted">Xem thông tin phòng đang thuê</p>
              </div>
            </Link>
            <Link to="/tenant/contracts" className="quick-card-link">
              <div className="quick-card">
                <div className="icon">📋</div>
                <h3>Hợp đồng</h3>
                <p className="text-muted">Chi tiết hợp đồng thuê</p>
              </div>
            </Link>
            <Link to="/tenant/invoices" className="quick-card-link">
              <div className="quick-card">
                <div className="icon">💳</div>
                <h3>Thanh toán</h3>
                <p className="text-muted">Hóa đơn & thanh toán nhanh</p>
              </div>
            </Link>
            <Link to="/tenant/profile" className="quick-card-link">
              <div className="quick-card">
                <div className="icon">👤</div>
                <h3>Hồ sơ cá nhân</h3>
                <p className="text-muted">Cập nhật thông tin liên hệ</p>
              </div>
            </Link>
          </div>
        </>
      ) : (
        <div className="panel">Chưa có dữ liệu.</div>
      )}
    </div>
  );
}