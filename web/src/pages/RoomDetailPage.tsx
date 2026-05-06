import { useEffect, useState, FormEvent } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { fetchRoomById, fetchRoomContracts, fetchRoomImages, fetchRoomInvoices, createRentRequest } from '../api/api';
import { Contract, Invoice, Room, RoomImage, User } from '../types';

interface Props {
  user: User;
}

export default function RoomDetailPage({ user }: Props) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const isLandlord = user.vai_tro === 'CHU_TRO' || user.vai_tro === 'ADMIN';
  const isTenant = user.vai_tro === 'NGUOI_THUE';

  const [room, setRoom] = useState<Room | null>(null);
  const [images, setImages] = useState<RoomImage[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Rent form state
  const [showRentForm, setShowRentForm] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [deposit, setDeposit] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');

  const isVacant = room?.trang_thai === 0;

  useEffect(() => {
    if (!id) return;
    const roomId = Number(id);

    setLoading(true);
    setError('');

    const promises: [Promise<Room>, Promise<RoomImage[]>, Promise<any>, Promise<any>] = [
      fetchRoomById(roomId),
      fetchRoomImages(roomId),
      isLandlord ? fetchRoomContracts(roomId) : Promise.resolve({ data: [] }),
      isLandlord ? fetchRoomInvoices(roomId) : Promise.resolve({ data: [] })
    ];

    Promise.all(promises)
      .then(([roomData, imageData, contractData, invoiceData]) => {
        setRoom(roomData);
        setImages(imageData);
        setContracts(contractData.data || contractData || []);
        setInvoices(invoiceData.data || invoiceData || []);
        if (roomData) {
          setDeposit(roomData.gia_phong.toString());
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu phòng'))
      .finally(() => setLoading(false));
  }, [id, isLandlord]);

  async function handleRentSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id || !room) return;
    
    setError('');
    setSubmitSuccess('');
    setSubmitting(true);

    try {
      await createRentRequest({
        id_phong: room.id_phong,
        ngay_bat_dau_mong_muon: startDate,
        tien_coc: Number(deposit),
        ghi_chu: note
      });
      setSubmitSuccess('Gửi yêu cầu thuê phòng thành công! Đang chuyển hướng...');
      setTimeout(() => {
        navigate('/tenant/dashboard');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi khi gửi yêu cầu');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="panel">Đang tải thông tin phòng...</div>;
  if (error && !showRentForm) return <div className="panel error">{error}</div>;

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Chi tiết phòng</h2>
          <p className="text-muted">Thông tin chi tiết phòng và lịch sử hợp đồng / hóa đơn.</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="button button-secondary" onClick={() => navigate(-1)}>
            Quay lại
          </button>
          {isLandlord && (
            <Link className="button button-primary" to={`/rooms/${id}/edit`}>
              Sửa phòng
            </Link>
          )}
          {isTenant && isVacant && !showRentForm && (
            <button className="button button-primary" onClick={() => setShowRentForm(true)}>
              Thuê phòng này
            </button>
          )}
        </div>
      </div>

      {room ? (
        <>
          {showRentForm && (
            <div className="card" style={{ marginBottom: 20, border: '2px solid #3b82f6' }}>
              <h3>Đăng ký thuê phòng: {room.ten_phong}</h3>
              <form onSubmit={handleRentSubmit} style={{ display: 'grid', gap: 16, marginTop: 16 }}>
                <div className="grid-2">
                  <div>
                    <label>Ngày muốn bắt đầu thuê</label>
                    <input 
                      type="date" 
                      required 
                      value={startDate} 
                      onChange={e => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label>Tiền cọc dự kiến (VNĐ)</label>
                    <input 
                      type="number" 
                      required 
                      value={deposit} 
                      onChange={e => setDeposit(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label>Ghi chú cho chủ trọ</label>
                  <textarea 
                    value={note} 
                    onChange={e => setNote(e.target.value)} 
                    placeholder="VD: Tôi muốn thuê lâu dài, có nuôi thú cưng nhỏ..."
                    rows={3}
                  />
                </div>
                {error && <div style={{ color: 'red' }}>{error}</div>}
                {submitSuccess && <div style={{ color: 'green' }}>{submitSuccess}</div>}
                <div style={{ display: 'flex', gap: 12 }}>
                  <button type="submit" className="button button-primary" disabled={submitting}>
                    {submitting ? 'Đang gửi...' : 'Xác nhận gửi yêu cầu'}
                  </button>
                  <button type="button" className="button button-secondary" onClick={() => setShowRentForm(false)}>
                    Hủy bỏ
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <h3>{room.ten_phong}</h3>
              <span className={`badge ${isVacant ? 'badge-success' : 'badge-warning'}`} style={{ 
                padding: '4px 12px', 
                borderRadius: '999px',
                backgroundColor: isVacant ? '#dcfce7' : '#fef3c7',
                color: isVacant ? '#166534' : '#92400e'
              }}>
                {room.trang_thai === 0 ? 'Còn trống' : room.trang_thai === 1 ? 'Đang thuê' : 'Đang chờ duyệt'}
              </span>
            </div>
            <p style={{ marginTop: 12 }}>{room.mo_ta || 'Phòng chưa có mô tả'}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginTop: 16 }}>
              <div>
                <strong>Giá phòng:</strong> 
                <p style={{ fontSize: '1.25rem', color: '#2563eb', fontWeight: 'bold' }}>
                  {room.gia_phong.toLocaleString()} VNĐ/tháng
                </p>
              </div>
              <div>
                <strong>Chủ trọ:</strong>
                <p>{room.ChuTro?.ho_ten || 'Không xác định'}</p>
              </div>
              {room.ChuTro?.so_dien_thoai && (
                <div>
                  <strong>Liên hệ:</strong>
                  <p>{room.ChuTro.so_dien_thoai}</p>
                </div>
              )}
            </div>
          </div>

          {images.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3>Hình ảnh phòng</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 16, marginTop: 12 }}>
                {images.map((image) => (
                  <div key={image.id_hinh_anh} className="card" style={{ padding: 8 }}>
                    <img 
                      src={image.duong_dan.startsWith('http') ? image.duong_dan : `/api${image.duong_dan}`} 
                      alt={image.ten_file} 
                      style={{ width: '100%', height: 220, objectFit: 'cover', borderRadius: 4 }}
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=Image+Error'; }}
                    />
                    {image.mo_ta && <p style={{ marginTop: 8, fontSize: '0.875rem', textAlign: 'center' }}>{image.mo_ta}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLandlord && (
            <div className="grid-2" style={{ gap: 16 }}>
              <div className="card shadow-sm">
                <h3 className="mb-4">Lịch sử hợp đồng</h3>
                {contracts.length ? (
                  <div className="list-card">
                    {contracts.map((contract) => (
                      <div key={contract.id_hop_dong} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                        <div>
                          <h4 style={{ margin: 0 }}>{contract.NguoiThue?.ho_ten || `Người thuê #${contract.id_nguoi_thue}`}</h4>
                          <small className="text-muted">{new Date(contract.ngay_bat_dau).toLocaleDateString('vi-VN')} - {new Date(contract.ngay_ket_thuc).toLocaleDateString('vi-VN')}</small>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`status-chip ${contract.trang_thai === 1 ? 'paid' : 'unpaid'}`} style={{ fontSize: '0.75rem' }}>
                            {contract.trang_thai === 1 ? 'Hiệu lực' : 'Hết hạn'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="panel" style={{ textAlign: 'center', opacity: 0.7 }}>Chưa có hợp đồng nào.</div>
                )}
              </div>
              <div className="card shadow-sm">
                <h3 className="mb-4">Hóa đơn phòng</h3>
                {invoices.length ? (
                  <div className="list-card">
                    {invoices.map((invoice) => (
                      <div key={invoice.id_hoa_don} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                        <div>
                          <h4 style={{ margin: 0 }}>Tháng {invoice.thang_nam}</h4>
                          <small className="text-muted">{invoice.tong_tien.toLocaleString()} VNĐ</small>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <Link to={`/invoices/${invoice.id_hoa_don}`} className="button button-secondary" style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                            Chi tiết
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="panel" style={{ textAlign: 'center', opacity: 0.7 }}>Chưa có hóa đơn nào.</div>
                )}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="panel">Không tìm thấy phòng.</div>
      )}
    </div>
  );
}