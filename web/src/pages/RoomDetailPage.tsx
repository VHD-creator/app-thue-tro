import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchRoomById, fetchRoomContracts, fetchRoomImages, fetchRoomInvoices } from '../api/api';
import { Contract, Invoice, Room, RoomImage } from '../types';

export default function RoomDetailPage() {
  const { id } = useParams();
  const [room, setRoom] = useState<Room | null>(null);
  const [images, setImages] = useState<RoomImage[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    const roomId = Number(id);
    setLoading(true);
    setError('');

    Promise.all([
      fetchRoomById(roomId),
      fetchRoomImages(roomId),
      fetchRoomContracts(roomId),
      fetchRoomInvoices(roomId)
    ])
      .then(([roomData, imageData, contractData, invoiceData]) => {
        setRoom(roomData);
        setImages(imageData);
        setContracts(contractData);
        setInvoices(invoiceData);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu phòng'))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) {
    return <div className="panel">ID phòng không hợp lệ.</div>;
  }

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Chi tiết phòng</h2>
          <p className="text-muted">Thông tin chi tiết phòng và lịch sử hợp đồng / hóa đơn.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link className="button button-secondary" to="/rooms">
            Quay lại danh sách
          </Link>
          <Link className="button button-primary" to={`/rooms/${id}/edit`}>
            Sửa phòng
          </Link>
        </div>
      </div>
      {loading ? (
        <div className="panel">Đang tải thông tin phòng...</div>
      ) : error ? (
        <div className="panel">{error}</div>
      ) : room ? (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3>{room.ten_phong}</h3>
            <p>{room.mo_ta || 'Phòng chưa có mô tả'}</p>
            <p>
              <strong>Giá phòng:</strong> {room.gia_phong.toLocaleString()} VNĐ
            </p>
            <p>
              <strong>Trạng thái:</strong> {room.trang_thai === 0 ? 'Còn trống' : room.trang_thai === 1 ? 'Đang thuê' : 'Đang chờ'}
            </p>
            <p>
              <strong>Chủ trọ:</strong> {room.ChuTro?.ho_ten || 'Không xác định'}
            </p>
          </div>
          {images.length > 0 ? (
            <div className="list-card">
              {images.map((image) => (
                <div key={image.id_hinh_anh} className="list-item">
                  <div>
                    <strong>{image.ten_file}</strong>
                    <p>{image.mo_ta || image.duong_dan}</p>
                  </div>
                  <div>
                    <a href={image.duong_dan} target="_blank" rel="noreferrer">
                      Xem ảnh
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          <div className="grid-2" style={{ gap: 16 }}>
            <div className="card">
              <h3>Hợp đồng liên quan</h3>
              {contracts.length ? (
                <div className="list-card">
                  {contracts.map((contract) => (
                    <div key={contract.id_hop_dong} className="list-item">
                      <div>
                        <h4>Hợp đồng #{contract.id_hop_dong}</h4>
                        <small>{contract.NguoiThue?.ho_ten || `Người thuê ${contract.id_nguoi_thue}`}</small>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div>{contract.ngay_bat_dau} → {contract.ngay_ket_thuc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="panel">Không có hợp đồng liên quan.</div>
              )}
            </div>
            <div className="card">
              <h3>Hóa đơn liên quan</h3>
              {invoices.length ? (
                <div className="list-card">
                  {invoices.map((invoice) => (
                    <div key={invoice.id_hoa_don} className="list-item">
                      <div>
                        <h4>#{invoice.id_hoa_don}</h4>
                        <small>{invoice.thang_nam}</small>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <Link to={`/invoices/${invoice.id_hoa_don}`} className="button button-secondary">
                          Xem
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="panel">Không có hóa đơn liên quan.</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="panel">Không tìm thấy phòng.</div>
      )}
    </div>
  );
}
