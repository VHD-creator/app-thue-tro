import { FormEvent, useEffect, useState } from 'react';
import { changePassword, fetchProfile, updateProfile } from '../api/api';
import { ProfileUpdatePayload, User } from '../types';

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

  useEffect(() => {
    setLoading(true);
    fetchProfile(user.vai_tro)
      .then((result) => {
        setProfile(result);
        setHoTen(result.ho_ten || '');
        setEmail(result.email || '');
        setPhone(result.so_dien_thoai || '');
        setAddress(result.dia_chi || '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải profile'))
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

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Hồ sơ</h2>
          <p className="text-muted">Cập nhật thông tin cá nhân của bạn.</p>
        </div>
      </div>
      {loading ? (
        <div className="panel">Đang tải thông tin...</div>
      ) : (
        <div className="card" style={{ maxWidth: 560 }}>
          <div style={{ marginBottom: 20 }}>
            <p>
              <strong>Tên đăng nhập:</strong> {user.ten_dang_nhap}
            </p>
            <p>
              <strong>Vai trò:</strong> {user.vai_tro}
            </p>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            <div>
              <label htmlFor="hoTen">Họ và tên</label>
              <input id="hoTen" value={hoTen} onChange={(event) => setHoTen(event.target.value)} />
            </div>
            <div>
              <label htmlFor="email">Email</label>
              <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div>
              <label htmlFor="phone">Số điện thoại</label>
              <input id="phone" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </div>
            {user.vai_tro === 'CHU_TRO' ? (
              <div>
                <label htmlFor="address">Địa chỉ</label>
                <input id="address" value={address} onChange={(event) => setAddress(event.target.value)} />
              </div>
            ) : null}
            {error ? <div style={{ color: '#b91c1c', fontWeight: 600 }}>{error}</div> : null}
            {success ? <div style={{ color: '#0f766e', fontWeight: 600 }}>{success}</div> : null}
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
          </form>
        </div>
      )}

      <div className="section-title" style={{ marginTop: 24 }}>
        <div>
          <h2>Đổi mật khẩu</h2>
          <p className="text-muted">Bảo mật tài khoản bằng mật khẩu mới.</p>
        </div>
        <button type="button" className="button button-secondary" onClick={() => setShowPasswordForm((value) => !value)}>
          {showPasswordForm ? 'Ẩn' : 'Đổi mật khẩu'}
        </button>
      </div>

      {showPasswordForm ? (
        <div className="card" style={{ maxWidth: 640, padding: 24 }}>
          <form onSubmit={handlePasswordChange} style={{ display: 'grid', gap: 16 }}>
            <div>
              <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="newPassword">Mật khẩu mới</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </div>
            {passwordError ? <div style={{ color: '#b91c1c', fontWeight: 600 }}>{passwordError}</div> : null}
            {passwordSuccess ? <div style={{ color: '#0f766e', fontWeight: 600 }}>{passwordSuccess}</div> : null}
            <button type="submit" className="button button-primary" disabled={passwordLoading}>
              {passwordLoading ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
