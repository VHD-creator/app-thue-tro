import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchRentRequests, fetchMyRentRequests, approveRentRequest, rejectRentRequest, cancelRentRequest } from '../api/api';
import { RentRequest, User } from '../types';

interface Props {
  user: User;
}

export default function RentRequestListPage({ user }: Props) {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Landlord approve state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [endDate, setEndDate] = useState('');
  const [deposit, setDeposit] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isLandlord = user.vai_tro === 'CHU_TRO' || user.vai_tro === 'ADMIN';

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    try {
      const data = isLandlord ? await fetchRentRequests() : await fetchMyRentRequests();
      setRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách yêu cầu');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: number) {
    if (!endDate || !deposit) {
      alert('Vui lòng nhập ngày kết thúc và tiền cọc để tạo hợp đồng');
      return;
    }
    
    setSubmitting(true);
    try {
      await approveRentRequest(id, { 
        ngay_ket_thuc: endDate, 
        tien_coc: Number(deposit) 
      });
      setEditingId(null);
      loadRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi duyệt');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject(id: number) {
    const reason = prompt('Nhập lý do từ chối:');
    if (reason === null) return;
    
    try {
      await rejectRentRequest(id, reason);
      loadRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi từ chối');
    }
  }

  async function handleCancel(id: number) {
    if (!window.confirm('Bạn có chắc muốn hủy yêu cầu này?')) return;
    
    try {
      await cancelRentRequest(id);
      loadRequests();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi khi hủy');
    }
  }

  const getStatusBadge = (status: number) => {
    switch (status) {
      case 0: return <span className="badge badge-warning" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>Chờ duyệt</span>;
      case 1: return <span className="badge badge-success" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>Đã duyệt</span>;
      case 2: return <span className="badge badge-danger" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }}>Đã từ chối/Hủy</span>;
      default: return null;
    }
  };

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Quản lý yêu cầu thuê phòng</h2>
          <p className="text-muted">
            {isLandlord 
              ? 'Xem và xử lý các yêu cầu thuê phòng từ khách hàng.' 
              : 'Theo dõi trạng thái các yêu cầu thuê phòng bạn đã gửi.'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="panel">Đang tải danh sách...</div>
      ) : error ? (
        <div className="panel" style={{ color: 'red' }}>{error}</div>
      ) : requests.length === 0 ? (
        <div className="panel">Không có yêu cầu thuê nào.</div>
      ) : (
        <div className="list-card">
          {requests.map((req) => (
            <div key={req.id_yeu_cau} className="card" style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                  <h4 style={{ margin: 0 }}>Phòng: {req.Phong?.ten_phong}</h4>
                  <p style={{ margin: '4px 0', fontSize: '0.9rem' }}>
                    <strong>Người gửi:</strong> {req.NguoiThue?.ho_ten} ({req.NguoiThue?.so_dien_thoai})
                  </p>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#666' }}>
                    Ngày gửi: {new Date(req.ngay_tao).toLocaleString('vi-VN')}
                  </p>
                </div>
                <div>
                  {getStatusBadge(req.trang_thai)}
                </div>
              </div>
              
              <div style={{ marginTop: 12, padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: 4, fontSize: '0.9rem' }}>
                <p style={{ margin: '0 0 4px 0' }}><strong>Ngày muốn ở:</strong> {new Date(req.ngay_bat_dau_mong_muon).toLocaleDateString('vi-VN')}</p>
                {req.ghi_chu && <p style={{ margin: 0 }}><strong>Ghi chú:</strong> {req.ghi_chu}</p>}
                {req.ly_do_tu_choi && <p style={{ margin: '4px 0 0 0', color: '#dc2626' }}><strong>Lý do từ chối:</strong> {req.ly_do_tu_choi}</p>}
              </div>

              {req.trang_thai === 0 && (
                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                  {isLandlord ? (
                    editingId === req.id_yeu_cau ? (
                      <div className="card" style={{ width: '100%', border: '1px solid #3b82f6', backgroundColor: '#eff6ff' }}>
                        <h5>Thông tin tạo hợp đồng</h5>
                        <div className="grid-2" style={{ gap: 12, marginTop: 8 }}>
                          <div>
                            <label style={{ fontSize: '0.8rem' }}>Ngày kết thúc hợp đồng</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.8rem' }}>Tiền cọc thực tế (VNĐ)</label>
                            <input type="number" value={deposit} onChange={e => setDeposit(e.target.value)} />
                          </div>
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                          <button 
                            className="button button-primary" 
                            style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                            onClick={() => handleApprove(req.id_yeu_cau)}
                            disabled={submitting}
                          >
                            {submitting ? 'Đang duyệt...' : 'Xác nhận Duyệt'}
                          </button>
                          <button 
                            className="button button-secondary" 
                            style={{ padding: '4px 12px', fontSize: '0.85rem' }}
                            onClick={() => setEditingId(null)}
                          >
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <button className="button button-primary" onClick={() => {
                          setEditingId(req.id_yeu_cau);
                          setDeposit(req.Phong?.gia_phong.toString() || '');
                        }}>
                          Duyệt yêu cầu
                        </button>
                        <button className="button button-secondary" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }} onClick={() => handleReject(req.id_yeu_cau)}>
                          Từ chối
                        </button>
                      </>
                    )
                  ) : (
                    <button className="button button-secondary" style={{ backgroundColor: '#fee2e2', color: '#991b1b' }} onClick={() => handleCancel(req.id_yeu_cau)}>
                      Hủy yêu cầu
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
