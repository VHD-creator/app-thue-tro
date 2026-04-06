import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createInvoice, fetchInvoiceById, fetchRooms, updateInvoice, deleteInvoice } from '../api/api';
import { InvoicePayload, Room, Invoice } from '../types';

export default function InvoiceFormPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState<number | ''>('');
  const [monthYear, setMonthYear] = useState('');
  const [electricOld, setElectricOld] = useState('');
  const [electricNew, setElectricNew] = useState('');
  const [waterOld, setWaterOld] = useState('');
  const [waterNew, setWaterNew] = useState('');
  const [electricPrice, setElectricPrice] = useState('0');
  const [waterPrice, setWaterPrice] = useState('0');
  const [roomPrice, setRoomPrice] = useState('0');
  const [status, setStatus] = useState(0);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRooms().then(setRooms).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      fetchInvoiceById(Number(id))
        .then((data) => {
          setInvoice(data);
          setRoomId(data.id_phong);
          setMonthYear(data.thang_nam);
          setElectricOld(data.so_dien_cu?.toString() || '');
          setElectricNew(data.so_dien_moi?.toString() || '');
          setWaterOld(data.so_nuoc_cu?.toString() || '');
          setWaterNew(data.so_nuoc_moi?.toString() || '');
          setElectricPrice(data.tien_dien?.toString() || '0');
          setWaterPrice(data.tien_nuoc?.toString() || '0');
          setRoomPrice(data.tien_phong?.toString() || '0');
          setStatus(data.trang_thai);
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được hóa đơn'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const payload: InvoicePayload = {
      id_phong: Number(roomId),
      thang_nam: monthYear,
      so_dien_cu: Number(electricOld) || 0,
      so_dien_moi: Number(electricNew) || 0,
      so_nuoc_cu: Number(waterOld) || 0,
      so_nuoc_moi: Number(waterNew) || 0,
      tien_dien: Number(electricPrice) || 0,
      tien_nuoc: Number(waterPrice) || 0,
      tien_phong: Number(roomPrice) || 0,
      trang_thai: status
    };

    try {
      if (isNew) {
        await createInvoice(payload);
        navigate('/invoices');
      } else if (id) {
        await updateInvoice(Number(id), payload);
        navigate(`/invoices/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi lưu hóa đơn');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm('Bạn có chắc muốn xóa hóa đơn này?')) return;
    setLoading(true);
    try {
      await deleteInvoice(Number(id));
      navigate('/invoices');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi xóa hóa đơn');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>{isNew ? 'Tạo hóa đơn mới' : 'Sửa hóa đơn'}</h2>
          <p className="text-muted">{isNew ? 'Tạo hóa đơn mới cho phòng' : 'Cập nhật thông tin hóa đơn'}</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 720, padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label htmlFor="invoiceRoom">Phòng</label>
            <select id="invoiceRoom" value={roomId} onChange={(event) => setRoomId(Number(event.target.value))} required>
              <option value="">Chọn phòng</option>
              {rooms.map((room) => (
                <option key={room.id_phong} value={room.id_phong}>{room.ten_phong}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="monthYear">Tháng / Năm</label>
            <input id="monthYear" placeholder="MM-YYYY" value={monthYear} onChange={(event) => setMonthYear(event.target.value)} required />
          </div>
          <div className="grid-2">
            <div>
              <label htmlFor="electricOld">Điện cũ</label>
              <input id="electricOld" type="number" value={electricOld} onChange={(event) => setElectricOld(event.target.value)} />
            </div>
            <div>
              <label htmlFor="electricNew">Điện mới</label>
              <input id="electricNew" type="number" value={electricNew} onChange={(event) => setElectricNew(event.target.value)} />
            </div>
          </div>
          <div className="grid-2">
            <div>
              <label htmlFor="waterOld">Nước cũ</label>
              <input id="waterOld" type="number" value={waterOld} onChange={(event) => setWaterOld(event.target.value)} />
            </div>
            <div>
              <label htmlFor="waterNew">Nước mới</label>
              <input id="waterNew" type="number" value={waterNew} onChange={(event) => setWaterNew(event.target.value)} />
            </div>
          </div>
          <div className="grid-3">
            <div>
              <label htmlFor="electricPrice">Tiền điện</label>
              <input id="electricPrice" type="number" value={electricPrice} onChange={(event) => setElectricPrice(event.target.value)} />
            </div>
            <div>
              <label htmlFor="waterPrice">Tiền nước</label>
              <input id="waterPrice" type="number" value={waterPrice} onChange={(event) => setWaterPrice(event.target.value)} />
            </div>
            <div>
              <label htmlFor="roomPrice">Tiền phòng</label>
              <input id="roomPrice" type="number" value={roomPrice} onChange={(event) => setRoomPrice(event.target.value)} />
            </div>
          </div>
          <div>
            <label htmlFor="invoiceStatus">Trạng thái</label>
            <select id="invoiceStatus" value={status} onChange={(event) => setStatus(Number(event.target.value))}>
              <option value={0}>Chưa thanh toán</option>
              <option value={1}>Đã thanh toán</option>
              <option value={2}>Đang chờ</option>
            </select>
          </div>
          {error ? <div style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</div> : null}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu hóa đơn'}
            </button>
            {!isNew ? (
              <button type="button" className="button button-secondary" onClick={handleDelete} disabled={loading}>
                Xóa hóa đơn
              </button>
            ) : null}
            <button type="button" className="button button-secondary" onClick={() => navigate('/invoices')}>
              Quay lại
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
