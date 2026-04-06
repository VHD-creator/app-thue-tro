import { User } from '../types';

type Props = {
  user: User | null;
};

export default function TopBar({ user }: Props) {
  return (
    <header className="topbar">
      <div>
        <h2>Quản lý thuê trọ</h2>
        <p className="text-muted">Giao diện trực quan, dễ dùng cho chủ trọ và người thuê.</p>
      </div>
      <div className="topbar-user">
        <span>{user?.profile?.ho_ten || user?.ten_dang_nhap || 'Chưa đăng nhập'}</span>
        {user ? <span className="text-muted">{user.vai_tro}</span> : null}
      </div>
    </header>
  );
}
