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
      <div className="user-header">
        <h1>Quản lý trọ</h1>
        {user && (
          <>
            <p className="user-name">{user.profile?.ho_ten || user.ten_dang_nhap}</p>
            <span className={`role-badge ${user.vai_tro === 'CHU_TRO' ? 'landlord' : user.vai_tro === 'NGUOI_THUE' ? 'tenant' : 'admin'}`}>
              {user.vai_tro === 'CHU_TRO' ? 'Chủ trọ' : user.vai_tro === 'NGUOI_THUE' ? 'Người thuê' : 'Quản trị'}
            </span>
          </>
        )}
      </div>
      <div className="nav-links">
        {routes.map((route) => (
          <NavLink 
            key={route.path} 
            to={route.path} 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            title={route.label}
          >
            {route.label}
          </NavLink>
        ))}
      </div>
      {user && (
        <button type="button" className="button button-secondary logout-btn" onClick={onLogout}>
          Đăng xuất
        </button>
      )}
    </nav>
  );
}

function getRouteIcon(path: string): string {
  return '';
}
