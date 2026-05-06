import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import RegisterPage from './pages/RegisterPage';
import VerificationPage from './pages/VerificationPage';
import DashboardPage from './pages/DashboardPage';
import RoomListPage from './pages/RoomListPage';
import RoomFormPage from './pages/RoomFormPage';
import RoomDetailPage from './pages/RoomDetailPage';
import RentalRequestListPage from './pages/RentalRequestListPage';
import ContractListPage from './pages/ContractListPage';
import ContractFormPage from './pages/ContractFormPage';
import ContractDetailPage from './pages/ContractDetailPage';
import InvoiceListPage from './pages/InvoiceListPage';
import InvoiceFormPage from './pages/InvoiceFormPage';
import InvoiceDetailPage from './pages/InvoiceDetailPage';
import PaymentPage from './pages/PaymentPage';
import TenantListPage from './pages/TenantListPage';
import TenantFormPage from './pages/TenantFormPage';
import TenantDetailPage from './pages/TenantDetailPage';
import UserManagementPage from './pages/UserManagementPage';
import ProfilePage from './pages/ProfilePage';
import SideNav from './components/SideNav';
import TopBar from './components/TopBar';
import ChatbotWidget from './components/ChatbotWidget';
import { User } from './types';
import { getCurrentUser } from './api/api';

