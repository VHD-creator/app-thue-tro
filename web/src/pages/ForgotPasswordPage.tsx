import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../api/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Nhập email, 2: Nhập OTP & Mật khẩu mới
  
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Gửi yêu cầu lấy mã OTP
  async function handleRequestOtp(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await forgotPassword(email);
      setMessage(response.message || 'Mã xác nhận đã được gửi về Email của bạn.');
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
    } finally {
      setLoading(false);
    }
  }

  // Gửi OTP và mật khẩu mới
  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      return setError('Mật khẩu xác nhận không khớp');
    }
    if (password.length < 6) {
      return setError('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    setLoading(true);
    setError('');

    try {
      const response = await resetPassword(otp, password);
      setMessage(response.message || 'Đặt lại mật khẩu thành công!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mã xác nhận không đúng hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: '48px 24px' }}>
      <div className="login-card">
        <h1>{step === 1 ? 'Quên mật khẩu' : 'Xác nhận mã OTP'}</h1>
        <p className="text-muted" style={{ marginTop: '8px' }}>
          {step === 1 
            ? 'Nhập email bạn đã đăng ký để nhận mã xác nhận.' 
            : `Hệ thống đã gửi mã 6 số về email ${email}. Vui lòng kiểm tra.`
          }
        </p>

        {step === 1 ? (
          <form onSubmit={handleRequestOtp} style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
            <div>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
              />
            </div>
            {error && <div className="form-error">{error}</div>}
            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi mã xác nhận'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <Link to="/login" className="text-muted" style={{ fontSize: '14px' }}>Quay lại đăng nhập</Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={{ display: 'grid', gap: '16px', marginTop: '24px' }}>
            <div>
              <label htmlFor="otp">Mã xác nhận (6 số)</label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Nhập 6 chữ số"
                maxLength={6}
                required
                style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '5px' }}
              />
            </div>
            <div>
              <label htmlFor="password">Mật khẩu mới</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ít nhất 6 ký tự"
                required
              />
            </div>
            <div>
              <label htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                required
              />
            </div>

            {error && <div className="form-error">{error}</div>}
            {message && <div style={{ color: '#2c7a7b', textAlign: 'center' }}>{message}</div>}

            <button type="submit" className="button button-primary" disabled={loading}>
              {loading ? 'Đang xác nhận...' : 'Đổi mật khẩu'}
            </button>
            
            <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '20px' }}>
              <button 
                type="button" 
                onClick={handleRequestOtp} 
                className="text-muted" 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: 'var(--primary-color)' }}
                disabled={loading}
              >
                Gửi lại mã
              </button>
              <button 
                type="button" 
                onClick={() => setStep(1)} 
                className="text-muted" 
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
              >
                Đổi Email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
