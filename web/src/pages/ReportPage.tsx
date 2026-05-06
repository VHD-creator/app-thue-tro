import { useEffect, useState } from 'react';
import { fetchRevenueReport } from '../api/api';
import { User } from '../types';

export default function ReportPage({ user }: { user: User }) {
  const [data, setData] = useState<Array<{ label: string; value: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRevenueReport()
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="panel animate-pulse">Đang tải báo cáo doanh thu...</div>;
  if (error) return <div className="panel" style={{ color: 'red' }}>Lỗi: {error}</div>;

  const totalRevenue = data.reduce((sum, item) => sum + item.value, 0);
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="report-page">
      <div className="section-title">
        <div>
          <h2>Báo cáo doanh thu</h2>
          <p className="text-muted">Thống kê doanh thu 6 tháng gần nhất cho tài khoản của bạn.</p>
        </div>
      </div>

      <div className="grid-3" style={{ marginBottom: 32 }}>
        <div className="card shadow-sm" style={{ padding: 24, background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white' }}>
          <h3 style={{ opacity: 0.9, fontSize: '0.9rem' }}>Tổng doanh thu thực tế</h3>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{totalRevenue.toLocaleString()} VNĐ</div>
            <p style={{ marginTop: 4, opacity: 0.8 }}>Dựa trên các hóa đơn đã thanh toán</p>
          </div>
        </div>
        
        <div className="card shadow-sm" style={{ padding: 24 }}>
          <h3 className="text-muted" style={{ fontSize: '0.9rem' }}>Tháng cao nhất</h3>
          <div style={{ marginTop: 12 }}>
             <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{data.sort((a,b) => b.value - a.value)[0]?.label || 'N/A'}</div>
             <p className="text-muted" style={{ marginTop: 4 }}>Doanh thu đạt đỉnh</p>
          </div>
        </div>

        <div className="card shadow-sm" style={{ padding: 24 }}>
          <h3 className="text-muted" style={{ fontSize: '0.9rem' }}>Trung bình tháng</h3>
          <div style={{ marginTop: 12 }}>
             <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{(totalRevenue / (data.length || 1)).toLocaleString()} VNĐ</div>
             <p className="text-muted" style={{ marginTop: 4 }}>Tính trong kỳ báo cáo</p>
          </div>
        </div>
      </div>

      <div className="card shadow-sm" style={{ padding: 24 }}>
        <h3 style={{ marginBottom: 24 }}>Biểu đồ tăng trưởng</h3>
        <div className="chart-container" style={{ display: 'flex', alignItems: 'flex-end', height: 300, gap: 12, paddingBottom: 24 }}>
          {data.map((item, idx) => (
            <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div 
                className="chart-bar" 
                style={{ 
                  width: '100%', 
                  height: `${(item.value / maxValue) * 250}px`, 
                  background: 'linear-gradient(180deg, var(--primary) 0%, #93c5fd 100%)',
                  borderRadius: '8px 8px 0 0',
                  minHeight: item.value > 0 ? '4px' : '0'
                }}
              ></div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.label}</span>
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>{item.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
