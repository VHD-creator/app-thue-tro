import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchTenants } from '../api/api';
import { Tenant, User } from '../types';

export default function TenantListPage({ user }: { user: User }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredTenants = useMemo(
    () =>
      tenants.filter((tenant) => {
        const query = search.toLowerCase();
        return (
          tenant.ho_ten.toLowerCase().includes(query) ||
          (tenant.email || '').toLowerCase().includes(query) ||
          (tenant.so_dien_thoai || '').toLowerCase().includes(query) ||
          (tenant.cccd || '').toLowerCase().includes(query)
        );
      }),
    [tenants, search]
  );

  useEffect(() => {
    setLoading(true);
    fetchTenants()
      .then(setTenants)
      .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được người thuê'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Danh sách người thuê</h2>
          <p className="text-muted">Xem danh sách người thuê và hợp đồng đăng ký.</p>
        </div>
        <Link className="button button-primary" to="/tenants/new">
          Thêm người thuê
        </Link>
      </div>
      <div className="list-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Tìm theo tên, email hoặc CCCD..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      {loading ? (
        <div className="panel">Đang tải người thuê...</div>
      ) : error ? (
        <div className="panel">{error}</div>
      ) : (
        <div className="list-card">
          {filteredTenants.map((tenant) => (
            <Link key={tenant.id_nguoi_thue} to={`/tenants/${tenant.id_nguoi_thue}`} className="list-item list-item-link" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h3>{tenant.ho_ten}</h3>
                <small>{tenant.email || tenant.so_dien_thoai || `CCCD: ${tenant.cccd}`}</small>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{tenant.DanhSachHopDong?.length ?? 0} hợp đồng</div>
              </div>
            </Link>
          ))}
          {filteredTenants.length === 0 ? <div className="panel">Không có người thuê phù hợp.</div> : null}
        </div>
      )}
    </div>
  );
}
