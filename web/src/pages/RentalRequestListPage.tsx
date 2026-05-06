import { useEffect, useState } from 'react';
import { fetchMyRentRequests, fetchRentRequests, cancelRentRequest, approveRentRequest, rejectRentRequest, getCurrentUser } from '../api/api';
import { RentRequest, User } from '../types';

export default function RentalRequestListPage() {
  const [requests, setRequests] = useState<RentRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);

  const [approveModal, setApproveModal] = useState<RentRequest | null>(null);
  const [rejectModal, setRejectModal] = useState<RentRequest | null>(null);

  const [ngayKetThuc, setNgayKetThuc] = useState('');
  const [tienCoc, setTienCoc] = useState('');
  const [lyDoTuChoi, setLyDoTuChoi] = useState('');

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    if (user) {
      loadRequests();
    }
  }, [user]);

  async function loadRequests() {
    setLoading(true);
    setError('');
    try {
      if (user?.vai_tro === 'NGUOI_THUE') {
        const data = await fetchMyRentRequests();
        setRequests(data);
      } else {
        const data = await fetchRentRequests();
        setRequests(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(id: number) {
    if (!window.confirm('Bạn có chắc muốn hủy yêu cầu này?')) return;
    try {
      await cancelRentRequest(id);
      await loadRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi hủy yêu cầu');
    }
  }

  async function handleApprove(e: React.FormEvent) {
    e.preventDefault();
    if (!approveModal) return;
    
    const coc = parseFloat(tienCoc);
    if (!ngayKetThuc || isNaN(coc) || coc <= 0) {
      alert('Vui lòng nhập ngày kết thúc hợp đồng và tiền cọc hợp lệ');
      return;
    }

    try {
      await approveRentRequest(approveModal.id_yeu_cau, {
        ngay_ket_thuc: ngayKetThuc,
        tien_coc: coc
      });
      setApproveModal(null);
      await loadRequests();
      alert('Đã duyệt yêu cầu và tạo hợp đồng thành công!');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi duyệt yêu cầu');
    }
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectModal) return;
    try {
      await rejectRentRequest(rejectModal.id_yeu_cau, lyDoTuChoi || 'Không phù hợp');
      setRejectModal(null);
      await loadRequests();
      alert('Đã từ chối yêu cầu.');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi từ chối yêu cầu');
    }
  }

  function getStatusLabel(status: number) {
    switch (status) {
      case 0: return <span style={{ color: '#f59e0b', fontWeight: 'bold' }}>Chờ duyệt</span>;
      case 1: return <span style={{ color: '#10b981', fontWeight: 'bold' }}>Đã duyệt</span>;
      case 2: return <span style={{ color: '#ef4444', fontWeight: 'bold' }}>Từ chối / Đã hủy</span>;
      default: return 'Không rõ';
    }
  }

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Yêu cầu thuê phòng</h2>
          <p className="text-muted">Quản lý các yêu cầu thuê phòng.</p>
        </div>
        <button type="button" className="button button-secondary" onClick={loadRequests}>
          Làm mới
        </button>
      </div>

      {error && <div className="panel" style={{ color: 'red' }}>{error}</div>}

      {loading ? (
        <div className="panel">Đang tải...</div>
      ) : (
        <div className="list-card">
          {requests.length === 0 ? (
            <div className="panel" style={{ textAlign: 'center', color: '#666' }}>Không có yêu cầu nào</div>
          ) : (
            requests.map(req => (
              <div key={req.id_yeu_cau} className="list-item">
                <div>
                  <h3>Phòng: {req.Phong?.ten_phong}</h3>
                  <div style={{ margin: '4px 0', fontSize: '0.9em', color: '#555' }}>
                    Ngày muốn bắt đầu: {new Date(req.ngay_bat_dau_mong_muon).toLocaleDateString('vi-VN')}
                  </div>
                  {user?.vai_tro !== 'NGUOI_THUE' && req.NguoiThue && (
                    <div style={{ margin: '4px 0', fontSize: '0.9em' }}>
                      <strong>Người thuê:</strong> {req.NguoiThue.ho_ten} - SĐT: {req.NguoiThue.so_dien_thoai}
                    </div>
                  )}
                  {req.ghi_chu && (
                    <div style={{ margin: '4px 0', fontSize: '0.9em', fontStyle: 'italic' }}>
                      "Ghi chú: {req.ghi_chu}"
                    </div>
                  )}
                  {req.trang_thai === 2 && req.ly_do_tu_choi && (
                    <div style={{ margin: '4px 0', fontSize: '0.9em', color: '#ef4444' }}>
                      Lý do: {req.ly_do_tu_choi}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', minWidth: '150px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    Trạng thái: {getStatusLabel(req.trang_thai)}
                  </div>
                  
                  {/* Actions for NGUOI_THUE */}
                  {user?.vai_tro === 'NGUOI_THUE' && req.trang_thai === 0 && (
                    <button className="button button-secondary" onClick={() => handleCancel(req.id_yeu_cau)}>
                      Hủy yêu cầu
                    </button>
                  )}

                  {/* Actions for CHU_TRO / ADMIN */}
                  {user?.vai_tro !== 'NGUOI_THUE' && req.trang_thai === 0 && (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                      <button className="button button-primary" onClick={() => setApproveModal(req)}>
                        Duyệt
                      </button>
                      <button className="button button-secondary" onClick={() => setRejectModal(req)}>
                        Từ chối
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal Duyệt */}
      {approveModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px', backgroundColor: 'white', padding: '24px' }}>
            <h3>Duyệt yêu cầu thuê</h3>
            <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '16px' }}>
              Việc duyệt sẽ tự động tạo Hợp đồng và Hóa đơn cọc + tháng đầu.
            </p>
            <form onSubmit={handleApprove} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label>Ngày kết thúc hợp đồng</label>
                <input type="date" value={ngayKetThuc} onChange={e => setNgayKetThuc(e.target.value)} required />
              </div>
              <div>
                <label>Tiền cọc (VNĐ)</label>
                <input type="number" value={tienCoc} onChange={e => setTienCoc(e.target.value)} required placeholder={approveModal.Phong?.gia_phong?.toString()} />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="button button-secondary" onClick={() => setApproveModal(null)}>Hủy</button>
                <button type="submit" className="button button-primary">Xác nhận duyệt</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Từ chối */}
      {rejectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px', backgroundColor: 'white', padding: '24px' }}>
            <h3>Từ chối yêu cầu</h3>
            <form onSubmit={handleReject} style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label>Lý do từ chối</label>
                <input type="text" value={lyDoTuChoi} onChange={e => setLyDoTuChoi(e.target.value)} placeholder="Nhập lý do..." />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button type="button" className="button button-secondary" onClick={() => setRejectModal(null)}>Hủy</button>
                <button type="submit" className="button button-primary" style={{ backgroundColor: '#ef4444' }}>Từ chối</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
