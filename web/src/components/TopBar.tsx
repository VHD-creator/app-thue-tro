import { User } from '../types';

type Props = {
  user: User | null;
};

export default function TopBar({ user }: Props) {
  const roleName = user?.vai_tro === 'NGUOI_THUE' ? 'Người thuê' : 
                   user?.vai_tro === 'CHU_TRO' ? 'Chủ trọ' : 
                   user?.vai_tro === 'ADMIN' ? 'Quản trị viên' : '';

  return (
    <header className="topbar">
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
          {user?.vai_tro === 'NGUOI_THUE' ? 'Cổng người thuê' : 'Hệ thống Quản lý'}
        </h2>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>
          Giao diện tối ưu hóa cho {roleName.toLowerCase()}.
        </p>
      </div>
      <div className="topbar-user">
        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600 }}>{user?.profile?.ho_ten || user?.ten_dang_nhap || 'Chưa đăng nhập'}</span>
          {user ? (
            <span className="badge" style={{ 
              fontSize: '0.7rem', 
              marginTop: 4, 
              alignSelf: 'end',
              backgroundColor: user.vai_tro === 'NGUOI_THUE' ? '#e0e7ff' : '#dcfce7',
              color: user.vai_tro === 'NGUOI_THUE' ? '#4338ca' : '#166534'
            }}>
              {roleName}
            </span>
          ) : null}
        </div>
        <div style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'var(--border)', display: 'flex', alignItems: 'center', justifySelf: 'center', fontSize: '1rem', fontWeight: 600, color: 'var(--primary)', justifyContent: 'center' }}>
          {(user?.profile?.ho_ten || user?.ten_dang_nhap || 'U')[0].toUpperCase()}
        </div>
      </div>
    </header>
  );
}
