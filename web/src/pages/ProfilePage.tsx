import { FormEvent, useEffect, useState } from 'react';
import { changePassword, fetchProfile, updateProfile, resendVerificationEmail, fetchBankInfo, fetchBanks, updateBankInfo, fetchContracts, requestVerification } from '../api/api';
import { ProfileUpdatePayload, User, BankInfo, Contract } from '../types';

type Props = {
  user: User;
  onUpdateUser: (user: User | null) => void;
};

export default function ProfilePage({ user, onUpdateUser }: Props) {
  // ==================== THÔNG TIN CÁ NHÂN ====================
  const [profile, setProfile] = useState<Record<string, any>>({});
  const [hoTen, setHoTen] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  // ==================== NGÂN HÀNG (chỉ CHU_TRO) ====================
  const [bankInfo, setBankInfo] = useState<BankInfo>({ so_tai_khoan: '', ten_ngan_hang: '', ma_ngan_hang: '' });
  const [banks, setBanks] = useState<any[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSuccess, setBankSuccess] = useState('');
  const [qrPreview, setQrPreview] = useState<string | null>(null);

  // ==================== ĐỔI MẬT KHẨU ====================
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // ==================== HỢP ĐỒNG CỦA TÔI ====================
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const promises: [Promise<any>, Promise<any>?, Promise<any>?] = [fetchProfile(user.vai_tro)];
    
    if (user.vai_tro === 'CHU_TRO') {
      promises.push(fetchBankInfo());
      promises.push(fetchBanks());
    }

    Promise.all(promises)
      .then(([profileResult, bankResult, banksResult]) => {
        setProfile(profileResult);
        setHoTen(profileResult.ho_ten || '');
        setEmail(profileResult.email || '');
        setPhone(profileResult.so_dien_thoai || '');
        setAddress(profileResult.dia_chi || '');
        
        if (bankResult) {
          setBankInfo(bankResult.data);
          setQrPreview(bankResult.qr_preview);
        }
        if (banksResult) {
          setBanks(banksResult);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu'))
      .finally(() => setLoading(false));

    // Load hợp đồng của người dùng hiện tại
    setContractsLoading(true);
    fetchContracts()
      .then(setContracts)
      .catch(() => {})
      .finally(() => setContractsLoading(false));
  }, [user.vai_tro]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const payload: ProfileUpdatePayload = {
      ho_ten: hoTen.trim(),
      email: email.trim(),
      so_dien_thoai: phone.trim(),
      dia_chi: address.trim(),
    };

    try {
      const res = await updateProfile(user.vai_tro, payload);
      setSuccess('Cập nhật thông tin thành công');
      onUpdateUser({ ...user, profile: res.data || payload });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  }

  async function handleBankSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBankLoading(true);
    setBankSuccess('');
    try {
      const response = await updateBankInfo(bankInfo);
      setBankSuccess(response.message || 'Cập nhật ngân hàng thành công');
      setQrPreview(response.qr_mau);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi cập nhật ngân hàng');
    } finally {
      setBankLoading(false);
    }
  }

  async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu mới và xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changePassword({
        mat_khau_cu: currentPassword,
        mat_khau_moi: newPassword,
      });
      setPasswordSuccess(res.message || 'Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Đổi mật khẩu thất bại');
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleResendVerification() {
    setResendLoading(true);
    try {
      await resendVerificationEmail(email);
      setSuccess('Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gửi lại email thất bại');
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 24, paddingBottom: 40 }}>
      {/* Thông tin cơ bản */}
      <section>
        <div className="section-title">
          <div>
            <h2>Hồ sơ cá nhân</h2>
            <p className="text-muted">Cập nhật thông tin cơ bản để mọi người nhận diện bạn.</p>
          </div>
        </div>
        {loading ? (
          <div className="panel">Đang tải thông tin...</div>
        ) : (
          <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
            <div className="card">
              <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #eee' }}>
                <p style={{ margin: '0 0 4px 0' }}>Tên đăng nhập: <strong>{user.ten_dang_nhap}</strong></p>
                <p style={{ margin: 0 }}>Vai trò: <span className="badge badge-info">{user.vai_tro}</span></p>
              </div>

              {/* Status xác thực cho Chủ trọ */}
              {user.vai_tro === 'CHU_TRO' && (
                <div style={{ 
                  padding: '16px',
                  marginBottom: '20px',
                  backgroundColor: profile.verification_status === 2 ? '#ecfdf5' : 
                                 profile.verification_status === 1 ? '#eff6ff' : '#fff7ed',
                  border: `1px solid ${profile.verification_status === 2 ? '#6ee7b7' : 
                                     profile.verification_status === 1 ? '#93c5fd' : '#fed7aa'}`,
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <strong>
                      {profile.verification_status === 2 ? 'Tài khoản đã xác thực' : 
                       profile.verification_status === 1 ? 'Đang chờ Admin duyệt' : 
                       profile.verification_status === 3 ? 'Yêu cầu xác thực bị từ chối' : 'Tài khoản chưa xác thực'}
                    </strong>
                  </div>
                  
                  {(profile.verification_status === 0 || profile.verification_status === 3) && (
                    <button 
                      className="button button-primary"
                      type="button"
                      onClick={async () => {
                        try {
                          await requestVerification();
                          setSuccess('Gửi yêu cầu xác thực thành công!');
                          setProfile({...profile, verification_status: 1});
                        } catch (err) {
                          setError(err instanceof Error ? err.message : 'Gửi yêu cầu thất bại');
                        }
                      }}
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    >
                      {profile.verification_status === 3 ? 'Gửi lại yêu cầu xác thực' : 'Gửi yêu cầu xác thực tài khoản'}
                    </button>
                  )}

                  {profile.verification_status === 1 && (
                    <p className="text-muted" style={{ margin: 0, fontSize: '0.8rem' }}>
                      Yêu cầu của bạn đang được xem xét. Chúng tôi sẽ thông báo cho bạn sớm nhất.
                    </p>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label htmlFor="hoTen">Họ và tên</label>
                  <input id="hoTen" value={hoTen} onChange={(event) => setHoTen(event.target.value)} required />
                </div>
                {user.vai_tro === 'NGUOI_THUE' && (
                  <div>
                    <label>Số CCCD / Định danh</label>
                    <input value={profile.cccd || ''} readOnly disabled style={{ background: '#f3f4f6', cursor: 'not-allowed' }} />
                    <small className="text-muted">Liên hệ chủ trọ nếu cần thay đổi CCCD.</small>
                  </div>
                )}
                <div>
                  <label htmlFor="email">Email</label>
                  <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </div>
                <div>
                  <label htmlFor="phone">Số điện thoại</label>
                  <input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} required />
                </div>
                {user.vai_tro === 'CHU_TRO' && (
                  <div>
                    <label htmlFor="address">Địa chỉ liên hệ</label>
                    <input id="address" value={address} onChange={(event) => setAddress(event.target.value)} />
                  </div>
                )}
                {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
                {success && <div style={{ color: '#0f766e' }}>{success}</div>}
                <button type="submit" className="button button-primary" disabled={loading}>
                  {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </form>
            </div>

            <div className="card shadow-sm">
              <h3>Đổi mật khẩu</h3>
              <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 20 }}>Cập nhật mật khẩu thường xuyên để bảo mật tài khoản.</p>
              <form onSubmit={handlePasswordChange} style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label>Mật khẩu hiện tại</label>
                  <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                </div>
                <div>
                  <label>Mật khẩu mới</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                </div>
                <div>
                  <label>Xác nhận mật khẩu mới</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                </div>
                {passwordError && <div style={{ color: '#b91c1c' }}>{passwordError}</div>}
                {passwordSuccess && <div style={{ color: '#0f766e' }}>{passwordSuccess}</div>}
                <button type="submit" className="button button-secondary" disabled={passwordLoading}>
                  {passwordLoading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                </button>
              </form>
            </div>
          </div>
        )}
      </section>

      {/* Thông tin ngân hàng dành cho Chủ trọ */}
      {user.vai_tro === 'CHU_TRO' && (
        <section>
          <div className="section-title">
            <div>
              <h2>Thông tin thanh toán (VietQR)</h2>
              <p className="text-muted">Dùng để tự động tạo mã QR khi người thuê thanh toán hóa đơn.</p>
            </div>
          </div>
          <div className="grid-2" style={{ gap: 24, alignItems: 'start' }}>
            <div className="card">
              <form onSubmit={handleBankSubmit} style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label>Chọn Ngân hàng</label>
                  <select 
                    value={bankInfo.ma_ngan_hang} 
                    onChange={e => {
                      const selected = banks.find(b => b.ma_bin === e.target.value);
                      setBankInfo({ ...bankInfo, ma_ngan_hang: e.target.value, ten_ngan_hang: selected?.ten || '' });
                    }}
                    required
                  >
                    <option value="">-- Chọn ngân hàng --</option>
                    {banks.map(bank => (
                      <option key={bank.ma_bin} value={bank.ma_bin}>{bank.ten_viet_tat} - {bank.ten}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Số tài khoản</label>
                  <input 
                    type="text" 
                    value={bankInfo.so_tai_khoan} 
                    onChange={e => setBankInfo({ ...bankInfo, so_tai_khoan: e.target.value })} 
                    placeholder="Nhập số tài khoản ngân hàng"
                    required
                  />
                </div>
                {bankSuccess && <div style={{ color: '#0f766e' }}>{bankSuccess}</div>}
                <button type="submit" className="button button-primary" disabled={bankLoading} style={{ backgroundColor: '#059669' }}>
                  {bankLoading ? 'Đang lưu...' : 'Lưu thông tin ngân hàng'}
                </button>
              </form>
            </div>

            <div className="card" style={{ textAlign: 'center' }}>
              <h3>Mã QR mẫu</h3>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>Đây là mã QR mẫu với thông tin của bạn.</p>
              <div style={{ marginTop: 16, padding: 16, backgroundColor: '#f9fafb', borderRadius: 8 }}>
                {qrPreview ? (
                  <img src={qrPreview} alt="QR Preview" style={{ maxWidth: 200, width: '100%', height: 'auto' }} />
                ) : (
                  <div style={{ padding: '40px 20px', color: '#9ca3af', border: '2px dashed #e5e7eb' }}>
                    Nhập thông tin ngân hàng để xem trước mã QR
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* HỢP ĐỒNG CỦA TÔI */}
      <section>
        <div className="section-title">
          <div>
            <h2>Hợp đồng của tôi</h2>
            <p className="text-muted">Danh sách các hợp đồng thuê nhà liên quan đến bạn.</p>
          </div>
        </div>
        <div className="card">
          {contractsLoading ? (
            <div className="panel">Đang tải hợp đồng...</div>
          ) : contracts.length === 0 ? (
            <div className="panel text-muted">Bạn chưa có hợp đồng nào.</div>
          ) : (
            <div className="list-card">
              {contracts.map((ct) => (
                <div key={ct.id_hop_dong} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #eee' }}>
                  <div>
                    <strong>Hợp đồng #{ct.id_hop_dong}</strong>
                    <br />
                    <small>Phòng: {ct.Phong?.ten_phong || ct.id_phong}</small>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {new Date(ct.ngay_bat_dau).toLocaleDateString('vi-VN')} → {new Date(ct.ngay_ket_thuc).toLocaleDateString('vi-VN')}
                    <br />
                    <small className={`badge ${ct.trang_thai === 1 ? 'badge-success' : 'badge-warning'}`}>
                      {ct.trang_thai === 1 ? 'Đang hoạt động' : 'Chưa kích hoạt'}
                    </small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}