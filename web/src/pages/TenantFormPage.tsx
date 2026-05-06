import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createTenant, fetchTenantById, updateTenant, deleteTenant } from '../api/api';
import { TenantPayload, Tenant, User } from '../types';

export default function TenantFormPage({ user }: { user: User }) {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [fullName, setFullName] = useState('');
  const [cccd, setCccd] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      setLoading(true);
      fetchTenantById(Number(id))
        .then((data) => {
          setTenant(data);
          setFullName(data.ho_ten);
          setCccd(data.cccd || '');
          setEmail(data.email || '');
          setPhone(data.so_dien_thoai || '');
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được người thuê'))
        .finally(() => setLoading(false));
    }
  }, [id, isNew]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const payload: TenantPayload = {
      ho_ten: fullName.trim(),
      cccd: cccd.trim(),
      email: email.trim(),
      so_dien_thoai: phone.trim()
    };

    try {
      if (isNew) {
        await createTenant(payload);
        navigate('/tenants');
      } else if (id) {
        await updateTenant(Number(id), payload);
        navigate(`/tenants/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi lưu người thuê');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!window.confirm('Bạn có chắc muốn xóa người thuê này?')) return;
    setLoading(true);
    try {
      await deleteTenant(Number(id));
      navigate('/tenants');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi xóa người thuê');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>{isNew ? 'Thêm người thuê' : 'Sửa thông tin người thuê'}</h2>
          <p className="text-muted">{isNew ? 'Tạo hồ sơ người thuê mới' : 'Cập nhật thông tin người thuê'}</p>
        </div>
      </div>
      <div className="card" style={{ maxWidth: 640, padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label htmlFor="fullName">Họ và tên</label>
            <input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
          </div>
          <div>
            <label htmlFor="cccd">CCCD</label>
            <input id="cccd" value={cccd} onChange={(event) => setCccd(event.target.value)} required />
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div>
            <label htmlFor="phone">Số điện thoại</label>
            <input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
          {error ? <div style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</div> : null}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu'}
            </button>
            {!isNew ? (
              <button type="button" className="button button-secondary" onClick={handleDelete} disabled={loading}>
                Xóa người thuê
              </button>
            ) : null}
            <button type="button" className="button button-secondary" onClick={() => navigate('/tenants')}>
              Quay lại
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
