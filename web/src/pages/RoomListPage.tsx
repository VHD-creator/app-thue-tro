import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { fetchRooms } from '../api/api';
import { Room, User } from '../types';

export default function RoomListPage({ user }: { user: User }) {
  const isLandlord = user.vai_tro === 'CHU_TRO' || user.vai_tro === 'ADMIN';
  const isTenant = user.vai_tro === 'NGUOI_THUE';
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

  if (loading) return <div className="panel">Đang tải danh sách phòng...</div>;
  if (error) return <div className="panel error">Lỗi: {error}</div>;

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>{isLandlord ? 'Quản lý phòng trọ' : 'Danh sách phòng trọ'}</h2>
          <p className="text-muted">
            {isLandlord ? 'Xem và quản lý tất cả phòng trọ của bạn.' : 'Tìm phòng trọ phù hợp.'}
          </p>
        </div>
        {isLandlord && (
          <Link to="/rooms/new" className="button button-primary">
            ➕ Thêm phòng mới
          </Link>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên phòng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ minWidth: 140 }}>
            <option value="all">Tất cả trạng thái</option>
            <option value="0">Trống</option>
            <option value="1">Đã cho thuê</option>
          </select>
        </div>

        {filteredRooms.length === 0 ? (
          <div className="panel text-muted">
            {isLandlord ? 'Chưa có phòng nào. ' : 'Không tìm thấy phòng phù hợp. '}
            {isLandlord && <Link to="/rooms/new">Tạo phòng đầu tiên</Link>}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Hình ảnh</th>
                  <th>Tên phòng</th>
                  <th>Giá</th>
                  <th>Trạng thái</th>
                  <th>Chủ trọ</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.map((room) => (
                  <tr key={room.id_phong}>
                    <td>
                      <div style={{ width: 60, height: 40, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        🏠
                      </div>
                    </td>
                    <td>
                      <Link to={`/rooms/${room.id_phong}`} style={{ fontWeight: 500 }}>
                        {room.ten_phong}
                      </Link>
                      <p className="text-muted" style={{ fontSize: '0.875rem', margin: 0 }}>
                        {room.mo_ta || 'Không có mô tả'}
                      </p>
                    </td>
                    <td>
                      <strong>{room.gia_phong.toLocaleString()} VNĐ</strong>
                    </td>
                    <td>
                      <span className={`status-badge status-${room.trang_thai === 0 ? 'success' : 'warning'}`}>
                        {room.trang_thai === 0 ? '🟢 Trống' : '🔴 Đã thuê'}
                      </span>
                    </td>
                    <td>{room.ChuTro?.ho_ten || 'N/A'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link to={`/rooms/${room.id_phong}`} className="button button-small button-secondary">
                          Xem
                        </Link>
                        {isLandlord && (
                          <>
                            <Link to={`/rooms/${room.id_phong}/edit`} className="button button-small button-primary">
                              Sửa
                            </Link>
                          </>
                        )}
                        {!isLandlord && room.trang_thai === 0 && (
                          <Link to={`/rooms/${room.id_phong}`} className="button button-small button-success">
                            Thuê ngay
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
