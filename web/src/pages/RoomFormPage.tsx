import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createRoom, fetchRoomById, updateRoom, deleteRoom } from '../api/api';
import { Room, RoomPayload, User } from '../types';

type Props = {
  user: User | null;
};

export default function RoomFormPage({ user }: Props) {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const [room, setRoom] = useState<Room | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      fetchRoomById(Number(id))
        .then((data) => {
          setRoom(data);
          setName(data.ten_phong);
          setPrice(data.gia_phong.toString());
          setDescription(data.mo_ta || '');
          setStatus(data.trang_thai);
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được phòng'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const payload: RoomPayload = {
      ten_phong: name.trim(),
      gia_phong: Number(price),
      mo_ta: description.trim(),
      trang_thai: status
    };

    try {
      if (isNew) {
        await createRoom(payload);
        setSuccess('Tạo phòng thành công');
        navigate('/rooms');
      } else if (id) {
        await updateRoom(Number(id), payload);
        setSuccess('Cập nhật phòng thành công');
        navigate(`/rooms/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi lưu phòng');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm('Bạn có chắc muốn xóa phòng này?')) return;
    setLoading(true);
    try {
      await deleteRoom(Number(id));
      navigate('/rooms');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi xóa phòng');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>{isNew ? 'Thêm phòng mới' : 'Sửa phòng'}</h2>
          <p className="text-muted">{isNew ? 'Tạo mới phòng trọ' : 'Cập nhật thông tin phòng'}</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 640, padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label htmlFor="roomName">Tên phòng</label>
            <input id="roomName" value={name} onChange={(event) => setName(event.target.value)} required />
          </div>
          <div>
            <label htmlFor="roomPrice">Giá phòng (VNĐ)</label>
            <input id="roomPrice" type="number" value={price} onChange={(event) => setPrice(event.target.value)} required />
          </div>
          <div>
            <label htmlFor="roomDescription">Mô tả</label>
            <textarea id="roomDescription" value={description} onChange={(event) => setDescription(event.target.value)} rows={4} />
          </div>
          <div>
            <label htmlFor="roomStatus">Trạng thái</label>
            <select id="roomStatus" value={status} onChange={(event) => setStatus(Number(event.target.value))}>
              <option value={0}>Còn trống</option>
              <option value={1}>Đang thuê</option>
              <option value={2}>Đang chờ</option>
            </select>
          </div>
          {error ? <div style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</div> : null}
          {success ? <div style={{ color: '#0f766e', fontWeight: 600 }}>{success}</div> : null}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
            {!isNew ? (
              <button type="button" className="button button-secondary" onClick={handleDelete} disabled={loading}>
                Xóa phòng
              </button>
            ) : null}
            <button type="button" className="button button-secondary" onClick={() => navigate('/rooms')}>
              Quay lại
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
