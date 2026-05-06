
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  fetchProfile,
  updateProfile,
  changePassword,
  resendVerificationEmail,
  getBanks,
  getBankInfo,
  updateBankInfo,
  fetchContracts,
} from '../api/api';
import { ProfileUpdatePayload, User, Contract } from '../types';

type Props = {
  user: User;
  onUpdateUser: (user: User | null) => void;
};

export default function ProfilePage({ user, onUpdateUser }: Props) {
  const { isLandlord } = useAuth();

  // ==================== THÔNG TIN CÁ NHÂN ====================
  const [profile, setProfile] = useState<Record<string, any>>({});
  const [hoTen, setHoTen] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ==================== NGÂN HÀNG (chỉ CHU_TRO) ====================
  const [banks, setBanks] = useState<any[]>([]);
  const [bankInfo, setBankInfo] = useState({
    so_tai_khoan: '',
    ten_ngan_hang: '',
    ma_ngan_hang: '',
  });
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSuccess, setBankSuccess] = useState('');
  const [bankError, setBankError] = useState('');

  // ==================== ĐỔI MẬT KHẨU ====================
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // ==================== HỢP ĐỒNG CỦA TÔI ====================
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);

  // Load dữ liệu ban đầu
  useEffect(() => {
    setLoading(true);
    fetchProfile(user.vai_tro)
      .then((data) => {
        setProfile(data);
        setHoTen(data.ho_ten || '');
        setEmail(data.email || '');
        setPhone(data.so_dien_thoai || '');
        setAddress(data.dia_chi || '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được profile'))
      .finally(() => setLoading(false));

    // Load danh sách ngân hàng + thông tin ngân hàng của chủ trọ
    if (user.vai_tro === 'CHU_TRO') {
      getBanks().then(setBanks).catch(() => {});
      getBankInfo()
        .then((res) => {
          if (res.data) {
            setBankInfo({
              so_tai_khoan: res.data.so_tai_khoan || '',
              ten_ngan_hang: res.data.ten_ngan_hang || '',
              ma_ngan_hang: res.data.ma_ngan_hang || '',
            });
          }
        })
        .catch(() => {});
    }

    // Load hợp đồng của người dùng hiện tại (cả CHU_TRO và NGUOI_THUE đều dùng được)
    setContractsLoading(true);
    fetchContracts()
      .then(setContracts)
      .catch(() => {})
      .finally(() => setContractsLoading(false));
  }, [user.vai_tro]);

  // Cập nhật thông tin cá nhân
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

  // Cập nhật ngân hàng
  async function handleUpdateBank(e: FormEvent) {
    e.preventDefault();
    setBankError('');
    setBankSuccess('');
    setBankLoading(true);

    try {
      await updateBankInfo(bankInfo);
      setBankSuccess('✅ Thông tin ngân hàng đã được lưu');
    } catch (err) {
      setBankError(err instanceof Error ? err.message : 'Cập nhật ngân hàng thất bại');
    } finally {
      setBankLoading(false);
    }
  }

  // Đổi mật khẩu
  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
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
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Đổi mật khẩu thất bại');
    } finally {
      setPasswordLoading(false);
    }
  }

  // Gửi lại email xác thực
  async function handleResend() {
    try {
      await resendVerificationEmail(email);
      setSuccess('Email xác thực đã được gửi lại. Vui lòng kiểm tra hộp thư.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gửi lại email thất bại');
    }
  }

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Hồ sơ cá nhân</h2>
          <p className="text-muted">Quản lý thông tin và tài khoản của bạn</p>
        </div>
      </div>

      {loading ? (
        <div className="panel">Đang tải...</div>
      ) : (
        <>
          {/* Thông tin cá nhân */}
          <div className="card" style={{ maxWidth: 560 }}>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
              <div>
                <label>Tên đăng nhập</label>
                <input type="text" value={user.ten_dang_nhap} disabled />
              </div>

              <div>
                <label>Họ và tên</label>
                <input value={hoTen} onChange={(e) => setHoTen(e.target.value)} required />
              </div>

              <div>
                <label>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div>
                <label>Số điện thoại</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              {user.vai_tro === 'CHU_TRO' && (
                <div>
                  <label>Địa chỉ</label>
                  <input value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
              )}

              {error && <div style={{ color: '#b91c1c' }}>{error}</div>}
              {success && <div style={{ color: '#0f766e' }}>{success}</div>}

              <button type="submit" className="button button-primary" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </form>
          </div>

          {/* Thông tin ngân hàng - CHỈ CHỦ TRỌ */}
          {user.vai_tro === 'CHU_TRO' && (
            <div className="card" style={{ maxWidth: 560, marginTop: 24 }}>
              <h3>Thông tin ngân hàng nhận tiền</h3>
              <p className="text-muted">Dùng để tạo mã QR VietQR cho người thuê</p>

              <form onSubmit={handleUpdateBank} style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label>Ngân hàng</label>
                  <select
                    value={bankInfo.ma_ngan_hang}
                    onChange={(e) => {
                      const selected = banks.find((b) => b.ma_bin === e.target.value);
                      setBankInfo({
                        ...bankInfo,
                        ma_ngan_hang: e.target.value,
                        ten_ngan_hang: selected?.ten || '',
                      });
                    }}
                  >
                    <option value="">Chọn ngân hàng</option>
                    {banks.map((bank) => (
                      <option key={bank.ma_bin} value={bank.ma_bin}>
                        {bank.ten} ({bank.ten_viet_tat})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>Số tài khoản</label>
                  <input
                    type="text"
                    value={bankInfo.so_tai_khoan}
                    onChange={(e) => setBankInfo({ ...bankInfo, so_tai_khoan: e.target.value })}
                    placeholder="1234567890"
                  />
                </div>

                {bankError && <div style={{ color: '#b91c1c' }}>{bankError}</div>}
                {bankSuccess && <div style={{ color: '#0f766e' }}>{bankSuccess}</div>}

                <button type="submit" className="button button-primary" disabled={bankLoading}>
                  {bankLoading ? 'Đang lưu...' : 'Lưu thông tin ngân hàng'}
                </button>
              </form>

              {/* Preview QR */}
              {bankInfo.so_tai_khoan && bankInfo.ma_ngan_hang && (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <p style={{ fontWeight: 600 }}>Preview mã QR nhận tiền</p>
                  <img
                    src={`https://img.vietqr.io/image/${bankInfo.ma_ngan_hang}-${bankInfo.so_tai_khoan}-compact2.png?amount=10000`}
                    alt="QR Preview"
                    style={{ maxWidth: 280, borderRadius: 12, border: '1px solid #ddd' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* HỢP ĐỒNG CỦA TÔI - Cả CHU_TRO và NGUOI_THUE đều xem được */}
          <div className="section-title" style={{ marginTop: 32 }}>
            <h2>Hợp đồng của tôi</h2>
          </div>
          <div className="card">
            {contractsLoading ? (
              <div className="panel">Đang tải hợp đồng...</div>
            ) : contracts.length === 0 ? (
              <div className="panel text-muted">Bạn chưa có hợp đồng nào.</div>
            ) : (
              <div className="list-card">
                {contracts.map((ct) => (
                  <div key={ct.id_hop_dong} className="list-item">
                    <div>
                      <strong>Hợp đồng #{ct.id_hop_dong}</strong>
                      <br />
                      <small>Phòng: {ct.Phong?.ten_phong || ct.id_phong}</small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {ct.ngay_bat_dau} → {ct.ngay_ket_thuc}
                      <br />
                      <small style={{ color: ct.trang_thai === 1 ? '#10b981' : '#f59e0b' }}>
                        {ct.trang_thai === 1 ? 'Đang hoạt động' : 'Chưa kích hoạt'}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Đổi mật khẩu */}
          <div className="section-title" style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <h2>Đổi mật khẩu</h2>
              <button
                className="button button-secondary"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
              >
                {showPasswordForm ? 'Ẩn' : 'Đổi mật khẩu'}
              </button>
            </div>
          </div>

          {showPasswordForm && (
            <div className="card" style={{ maxWidth: 560 }}>
              <form onSubmit={handlePasswordChange} style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label>Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>Mật khẩu mới</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {passwordError && <div style={{ color: '#b91c1c' }}>{passwordError}</div>}
                {passwordSuccess && <div style={{ color: '#0f766e' }}>{passwordSuccess}</div>}

                <button type="submit" className="button button-primary" disabled={passwordLoading}>
                  {passwordLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}