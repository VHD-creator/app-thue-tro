import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchContracts } from '../api/api';
import { Contract } from '../types';

export default function ContractListPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredContracts = useMemo(
    () =>
      contracts.filter((contract) => {
        const query = search.toLowerCase();
        return (
          contract.id_hop_dong.toString().includes(query) ||
          contract.id_phong.toString().includes(query) ||
          contract.id_nguoi_thue.toString().includes(query) ||
          contract.ngay_bat_dau.includes(query) ||
          contract.ngay_ket_thuc.includes(query)
        );
      }),
    [contracts, search]
  );

  useEffect(() => {
    setLoading(true);
    fetchContracts()
      .then(setContracts)
      .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được hợp đồng'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Danh sách hợp đồng</h2>
          <p className="text-muted">Xem danh sách hợp đồng và thời hạn.</p>
        </div>
        <Link className="button button-primary" to="/contracts/new">
          Thêm hợp đồng
        </Link>
      </div>
      <div className="list-controls">
        <input
          type="text"
          className="search-input"
          placeholder="Tìm hợp đồng theo số, phòng, người thuê..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      {loading ? (
        <div className="panel">Đang tải hợp đồng...</div>
      ) : error ? (
        <div className="panel">{error}</div>
      ) : (
        <div className="list-card">
          {filteredContracts.map((contract) => (
            <Link key={contract.id_hop_dong} to={`/contracts/${contract.id_hop_dong}`} className="list-item list-item-link">
              <div>
                <h3>Hợp đồng #{contract.id_hop_dong}</h3>
                <small>Phòng {contract.id_phong} • Người thuê {contract.id_nguoi_thue}</small>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{contract.ngay_bat_dau} → {contract.ngay_ket_thuc}</div>
              </div>
            </Link>
          ))}
          {filteredContracts.length === 0 ? <div className="panel">Không có hợp đồng phù hợp.</div> : null}
        </div>
      )}
    </div>
  );
}
