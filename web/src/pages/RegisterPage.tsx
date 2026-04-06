import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register } from '../api/api';
import { RegisterPayload } from '../types';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('NGUOI_THUE');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    const payload: RegisterPayload = {
      ten_dang_nhap: username.trim(),
      password: password.trim(),
      vai_tro: role,
      ho_ten: fullName.trim(),
      email: email.trim(),
      so_dien_thoai: phone.trim()
    };

    setLoading(true);
    try {
      await register(payload);
      setSuccess('Đăng ký thành công. Bạn có thể đăng nhập ngay.');
      setUsername('');
      setPassword('');
      setFullName('');
      setEmail('');
      setPhone('');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đăng ký');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '48px 24px' }}>
      <div className="login-card">
        <h1>Đăng ký</h1>
        <p className="text-muted">Tạo tài khoản chủ trọ hoặc người thuê.</p>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
          <div>
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="role">Vai trò</label>
            <select id="role" value={role} onChange={(event) => setRole(event.target.value)}>
              <option value="NGUOI_THUE">Người thuê</option>
              <option value="CHU_TRO">Chủ trọ</option>
            </select>
          </div>
          <div>
            <label htmlFor="fullName">Họ và tên</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="phone">Số điện thoại</label>
            <input
              id="phone"
              type="text"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          {error ? <div className="form-error">{error}</div> : null}
          {success ? <div className="form-success">{success}</div> : null}
          <button type="submit" className="button button-primary" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
          <div className="login-footer">
            <small className="text-muted">Sau khi đăng ký, bạn sẽ được chuyển đến trang đăng nhập.</small>
          </div>
          <div className="auth-switch">
            <span>Đã có tài khoản?</span>
            <button type="button" className="button button-secondary" onClick={() => navigate('/login')}>
              Đăng nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
