import { NavLink } from 'react-router-dom';
import { User } from '../types';

type Props = {
  routes: { path: string; label: string }[];
  user: User | null;
  onLogout: () => void;
};

export default function SideNav({ routes, user, onLogout }: Props) {
  return (
    <nav className="sidenav">
      <div>
        <h1>Quản lý trọ</h1>
        <p className="text-muted">{user ? user.profile?.ho_ten || user.ten_dang_nhap : 'Khách'}</p>
      </div>
      {routes.map((route) => (
        <NavLink key={route.path} to={route.path} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          {route.label}
        </NavLink>
      ))}
      {user ? (
        <button type="button" className="button button-secondary" onClick={onLogout}>
          Đăng xuất
        </button>
      ) : null}
    </nav>
  );
}
