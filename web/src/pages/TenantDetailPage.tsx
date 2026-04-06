import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchTenantById } from '../api/api';
import { Tenant } from '../types';

export default function TenantDetailPage() {
  const { id } = useParams();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    fetchTenantById(Number(id))
      .then(setTenant)
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải người thuê'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Chi tiết người thuê</h2>
          <p className="text-muted">Thông tin cá nhân và hợp đồng liên quan.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link className="button button-secondary" to="/tenants">
            Quay lại
          </Link>
          <Link className="button button-primary" to={`/tenants/${id}/edit`}>
            Sửa người thuê
          </Link>
        </div>
      </div>
      {loading ? (
        <div className="panel">Đang tải thông tin người thuê...</div>
      ) : error ? (
        <div className="panel">{error}</div>
      ) : tenant ? (
        <div className="card">
          <h3>{tenant.ho_ten}</h3>
          <p>
            <strong>CCCD:</strong> {tenant.cccd}
          </p>
          <p>
            <strong>Điện thoại:</strong> {tenant.so_dien_thoai || 'Chưa có'}
          </p>
          <p>
            <strong>Email:</strong> {tenant.email || 'Chưa có'}
          </p>
          <div style={{ marginTop: 20 }}>
            <h4>Hợp đồng</h4>
            {tenant.DanhSachHopDong?.length ? (
              <div className="list-card">
                {tenant.DanhSachHopDong.map((contract) => (
                  <div key={contract.id_hop_dong} className="list-item">
                    <div>
                      <h4>Hợp đồng #{contract.id_hop_dong}</h4>
                      <small>Phòng {contract.id_phong}</small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div>{contract.ngay_bat_dau} → {contract.ngay_ket_thuc}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="panel">Không có hợp đồng.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="panel">Không tìm thấy người thuê.</div>
      )}
    </div>
  );
}
