import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStats } from '../api/api';
import { Stats } from '../types';

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
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchStats()
      .then(setStats)
      .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được dữ liệu'))
      .finally(() => setLoading(false));
  }, []);

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
      ) : stats ? (
        <>
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <MetricCard title="Tổng phòng" value={stats.phong.tong.toString()} label="Phòng đã tạo" />
            <MetricCard title="Phòng thuê" value={stats.phong.choThue.toString()} label="Đang cho thuê" />
            <MetricCard title="Phòng trống" value={stats.phong.trong.toString()} label="Sẵn sàng" />
          </div>
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <MetricCard title="Hoá đơn chưa thu" value={stats.hoaDon.chuaThanhtoan.toString()} label="Chưa thanh toán" />
            <MetricCard title="Hoá đơn đã thu" value={stats.hoaDon.daThanhtoan.toString()} label="Đã thanh toán" />
            <MetricCard title="Doanh thu" value={`${stats.doanhThu.toLocaleString()} VNĐ`} label="Tổng doanh thu" />
          </div>
          <div className="quick-grid">
            <Link to="/rooms" className="quick-card-link">
              <div className="quick-card">
                <h3>Phòng trọ</h3>
                <p className="text-muted">Quản lý và kiểm tra trạng thái phòng</p>
              </div>
            </Link>
            <Link to="/contracts" className="quick-card-link">
              <div className="quick-card">
                <h3>Hợp đồng</h3>
                <p className="text-muted">Theo dõi hợp đồng đang hoạt động</p>
              </div>
            </Link>
            <Link to="/invoices" className="quick-card-link">
              <div className="quick-card">
                <h3>Hoá đơn</h3>
                <p className="text-muted">Giám sát thanh toán</p>
              </div>
            </Link>
            <Link to="/profile" className="quick-card-link">
              <div className="quick-card">
                <h3>Hồ sơ</h3>
                <p className="text-muted">Cập nhật thông tin và đổi mật khẩu</p>
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
