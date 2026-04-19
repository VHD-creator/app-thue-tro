import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../api/api';

export default function VerificationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token xác thực không hợp lệ');
      return;
    }

    async function verify() {
      try {
        const response = await verifyEmail(token);
        setStatus('success');
        setMessage(response.message || 'Email xác thực thành công! 🎉');
        
        // Store token if available
        if (response.user) {
          // User info is returned, auto-login could be implemented here
        }

        setTimeout(() => navigate('/login'), 2000);
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Xác thực email thất bại');
      }
    }

    verify();
  }, [token, navigate]);

  return (
    <div style={{ padding: '48px 24px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="login-card" style={{ maxWidth: '400px', textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <h1>⏳ Đang xác thực...</h1>
            <p className="text-muted">Vui lòng chờ một chút</p>
            <div style={{ 
              marginTop: '24px', 
              fontSize: '48px', 
              animation: 'spin 2s linear infinite' 
            }}>
              ⏳
            </div>
            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </>
        )}

        {status === 'success' && (
          <>
            <h1>✅ Thành công!</h1>
            <p style={{ fontSize: '24px', marginTop: '16px', color: '#10b981' }}>
              {message}
            </p>
            <p className="text-muted" style={{ marginTop: '16px' }}>
              Bạn sẽ được chuyển đến trang đăng nhập...
            </p>
            <div style={{ marginTop: '32px' }}>
              <button 
                className="button button-primary"
                onClick={() => navigate('/login')}
              >
                Quay lại đăng nhập
              </button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <h1>❌ Lỗi xác thực</h1>
            <p style={{ fontSize: '18px', marginTop: '16px', color: '#dc2626' }}>
              {message}
            </p>
            <div style={{ 
              padding: '16px', 
              marginTop: '24px',
              backgroundColor: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              color: '#7f1d1d'
            }}>
              <p>
                <strong>Có thể là:</strong>
              </p>
              <ul style={{ textAlign: 'left', margin: '8px 0 0 0' }}>
                <li>Token đã hết hiệu lực (24 giờ)</li>
                <li>Token bị sai lệch</li>
                <li>Email đã được xác thực trước đó</li>
              </ul>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                className="button button-primary"
                onClick={() => navigate('/register')}
              >
                Quay lại đăng ký
              </button>
              <button 
                className="button button-secondary"
                onClick={() => navigate('/login')}
              >
                Đăng nhập
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
