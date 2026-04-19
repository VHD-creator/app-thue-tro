import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, resendVerificationEmail } from '../api/api';
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
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');

    // Validate email required for CHU_TRO
    if (role === 'CHU_TRO' && !email.trim()) {
      setError('Chủ trọ phải cung cấp email để xác thực');
      return;
    }

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
      const response = await register(payload);
      
      if (role === 'CHU_TRO') {
        // Show verification prompt for CHU_TRO
        setSuccess(response.message || 'Đăng ký thành công. Vui lòng kiểm tra email để xác thực.');
        setShowVerificationPrompt(true);
        setUsername('');
        setPassword('');
        setFullName('');
        setEmail('');
        setPhone('');
      } else {
        // Direct login for NGUOI_THUE
        setSuccess('Đăng ký thành công. Bạn có thể đăng nhập ngay.');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể đăng ký');
    } finally {
      setLoading(false);
    }
  }

  async function handleResendVerification() {
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }

    setResendLoading(true);
    try {
      const response = await resendVerificationEmail(email.trim());
      setSuccess(response.message || 'Email xác thực đã được gửi lại. Vui lòng kiểm tra inbox.');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể gửi lại email xác thực');
    } finally {
      setResendLoading(false);
    }
  }

  if (showVerificationPrompt) {
    return (
      <div style={{ padding: '48px 24px' }}>
        <div className="login-card">
          <h1>✉️ Xác thực Email</h1>
          <p className="text-muted">Email xác thực đã được gửi đến <strong>{email}</strong></p>
          
          <div style={{ 
            padding: '16px', 
            margin: '20px 0', 
            backgroundColor: '#f0f9ff', 
            border: '1px solid #0284c7',
            borderRadius: '8px',
            color: '#0c4a6e'
          }}>
            <p><strong>Bước tiếp theo:</strong></p>
            <ol>
              <li>Kiểm tra email (bao gồm thư rác)</li>
              <li>Click vào link xác thực trong email</li>
              <li>Sau khi xác thực, bạn có thể đăng nhập và tạo phòng</li>
            </ol>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label htmlFor="verifyEmail">Nhập lại email để gửi lại link:</label>
            <input
              id="verifyEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </div>

          {error ? <div className="form-error" style={{ marginBottom: '16px' }}>{error}</div> : null}
          {success ? <div className="form-success" style={{ marginBottom: '16px' }}>{success}</div> : null}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
            <button 
              className="button button-primary" 
              onClick={handleResendVerification}
              disabled={resendLoading}
            >
              {resendLoading ? 'Đang gửi...' : '📨 Gửi lại link xác thực'}
            </button>
            <button 
              className="button button-secondary" 
              onClick={() => navigate('/login')}
            >
              Quay lại đăng nhập
            </button>
          </div>

          <div style={{ 
            padding: '12px', 
            backgroundColor: '#fef3c7',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#92400e'
          }}>
            💡 <strong>Tip:</strong> Email xác thực có hiệu lực trong 24 giờ. Sau đó, bạn sẽ cần gửi lại.
          </div>
        </div>
      </div>
    );
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
              <option value="CHU_TRO">Chủ trọ (yêu cầu xác thực email)</option>
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
            <label htmlFor="email">
              Email {role === 'CHU_TRO' && <span style={{ color: '#dc2626' }}>*</span>}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required={role === 'CHU_TRO'}
            />
            {role === 'CHU_TRO' && (
              <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                Chủ trọ bắt buộc xác thực email để tạo phòng
              </small>
            )}
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
            <small className="text-muted">
              {role === 'CHU_TRO' 
                ? 'Sau đăng ký, vui lòng xác thực email để kích hoạt tài khoản.'
                : 'Sau khi đăng ký, bạn sẽ được chuyển đến trang đăng nhập.'}
            </small>
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
