import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchContractById } from '../api/api';
import { Contract, User } from '../types';
import { formatDate, formatCurrency } from '../utils';

export default function ContractDetailPage({ user }: { user: User }) {
  const isTenant = user.vai_tro === 'NGUOI_THUE';
  const { id } = useParams();
  const navigate = useNavigate();
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

  const handleDownloadPdf = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/api/hopDong/${id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Bạn không có quyền tải hợp đồng này hoặc hợp đồng không tồn tại');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HopDongThuePhong_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi tải PDF');
    }
  };

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Chi tiết hợp đồng</h2>
          <p className="text-muted">Thông tin hợp đồng chi tiết.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="button button-primary" onClick={handleDownloadPdf} style={{ backgroundColor: '#10b981', color: 'white', borderColor: '#10b981' }}>
            📄 Tải Bản In (PDF)
          </button>
          <button className="button button-secondary" onClick={() => navigate(-1)}>
            Quay lại
          </button>
          {!isTenant && (
            <Link className="button button-primary" to={`/contracts/${id}/edit`}>
              Sửa hợp đồng
            </Link>
          )}
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
            <strong>Thời gian:</strong> {formatDate(contract.ngay_bat_dau)} → {formatDate(contract.ngay_ket_thuc)}
          </p>
          <p>
            <strong>Tiền cọc:</strong> {formatCurrency(contract.tien_coc)}
          </p>
          <p>
            <strong>Trạng thái:</strong> {contract.trang_thai === 1 ? 'Đang hoạt động' : contract.trang_thai === 2 ? 'Chờ duyệt' : 'Không hoạt động'}
          </p>
        </div>
      ) : (
        <div className="panel">Không tìm thấy hợp đồng.</div>
      )}
    </div>
  );
}