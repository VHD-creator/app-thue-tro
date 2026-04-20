import { Outlet } from 'react-router-dom';
import SideNav from './SideNav';
import TopBar from './TopBar';
import ChatbotWidget from './ChatbotWidget';
import { User } from '../types';

interface MainLayoutProps {
  user: User | null;
  navRoutes: { path: string; label: string }[];
  onLogout: () => void;
}

export default function MainLayout({ user, navRoutes, onLogout }: MainLayoutProps) {
  return (
    <div className={`app-shell role-${user?.vai_tro?.toLowerCase()}`}>
      <SideNav routes={navRoutes} user={user} onLogout={onLogout} />
      <div className="main-content">
        <TopBar user={user} />
        <div className="page-body">
          <Outlet />
        </div>
      </div>
      <ChatbotWidget />
    </div>
  );
}
