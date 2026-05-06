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
  const [filterAddress, setFilterAddress] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchRooms()
      .then(setRooms)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Lấy danh sách địa chỉ duy nhất
  const uniqueAddresses = useMemo(() => {
    const addrs = new Set<string>();
    rooms.forEach(r => {
      if (r.ChuTro?.dia_chi) addrs.add(r.ChuTro.dia_chi);
    });
    return Array.from(addrs).sort();
  }, [rooms]);

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      const addr = room.ChuTro?.dia_chi || '';
      const matchesSearch = 
        room.ten_phong.toLowerCase().includes(searchTerm.toLowerCase()) ||
        addr.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || room.trang_thai.toString() === filterStatus;
      const matchesAddress = filterAddress === 'all' || addr === filterAddress;
      
      return matchesSearch && matchesStatus && matchesAddress;
    });
  }, [rooms, searchTerm, filterStatus, filterAddress]);

  // Nhóm phòng theo địa chỉ
  const groupedRooms = useMemo(() => {
    const groups: Record<string, Room[]> = {};
    filteredRooms.forEach(room => {
      const addr = room.ChuTro?.dia_chi || 'Địa chỉ chưa cập nhật';
      if (!groups[addr]) groups[addr] = [];
      groups[addr].push(room);
    });
    return groups;
  }, [filteredRooms]);

  if (loading) return <div className="panel animate-pulse">Đang tải danh sách phòng...</div>;
  if (error) return <div className="panel error" style={{ color: '#b91c1c' }}>Lỗi: {error}</div>;

  return (
    <div className="fade-in">
      <div className="section-title">
        <div>
          <h2>{isLandlord ? 'Quản lý phòng trọ' : 'Khám phá phòng trọ'}</h2>
          <p className="text-muted">
            {isLandlord 
              ? `Bạn đang quản lý ${rooms.length} phòng trọ tại các khu vực khác nhau.` 
              : 'Tìm kiếm không gian sống lý tưởng theo khu vực và địa chỉ.'}
          </p>
        </div>
        {isLandlord && (
          <Link to="/rooms/new" className="button button-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>+</span> Thêm phòng mới
          </Link>
        )}
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 16 }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Tìm theo tên phòng, địa chỉ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div style={{ minWidth: '200px' }}>
            <select value={filterAddress} onChange={(e) => setFilterAddress(e.target.value)}>
              <option value="all">Tất cả khu vực</option>
              {uniqueAddresses.map(addr => (
                <option key={addr} value={addr}>{addr}</option>
              ))}
            </select>
          </div>
          <div style={{ minWidth: '160px' }}>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="all">Tất cả trạng thái</option>
              <option value="0">Phòng trống</option>
              <option value="1">Đã cho thuê</option>
            </select>
          </div>
        </div>
      </div>

      {Object.keys(groupedRooms).length === 0 ? (
        <div className="panel text-center" style={{ padding: '60px 20px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏘️</div>
          <h3>Không tìm thấy phòng nào</h3>
          <p className="text-muted">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm của bạn.</p>
        </div>
      ) : (
        Object.entries(groupedRooms).map(([address, roomsInGroup]) => (
          <div key={address} style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '20px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' }}>
              <span style={{ fontSize: '1.5rem' }}>📍</span>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b' }}>{address}</h3>
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>Có {roomsInGroup.length} phòng tại địa chỉ này</p>
              </div>
            </div>
            
            <div className="room-grid">
              {roomsInGroup.map((room) => {
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
          </div>
        ))
      )}
    </div>
  );
}
