import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchContractById, downloadContractPdf } from '../api/api';
import { Contract, User } from '../types';
import { formatDate, formatCurrency } from '../utils';

export default function ContractDetailPage({ user }: { user: User }) {
  const isTenant = user.vai_tro === 'NGUOI_THUE';
  const { id } = useParams();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    fetchContractById(Number(id))
      .then(setContract)
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải hợp đồng'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownloadPdf = async () => {
    if (!id) return;
    try {
      setDownloading(true);
      await downloadContractPdf(Number(id), `HopDongThuePhong_${id}.pdf`);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDownloading(false);
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
          <button className="button button-primary" onClick={handleDownloadPdf} disabled={downloading} style={{ backgroundColor: '#10b981', color: 'white', borderColor: '#10b981' }}>
            {downloading ? '⌛ Đang tải...' : '📄 Tải Bản In (PDF)'}
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