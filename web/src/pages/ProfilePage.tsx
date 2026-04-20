import { FormEvent, useEffect, useState } from 'react';
import { changePassword, fetchProfile, updateProfile, resendVerificationEmail, fetchBankInfo, fetchBanks, updateBankInfo } from '../api/api';
import { ProfileUpdatePayload, User, BankInfo } from '../types';

type Props = {
  user: User;
  onUpdateUser: (user: User | null) => void;
};

export default function ProfilePage({ user, onUpdateUser }: Props) {
  const [profile, setProfile] = useState<Record<string, any>>({});
  const [hoTen, setHoTen] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Bank Info state
  const [bankInfo, setBankInfo] = useState<BankInfo>({ so_tai_khoan: '', ten_ngan_hang: '', ma_ngan_hang: '' });
  const [banks, setBanks] = useState<any[]>([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSuccess, setBankSuccess] = useState('');
  const [qrPreview, setQrPreview] = useState<string | null>(null);

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
  }, [user.vai_tro]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const payload: ProfileUpdatePayload = {
      ho_ten: hoTen.trim(),
      email: email.trim(),
      so_dien_thoai: phone.trim(),
      dia_chi: address.trim()
    };

    try {
      const response = await updateProfile(user.vai_tro, payload);
      setSuccess(response.message || 'Cập nhật thành công');
      const updatedProfile = response.data || payload;
      onUpdateUser({ ...user, profile: updatedProfile });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật profile');
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
      const response = await changePassword({ mat_khau_cu: currentPassword, mat_khau_moi: newPassword });
      setPasswordSuccess(response.message || 'Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Không thể đổi mật khẩu');
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleResendVerification() {
    setResendLoading(true);
    try {
      const response = await resendVerificationEmail(profile.email || email);
      setSuccess(response.message || 'Email xác thực đã được gửi lại. Vui lòng kiểm tra inbox.');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi lại email xác thực');
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
                  backgroundColor: profile.email_verified ? '#ecfdf5' : '#fff7ed',
                  border: `1px solid ${profile.email_verified ? '#6ee7b7' : '#fed7aa'}`,
                  borderRadius: '8px',
                  fontSize: '0.9rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span>{profile.email_verified ? '✅' : '⚠️'}</span>
                    <strong>{profile.email_verified ? 'Đã xác thực email' : 'Chưa xác thực email'}</strong>
                  </div>
                  {!profile.email_verified && (
                    <button 
                      className="button button-primary"
                      type="button"
                      onClick={handleResendVerification}
                      disabled={resendLoading}
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    >
                      {resendLoading ? 'Đang gửi...' : 'Gửi lại mã xác thực'}
                    </button>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label htmlFor="hoTen">Họ và tên</label>
                  <input id="hoTen" value={hoTen} onChange={(event) => setHoTen(event.target.value)} required />
                </div>
                <div>
                  <label>Số CCCD / Định danh</label>
                  <input value={profile.cccd || ''} readOnly disabled style={{ background: '#f3f4f6', cursor: 'not-allowed' }} />
                  <small className="text-muted">Liên hệ chủ trọ nếu cần thay đổi CCCD.</small>
                </div>
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
    </div>
  );
}
        