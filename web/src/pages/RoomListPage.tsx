import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchRooms } from '../api/api';
import { Room, User } from '../types';

export default function RoomListPage({ user }: { user: User }) {
  const isTenant = user.vai_tro === 'NGUOI_THUE';
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | '0' | '1' | '2'>('all');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchRooms()
      .then(setRooms)
      .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được phòng'))
      .finally(() => setLoading(false));
  }, []);

  const filteredRooms = useMemo(
    () =>
      rooms.filter((room) => {
        const query = search.toLowerCase();
        const matchesSearch =
          room.ten_phong.toLowerCase().includes(query) ||
          (room.mo_ta || '').toLowerCase().includes(query);
        const matchesStatus = statusFilter === 'all' || String(room.trang_thai) === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [rooms, search, statusFilter]
  );

  const statusLabel = (status: number) => {
    switch (status) {
      case 0:
        return 'Còn trống';
      case 1:
        return 'Đang thuê';
      case 2:
        return 'Đang chờ';
      default:
        return 'Không xác định';
    }
  };

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Danh sách phòng</h2>
          <p className="text-muted">Danh sách phòng và trạng thái tương tự màn hình Android.</p>
        </div>
        {!isTenant && (
          <Link className="button button-primary" to="/rooms/new">
            Thêm phòng
          </Link>
        )}
      </div>
      <div className="list-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Tìm theo tên hoặc mô tả..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as any)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="0">Còn trống</option>
          <option value="1">Đang thuê</option>
          <option value="2">Đang chờ</option>
        </select>
      </div>
      {loading ? (
        <div className="panel">Đang tải phòng...</div>
      ) : error ? (
        <div className="panel">{error}</div>
      ) : (
        <div className="list-card">
          {filteredRooms.map((room) => (
            <Link key={room.id_phong} to={`/rooms/${room.id_phong}`} className="list-item list-item-link">
              <div>
                <h3>{room.ten_phong}</h3>
                <small>{room.mo_ta || 'Phòng chưa có mô tả'}</small>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>{room.gia_phong.toLocaleString()} VNĐ</div>
                <div className="status-chip" style={{ marginTop: 8 }}>
                  {statusLabel(room.trang_thai)}
                </div>
              </div>
            </Link>
          ))}
          {filteredRooms.length === 0 ? <div className="panel">Không có phòng phù hợp với tìm kiếm.</div> : null}
        </div>
      )}
    </div>
  );
}
