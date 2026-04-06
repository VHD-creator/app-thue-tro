import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createContract, fetchContractById, fetchRooms, fetchTenants, updateContract, deleteContract } from '../api/api';
import { Contract, ContractPayload, Room, Tenant } from '../types';

export default function ContractFormPage() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [roomId, setRoomId] = useState<number | ''>('');
  const [tenantId, setTenantId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deposit, setDeposit] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRooms().then(setRooms).catch(() => {});
    fetchTenants().then(setTenants).catch(() => {});
  }, []);

  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      fetchContractById(Number(id))
        .then((data) => {
          setContract(data);
          setRoomId(data.id_phong);
          setTenantId(data.id_nguoi_thue);
          setStartDate(data.ngay_bat_dau);
          setEndDate(data.ngay_ket_thuc);
          setDeposit(data.tien_coc?.toString() || '');
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được hợp đồng'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const payload: ContractPayload = {
      id_phong: Number(roomId),
      id_nguoi_thue: Number(tenantId),
      ngay_bat_dau: startDate,
      ngay_ket_thuc: endDate,
      tien_coc: Number(deposit)
    };

    try {
      if (isNew) {
        await createContract(payload);
        navigate('/contracts');
      } else if (id) {
        await updateContract(Number(id), payload);
        navigate(`/contracts/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi lưu hợp đồng');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm('Bạn có chắc muốn xóa hợp đồng này?')) return;
    setLoading(true);
    try {
      await deleteContract(Number(id));
      navigate('/contracts');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi xóa hợp đồng');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>{isNew ? 'Tạo hợp đồng mới' : 'Chỉnh sửa hợp đồng'}</h2>
          <p className="text-muted">{isNew ? 'Thêm hợp đồng thuê phòng' : 'Cập nhật thông tin hợp đồng'}</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 720, padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label htmlFor="contractRoom">Phòng</label>
            <select id="contractRoom" value={roomId} onChange={(event) => setRoomId(Number(event.target.value))} required>
              <option value="">Chọn phòng</option>
              {rooms.map((room) => (
                <option key={room.id_phong} value={room.id_phong}>{room.ten_phong}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="contractTenant">Người thuê</label>
            <select id="contractTenant" value={tenantId} onChange={(event) => setTenantId(Number(event.target.value))} required>
              <option value="">Chọn người thuê</option>
              {tenants.map((tenant) => (
                <option key={tenant.id_nguoi_thue} value={tenant.id_nguoi_thue}>{tenant.ho_ten}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="startDate">Ngày bắt đầu</label>
            <input id="startDate" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
          </div>
          <div>
            <label htmlFor="endDate">Ngày kết thúc</label>
            <input id="endDate" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} required />
          </div>
          <div>
            <label htmlFor="deposit">Tiền cọc</label>
            <input id="deposit" type="number" value={deposit} onChange={(event) => setDeposit(event.target.value)} />
          </div>
          {error ? <div style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</div> : null}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu hợp đồng'}
            </button>
            {!isNew ? (
              <button type="button" className="button button-secondary" onClick={handleDelete} disabled={loading}>
                Xóa hợp đồng
              </button>
            ) : null}
            <button type="button" className="button button-secondary" onClick={() => navigate('/contracts')}>
              Quay lại
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