function App() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loadingUser, setLoadingUser] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && !user) {
      setLoadingUser(true);
      getCurrentUser()
        .then((userData) => {
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoadingUser(false));
    }
  }, [user]);



  const auth = useMemo(
    () => ({
      login(userData: User) {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      },
      logout() {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
      }
    }),
    [navigate]
  );

  const navRoutes = user
    ? user.vai_tro === 'NGUOI_THUE'
      ? [
          { path: '/tenant/dashboard', label: 'Dashboard' },
          { path: '/tenant/rooms', label: 'Phòng trọ' },
          { path: '/tenant/rental-requests', label: 'Yêu cầu thuê' },
          { path: '/tenant/contracts', label: 'Hợp đồng' },
          { path: '/tenant/invoices', label: 'Hóa đơn' },
          { path: '/tenant/profile', label: 'Hồ sơ' }
        ]
      : [
          { path: '/dashboard', label: 'Dashboard' },
          { path: '/rooms', label: 'Phòng trọ' },
          { path: '/rental-requests', label: 'Yêu cầu thuê' },
          { path: '/contracts', label: 'Hợp đồng' },
          { path: '/invoices', label: 'Hóa đơn' },
          ...(user.vai_tro === 'CHU_TRO' || user.vai_tro === 'ADMIN'
            ? [{ path: '/tenants', label: 'Người thuê' }]
            : []),
          ...(user.vai_tro === 'ADMIN' ? [{ path: '/users', label: 'Tài khoản' }] : []),
          { path: '/profile', label: 'Hồ sơ' }
        ]
    : [];

  return (
    <div className="app-shell">
      <SideNav routes={navRoutes} user={user} onLogout={auth.logout} />
      <div className="main-content">
        <TopBar user={user} />
        <div className="page-body">
          <Routes>
            <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage onLogin={auth.login} />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
            <Route path="/verify-email/:token" element={<VerificationPage />} />
            <Route path="/dashboard" element={user && user.vai_tro !== 'NGUOI_THUE' ? <DashboardPage /> : <Navigate to={user ? '/tenant/dashboard' : '/login'} />} />
            <Route path="/rooms" element={user && user.vai_tro !== 'NGUOI_THUE' ? <RoomListPage /> : <Navigate to={user ? '/tenant/rooms' : '/login'} />} />
            <Route path="/rooms/new" element={user && user.vai_tro !== 'NGUOI_THUE' ? <RoomFormPage user={user} /> : <Navigate to={user ? '/tenant/rooms' : '/login'} />} />
            <Route path="/rooms/:id/edit" element={user && user.vai_tro !== 'NGUOI_THUE' ? <RoomFormPage user={user} /> : <Navigate to={user ? '/tenant/rooms' : '/login'} />} />
            <Route path="/rooms/:id" element={user ? <RoomDetailPage /> : <Navigate to="/login" />} />

            <Route path="/rental-requests" element={user && user.vai_tro !== 'NGUOI_THUE' ? <RentalRequestListPage /> : <Navigate to={user ? '/tenant/rental-requests' : '/login'} />} />

            <Route path="/contracts" element={user && user.vai_tro !== 'NGUOI_THUE' ? <ContractListPage /> : <Navigate to={user ? '/tenant/contracts' : '/login'} />} />
            <Route path="/contracts/new" element={user && user.vai_tro !== 'NGUOI_THUE' ? <ContractFormPage /> : <Navigate to={user ? '/tenant/contracts' : '/login'} />} />
            <Route path="/contracts/:id/edit" element={user && user.vai_tro !== 'NGUOI_THUE' ? <ContractFormPage /> : <Navigate to={user ? '/tenant/contracts' : '/login'} />} />
            <Route path="/contracts/:id" element={user ? <ContractDetailPage /> : <Navigate to="/login" />} />

            <Route path="/invoices" element={user && user.vai_tro !== 'NGUOI_THUE' ? <InvoiceListPage /> : <Navigate to={user ? '/tenant/invoices' : '/login'} />} />
            <Route path="/invoices/new" element={user && user.vai_tro !== 'NGUOI_THUE' ? <InvoiceFormPage /> : <Navigate to={user ? '/tenant/invoices' : '/login'} />} />
            <Route path="/invoices/:id/edit" element={user && user.vai_tro !== 'NGUOI_THUE' ? <InvoiceFormPage /> : <Navigate to={user ? '/tenant/invoices' : '/login'} />} />
            <Route path="/invoices/:id" element={user ? <InvoiceDetailPage /> : <Navigate to="/login" />} />

            <Route path="/payments/:invoiceId" element={user ? <PaymentPage /> : <Navigate to="/login" />} />
            <Route path="/tenants" element={user && (user.vai_tro === 'CHU_TRO' || user.vai_tro === 'ADMIN') ? <TenantListPage /> : <Navigate to={user ? '/tenant/dashboard' : '/login'} />} />
            <Route path="/tenants/new" element={user && (user.vai_tro === 'CHU_TRO' || user.vai_tro === 'ADMIN') ? <TenantFormPage /> : <Navigate to={user ? '/tenant/dashboard' : '/login'} />} />
            <Route path="/tenants/:id/edit" element={user && (user.vai_tro === 'CHU_TRO' || user.vai_tro === 'ADMIN') ? <TenantFormPage /> : <Navigate to={user ? '/tenant/dashboard' : '/login'} />} />
            <Route path="/tenants/:id" element={user && (user.vai_tro === 'CHU_TRO' || user.vai_tro === 'ADMIN') ? <TenantDetailPage /> : <Navigate to={user ? '/tenant/dashboard' : '/login'} />} />
            <Route path="/users" element={user && user.vai_tro === 'ADMIN' ? <UserManagementPage /> : <Navigate to={user ? '/tenant/dashboard' : '/login'} />} />
            <Route path="/profile" element={user ? <ProfilePage user={user} onUpdateUser={setUser} /> : <Navigate to="/login" />} />

            <Route path="/tenant/dashboard" element={user && user.vai_tro === 'NGUOI_THUE' ? <DashboardPage /> : <Navigate to={user ? '/dashboard' : '/login'} />} />
            <Route path="/tenant/rooms" element={user && user.vai_tro === 'NGUOI_THUE' ? <RoomListPage /> : <Navigate to={user ? '/rooms' : '/login'} />} />
            <Route path="/tenant/rental-requests" element={user && user.vai_tro === 'NGUOI_THUE' ? <RentalRequestListPage /> : <Navigate to={user ? '/rental-requests' : '/login'} />} />
            <Route path="/tenant/contracts" element={user && user.vai_tro === 'NGUOI_THUE' ? <ContractListPage /> : <Navigate to={user ? '/contracts' : '/login'} />} />
            <Route path="/tenant/invoices" element={user && user.vai_tro === 'NGUOI_THUE' ? <InvoiceListPage /> : <Navigate to={user ? '/invoices' : '/login'} />} />
            <Route path="/tenant/profile" element={user && user.vai_tro === 'NGUOI_THUE' ? <ProfilePage user={user} onUpdateUser={setUser} /> : <Navigate to={user ? '/profile' : '/login'} />} />

            <Route path="/*" element={user ? <Navigate to={user.vai_tro === 'NGUOI_THUE' ? '/tenant/dashboard' : '/dashboard'} /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
      <ChatbotWidget />
    </div>
  );
}

export default App;
