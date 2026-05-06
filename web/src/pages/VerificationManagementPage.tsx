import { useEffect, useState } from 'react';
import { fetchLandlords, approveLandlord } from '../api/api';

export default function VerificationManagementPage() {
  const [landlords, setLandlords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const data = await fetchLandlords(1); // Lấy danh sách đang chờ duyệt (status=1)
      setLandlords(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: number, approve: boolean) {
    if (!window.confirm(approve ? 'Bạn có chắc chắn muốn DUYỆT tài khoản này?' : 'Bạn có chắc chắn muốn TỪ CHỐI tài khoản này?')) return;
    
    setActionLoading(id);
    try {
      await approveLandlord(id, approve);
      setLandlords(prev => prev.filter(l => l.id_chu_tro !== id));
      alert(approve ? 'Đã duyệt thành công!' : 'Đã từ chối thành công!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi thực hiện');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Duyệt hồ sơ Chủ trọ</h2>
          <p className="text-muted">Danh sách các chủ trọ đang chờ xác thực danh tính.</p>
        </div>
        <button className="button button-secondary" onClick={loadData} disabled={loading}>Làm mới</button>
      </div>

      {loading ? (
        <div className="panel">Đang tải danh sách...</div>
      ) : error ? (
        <div className="panel" style={{ color: 'red' }}>{error}</div>
      ) : landlords.length === 0 ? (
        <div className="panel text-muted">Không có yêu cầu nào đang chờ xử lý.</div>
      ) : (
        <div className="list-card">
          {landlords.map((l) => (
            <div key={l.id_chu_tro} className="list-item">
              <div>
                <h3 style={{ marginBottom: 4 }}>{l.ho_ten}</h3>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Email: {l.email}</p>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>SĐT: {l.so_dien_thoai}</p>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Địa chỉ: {l.dia_chi || 'Chưa cập nhật địa chỉ'}</p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  className="button button-primary" 
                  disabled={actionLoading === l.id_chu_tro}
                  onClick={() => handleApprove(l.id_chu_tro, true)}
                  style={{ backgroundColor: '#10b981' }}
                >
                  Duyệt
                </button>
                <button 
                  className="button button-secondary" 
                  disabled={actionLoading === l.id_chu_tro}
                  onClick={() => handleApprove(l.id_chu_tro, false)}
                  style={{ color: '#ef4444' }}
                >
                  Từ chối
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
