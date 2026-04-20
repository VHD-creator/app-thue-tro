import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchStats, fetchMyRoom, fetchInvoices, fetchRentRequests } from '../api/api';
import { Stats, Room, Invoice, RentRequest, User } from '../types';

function MetricCard({ title, value, label, icon = '📊' }: { title: string; value: string; label: string; icon?: string }) {
  return (
    <div className="metric-card card shadow-sm">
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
      <p style={{ marginTop: 12, fontSize: '1.6rem', fontWeight: 700 }}>{value}</p>
      <p className="text-muted">{label}</p>
    </div>
  );
}

export default function DashboardPage({ user }: { user: User }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [myRoom, setMyRoom] = useState<Room | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [requests, setRequests] = useState<RentRequest[]>([]);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const isTenant = user.vai_tro === 'NGUOI_THUE';
    
    if (isTenant) {
      Promise.all([
        fetchMyRoom().catch(() => null),
        fetchInvoices().catch(() => []),
        fetchRentRequests().catch(() => [])
      ]).then(([room, invs, reqs]) => {
        setMyRoom(room);
        setInvoices(invs.filter(i => i.trang_thai === 0)); // Only unpaid
        setRequests(reqs);
      }).finally(() => setLoading(false));
    } else {
      fetchStats()
        .then(setStats)
        .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được dữ liệu'))
        .finally(() => setLoading(false));
    }
  }, [user.vai_tro]);

  if (loading) return <div className="panel animate-pulse">Đang tải dữ liệu dashboard...</div>;

  if (user.vai_tro === 'NGUOI_THUE') {
    return (
      <div className="tenant-dashboard">
        <div className="section-title">
          <div>
            <h2>Chào mừng bạn trở lại, {user.profile?.ho_ten || user.ten_dang_nhap}! 👋</h2>
            <p className="text-muted">Dưới đây là tóm tắt thông tin thuê phòng của bạn.</p>
          </div>
        </div>

        <div className="grid-3" style={{ marginBottom: 32 }}>
          <div className="card shadow-sm" style={{ padding: 24, background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)', color: 'white' }}>
            <h3 style={{ opacity: 0.9, fontSize: '0.9rem' }}>Phòng hiện tại</h3>
            {myRoom ? (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{myRoom.ten_phong}</div>
                <p style={{ marginTop: 4, opacity: 0.8 }}>{myRoom.gia_phong.toLocaleString()} VNĐ/tháng</p>
                <Link to={`/rooms/${myRoom.id_phong}`} className="button" style={{ display: 'inline-block', marginTop: 16, backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', textDecoration: 'none', fontSize: '0.85rem' }}>
                  Chi tiết phòng →
                </Link>
              </div>
            ) : (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 600 }}>Chưa thuê phòng</div>
                <Link to="/tenant/rooms" className="button" style={{ display: 'inline-block', marginTop: 16, backgroundColor: 'white', color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem' }}>
                  Tìm phòng ngay
                </Link>
              </div>
            )}
          </div>

          <MetricCard 
            title="Hóa đơn chờ" 
            value={invoices.length.toString()} 
            label="Hóa đơn chưa thanh toán" 
            icon="💰" 
          />
          
          <MetricCard 
            title="Yêu cầu" 
            value={requests.length.toString()} 
            label="Yêu cầu thuê đã gửi" 
            icon="📩" 
          />
        </div>

        <h3 style={{ marginBottom: 16 }}>Truy cập nhanh</h3>
        <div className="quick-grid">
          <Link to="/tenant/profile" className="quick-card-link">
            <div className="quick-card">
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>👤</div>
              <h4>Hồ sơ cá nhân</h4>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Cập nhật thông tin định danh</p>
            </div>
          </Link>
          <Link to="/tenant/invoices" className="quick-card-link">
            <div className="quick-card">
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>💳</div>
              <h4>Thanh toán</h4>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Xem và trả hóa đơn hàng tháng</p>
            </div>
          </Link>
          <Link to="/tenant/rent-requests" className="quick-card-link">
            <div className="quick-card">
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📑</div>
              <h4>Trạng thái thuê</h4>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Theo dõi các yêu cầu đã gửi</p>
            </div>
          </Link>
          <Link to="/tenant/contracts" className="quick-card-link">
            <div className="quick-card">
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>📜</div>
              <h4>Hợp đồng</h4>
              <p className="text-muted" style={{ fontSize: '0.8rem' }}>Xem nội dung hợp đồng thuê</p>
            </div>
          </Link>
        </div>
      </div>
    );
  }

  // Landlord Dashboard
  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Dashboard Quản lý</h2>
          <p className="text-muted">Tổng quan hệ thống và các chỉ số vận hành.</p>
        </div>
      </div>
      {error ? (
        <div className="panel">{error}</div>
      ) : stats ? (
        <>
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <MetricCard title="Tổng phòng" value={stats.phong.tong.toString()} label="Phòng đã tạo" />
            <MetricCard title="Phòng thuê" value={stats.phong.choThue.toString()} label="Đang cho thuê" />
            <MetricCard title="Phòng trống" value={stats.phong.trong.toString()} label="Sẵn sàng" />
          </div>
          <div className="grid-3" style={{ marginBottom: 24 }}>
            <MetricCard title="Hoá đơn chưa thu" value={stats.hoaDon.chuaThanhtoan.toString()} label="Chưa thanh toán" icon="⏳" />
            <MetricCard title="Hoá đơn đã thu" value={stats.hoaDon.daThanhtoan.toString()} label="Đã thanh toán" icon="✅" />
            <MetricCard title="Doanh thu" value={`${stats.doanhThu.toLocaleString()} VNĐ`} label="Tổng doanh thu" icon="📈" />
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
        <div className="panel">Chưa có dữ liệu thống kê.</div>
      )}
    </div>
  );
}
