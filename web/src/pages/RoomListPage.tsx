import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchRooms } from '../api/api';
import { Room, User } from '../types';

export default function RoomListPage({ user }: { user: User }) {
  const isLandlord = user.vai_tro === 'CHU_TRO' || user.vai_tro === 'ADMIN';
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchRooms()
      .then(setRooms)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const matchesSearch = room.ten_phong.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || room.trang_thai.toString() === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [rooms, searchTerm, filterStatus]);

  if (loading) return <div className="panel animate-pulse">Đang tải danh sách phòng...</div>;
  if (error) return <div className="panel error" style={{ color: '#b91c1c' }}>Lỗi: {error}</div>;

  return (
    <div className="fade-in">
      <div className="section-title">
        <div>
          <h2>{isLandlord ? 'Quản lý phòng trọ' : 'Khám phá phòng trọ'}</h2>
          <p className="text-muted">
            {isLandlord 
              ? `Bạn đang quản lý ${rooms.length} phòng trọ trên hệ thống.` 
              : 'Tìm kiếm không gian sống lý tưởng phù hợp với nhu cầu của bạn.'}
          </p>
        </div>
        {isLandlord && (
          <Link to="/rooms/new" className="button button-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>+</span> Thêm phòng mới
          </Link>
        )}
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '280px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Tìm theo tên phòng, địa chỉ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div style={{ minWidth: '180px' }}>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="0">Phòng trống</option>
              <option value="1">Đã cho thuê</option>
            </select>
          </div>
        </div>
      </div>

      {filteredRooms.length === 0 ? (
        <div className="panel text-center" style={{ padding: '60px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏘️</div>
          <h3>Không tìm thấy phòng nào</h3>
          <p className="text-muted">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
          {isLandlord && (
            <Link to="/rooms/new" className="button button-secondary" style={{ marginTop: '16px' }}>
              Tạo phòng mới ngay
            </Link>
          )}
        </div>
      ) : (
        <div className="room-grid">
          {filteredRooms.map((room) => {
            const mainImage = room.DanhSachHinhAnh?.find(img => img.la_anh_dai_dien) || room.DanhSachHinhAnh?.[0];
            const imageUrl = mainImage 
              ? (mainImage.duong_dan.startsWith('http') ? mainImage.duong_dan : `/api${mainImage.duong_dan}`)
              : null;

            return (
              <Link key={room.id_phong} to={`/rooms/${room.id_phong}`} className="quick-card-link">
                <div className="room-card">
                  <div className="room-image-wrapper">
                    <div className={`room-badge ${room.trang_thai === 0 ? 'status-empty' : 'status-occupied'}`}>
                      {room.trang_thai === 0 ? 'Trống' : 'Đã thuê'}
                    </div>
                    {imageUrl ? (
                      <img src={imageUrl} alt={room.ten_phong} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: '#f8fafc', color: '#cbd5e1' }}>
                        <span style={{ fontSize: '3rem' }}>🖼️</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="room-content">
                    <h3 className="room-title">{room.ten_phong}</h3>
                    <p className="room-description">
                      {room.mo_ta || 'Phòng trọ đầy đủ tiện nghi, an ninh đảm bảo, phù hợp cho sinh viên và người đi làm.'}
                    </p>
                    
                    <div className="room-footer">
                      <div className="room-price">
                        {room.gia_phong.toLocaleString()} <span>VNĐ/tháng</span>
                      </div>
                      
                      <div className="room-owner" title={`Chủ trọ: ${room.ChuTro?.ho_ten}`}>
                        <div className="room-owner-avatar">
                          {room.ChuTro?.ho_ten?.charAt(0) || 'U'}
                        </div>
                        <span>{room.ChuTro?.ho_ten?.split(' ').pop() || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
