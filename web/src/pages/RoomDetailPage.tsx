import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchRoomDetail, fetchRoomImages, createYeuCauThue } from '../api/api';
import { useAuth } from '../hooks/useAuth';

export default function RoomDetailPage() {
  const { isTenant } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [roomData, setRoomData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);   // Hiện modal QR
  const [images, setImages] = useState<any[]>([]);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [reqDate, setReqDate] = useState('');
  const [reqDeposit, setReqDeposit] = useState('');
  const [reqNote, setReqNote] = useState('');

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError('');

    fetchRoomDetail(Number(id))
      .then(setRoomData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải thông tin phòng'))
      .finally(() => setLoading(false));

    fetchRoomImages(Number(id))
      .then(setImages)
      .catch(() => {});
  }, [id]);

  const handlePayNow = (hoaDonId: number) => {
    navigate(`/payments/${hoaDonId}`);
  };

  const handleDeposit = () => {
    setShowRequestModal(true);
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const coc = parseFloat(reqDeposit);
    if (!reqDate || isNaN(coc) || coc <= 0) {
      alert('Vui lòng điền ngày và số tiền cọc hợp lệ');
      return;
    }
    try {
      await createYeuCauThue({
        id_phong: Number(id),
        ngay_bat_dau_mong_muon: reqDate,
        tien_coc: coc,
        ghi_chu: reqNote
      });
      alert('Đã gửi yêu cầu thuê phòng thành công!');
      setShowRequestModal(false);
      navigate('/tenant/rental-requests');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi gửi yêu cầu');
    }
  };

  if (loading) return <div className="panel">Đang tải thông tin phòng...</div>;
  if (error) return <div className="panel error">{error}</div>;
  if (!roomData) return <div className="panel">Không tìm thấy phòng.</div>;

  const { hop_dongs = [], hoa_dons = [] } = roomData;
  const isTrống = roomData.trang_thai === 0;

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Chi tiết phòng: {roomData.ten_phong}</h2>
          <p className="text-muted">Thông tin phòng và liên hệ chủ trọ</p>
        </div>
        <Link className="button button-secondary" to="/rooms">
          Quay lại danh sách
        </Link>
      </div>

      {/* Thông tin phòng + Chủ trọ */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>{roomData.ten_phong}</h3>
        <p>{roomData.mo_ta || 'Không có mô tả'}</p>
        <p>
          <strong>Giá phòng:</strong> {Number(roomData.gia_phong).toLocaleString('vi-VN')} VNĐ/tháng
        </p>
        <p>
          <strong>Trạng thái:</strong>{' '}
          {roomData.trang_thai === 0 ? '🟢 Còn trống' : 
           roomData.trang_thai === 1 ? '🔴 Đang cho thuê' : '🟡 Đang chờ duyệt'}
        </p>

        {/* Thông tin chủ trọ */}
        {roomData.ChuTro && (
          <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f8fafc', borderRadius: 8 }}>
            <strong>Chủ trọ:</strong> {roomData.ChuTro.ho_ten}<br />
            <strong>SĐT:</strong> {roomData.ChuTro.so_dien_thoai || 'Chưa cập nhật'}
          </div>
        )}
      </div>

      {/* Hình ảnh phòng */}
      {images.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>Hình ảnh phòng</h3>
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '16px' }}>
            {images.map((img) => (
              <img 
                key={img.id_hinh_anh} 
                src={`http://localhost:3000${img.duong_dan}`} 
                alt={img.ten_file} 
                style={{ width: '200px', height: '150px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Nút Thuê ngay / Đặt cọc cho phòng trống */}
      {isTrống && isTenant && (
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <button 
            className="button button-primary" 
            style={{ padding: '12px 32px', fontSize: '18px' }}
            onClick={handleDeposit}
          >
            🏠 Gửi Yêu Cầu Thuê
          </button>
        </div>
      )}

      {/* Hợp đồng */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Hợp đồng liên quan ({hop_dongs.length})</h3>
        {hop_dongs.length > 0 ? (
          <div className="list-card">
            {hop_dongs.map((hd: any) => (
              <div key={hd.id_hop_dong} className="list-item">
                <div>
                  <strong>Hợp đồng #{hd.id_hop_dong}</strong><br />
                  <small>Người thuê: {hd.NguoiThue?.ho_ten || 'N/A'}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {hd.ngay_bat_dau} → {hd.ngay_ket_thuc}<br />
                  <small>Tiền cọc: {Number(hd.tien_coc || 0).toLocaleString('vi-VN')} VNĐ</small>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="panel">Không có hợp đồng nào liên quan.</div>
        )}
      </div>

      {/* Hóa đơn */}
      <div className="card">
        <h3>Hóa đơn liên quan ({hoa_dons.length})</h3>
        {hoa_dons.length > 0 ? (
          <div className="list-card">
            {hoa_dons.map((hd: any) => (
              <div key={hd.id_hoa_don} className="list-item">
                <div>
                  <strong>Hóa đơn #{hd.id_hoa_don}</strong><br />
                  <small>Tháng: {hd.thang_nam}</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>
                    {Number(hd.tong_tien || 0).toLocaleString('vi-VN')} VNĐ
                  </div>
                  <span className={`status-chip ${hd.trang_thai === 1 ? 'paid' : 'unpaid'}`} style={{ marginBottom: 8 }}>
                    {hd.trang_thai === 1 ? '✅ Đã thanh toán' : '⏳ Chưa thanh toán'}
                  </span>

                  {hd.trang_thai === 0 && isTenant && (
                    <button 
                      className="button button-primary button-small"
                      onClick={() => handlePayNow(hd.id_hoa_don)}
                    >
                      💰 Thanh toán ngay
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="panel">Chưa có hóa đơn nào cho phòng này.</div>
        )}
      </div>

      {/* Modal Yêu Cầu Thuê */}
      {showRequestModal && (
        <div className="modal" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="card" style={{ maxWidth: 420, width: '100%', padding: 24, backgroundColor: 'white' }}>
            <h3>Gửi Yêu Cầu Thuê Phòng</h3>
            <form onSubmit={handleRequestSubmit} style={{ display: 'grid', gap: '16px', textAlign: 'left' }}>
              <div>
                <label>Ngày bắt đầu ở dự kiến</label>
                <input type="date" value={reqDate} onChange={e => setReqDate(e.target.value)} required />
              </div>
              <div>
                <label>Số tiền cọc dự định (VNĐ)</label>
                <input type="number" value={reqDeposit} onChange={e => setReqDeposit(e.target.value)} required placeholder={roomData.gia_phong?.toString()} />
              </div>
              <div>
                <label>Ghi chú thêm</label>
                <input type="text" value={reqNote} onChange={e => setReqNote(e.target.value)} placeholder="Ví dụ: Ở 2 người, có xe máy..." />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="button button-secondary" onClick={() => setShowRequestModal(false)}>Hủy</button>
                <button type="submit" className="button button-primary">Gửi Yêu Cầu</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}