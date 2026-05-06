import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyRoom } from '../api/api';
import { Room } from '../types';

export default function MyRoomPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyRoom()
      .then((room) => {
        navigate(`/rooms/${room.id_phong}`, { replace: true });
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Bạn chưa thuê phòng nào');
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ fontSize: '2rem', marginBottom: 16 }}>🏠</div>
        <p className="text-muted">Đang tìm thông tin phòng của bạn...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, textAlign: 'center' }}>
        <div style={{ fontSize: '5rem', marginBottom: 24 }}>🏢</div>
        <h2 style={{ fontSize: '2rem', marginBottom: 16 }}>Bạn chưa thuê phòng nào</h2>
        <p className="text-muted" style={{ marginBottom: 32, maxWidth: 480 }}>
          Dường như bạn chưa có hợp đồng thuê phòng nào đang hoạt động. Hãy lướt xem các phòng trống để bắt đầu nhé!
        </p>
        <button 
          className="button button-primary"
          onClick={() => navigate('/tenant/rooms')}
        >
          Tìm phòng ngay
        </button>
      </div>
    );
  }

  return null;
}
