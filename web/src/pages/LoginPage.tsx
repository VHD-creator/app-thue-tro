import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../api/api';
import { LoginPayload, User } from '../types';


type Props = {
  onLogin: (user: User) => void;
};

export default function LoginPage({ onLogin }: Props) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);

    const payload: LoginPayload = {
      ten_dang_nhap: username.trim(),
      password: password.trim()
    };

    try {
      const response = await login(payload);
      onLogin(response.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi đăng nhập');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '48px 24px' }}>
      <div className="login-card">
        <h1>Đăng nhập</h1>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
          <div>
            <label htmlFor="username">Tên đăng nhập / Email</label>
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
          <div style={{ textAlign: 'right', marginTop: '-8px' }}>
            <Link to="/forgot-password" style={{ fontSize: '14px', color: 'var(--primary-color)' }}>
              Quên mật khẩu?
            </Link>
          </div>
          {error ? <div className="form-error">{error}</div> : null}
          <button type="submit" className="button button-primary" disabled={loading}>
            {loading ? 'Đang tải...' : 'Đăng nhập'}
          </button>
          <div className="login-footer">
            <small className="text-muted">Bạn có thể sử dụng tài khoản đã tạo trên ứng dụng Android.</small>
          </div>
          <div className="auth-switch">
            <span>Chưa có tài khoản?</span>
            <Link to="/register" className="button button-secondary">
              Đăng ký
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
