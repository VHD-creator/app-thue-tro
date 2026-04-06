import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchContractById } from '../api/api';
import { Contract } from '../types';

export default function ContractDetailPage() {
  const { id } = useParams();
  const [contract, setContract] = useState<Contract | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    fetchContractById(Number(id))
      .then(setContract)
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải hợp đồng'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Chi tiết hợp đồng</h2>
          <p className="text-muted">Thông tin hợp đồng chi tiết.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link className="button button-secondary" to="/contracts">
            Quay lại
          </Link>
          <Link className="button button-primary" to={`/contracts/${id}/edit`}>
            Sửa hợp đồng
          </Link>
        </div>
      </div>
      {loading ? (
        <div className="panel">Đang tải hợp đồng...</div>
      ) : error ? (
        <div className="panel">{error}</div>
      ) : contract ? (
        <div className="card">
          <h3>Hợp đồng #{contract.id_hop_dong}</h3>
          <p>
            <strong>Phòng:</strong> {contract.Phong?.ten_phong || contract.id_phong}
          </p>
          <p>
            <strong>Người thuê:</strong> {contract.NguoiThue?.ho_ten || contract.id_nguoi_thue}
          </p>
          <p>
            <strong>Thời gian:</strong> {contract.ngay_bat_dau} → {contract.ngay_ket_thuc}
          </p>
          <p>
            <strong>Tiền cọc:</strong> {contract.tien_coc?.toLocaleString() || 'Chưa có'} VNĐ
          </p>
          <p>
            <strong>Trạng thái:</strong> {contract.trang_thai === 1 ? 'Đang hoạt động' : 'Không hoạt động'}
          </p>
        </div>
      ) : (
        <div className="panel">Không tìm thấy hợp đồng.</div>
      )}
    </div>
  );
}
