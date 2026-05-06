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
import RentRequestListPage from './pages/RentRequestListPage';
import MyRoomPage from './pages/MyRoomPage';
import ReportPage from './pages/ReportPage';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
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

  // Handle initial redirection if not logged in
  useEffect(() => {
    if (!loadingUser && !user) {
      const isPublicPath = ['/login', '/register', '/verify-email', '/forgot-password'].some(path => 
        window.location.pathname.startsWith(path)
      );
      if (!isPublicPath) {
        navigate('/login');
      }
    }
  }, [loadingUser, user, navigate]);

  const auth = useMemo(
    () => ({
      login(userData: User) {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        const path = userData.vai_tro === 'NGUOI_THUE' ? '/tenant/dashboard' : '/dashboard';
        navigate(path);
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

  const navRoutes = useMemo(() => {
    if (!user) return [];
    if (user.vai_tro === 'NGUOI_THUE') {
      return [
        { path: '/tenant/dashboard', label: '🏠 Dashboard' },
        { path: '/tenant/my-room', label: '🔑 Phòng của tôi' },
        { path: '/tenant/rooms', label: '🔍 Tìm phòng trọ' },
        { path: '/tenant/contracts', label: '📄 Hợp đồng' },
        { path: '/tenant/invoices', label: '💰 Hóa đơn' },
        { path: '/tenant/rent-requests', label: '📩 Yêu cầu thuê' },
        { path: '/tenant/profile', label: '👤 Hồ sơ' }
      ];
    }
    return [
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/rooms', label: 'Phòng trọ' },
      { path: '/contracts', label: 'Hợp đồng' },
      { path: '/invoices', label: 'Hóa đơn' },
      { path: '/rent-requests', label: 'Yêu cầu thuê' },
      ...(user.vai_tro === 'CHU_TRO' || user.vai_tro === 'ADMIN'
        ? [
            { path: '/tenants', label: 'Người thuê' },
            { path: '/reports', label: '📊 Báo cáo' }
          ]
        : []),
      ...(user.vai_tro === 'ADMIN' ? [{ path: '/users', label: 'Tài khoản' }] : []),
      { path: '/profile', label: 'Hồ sơ' }
    ];
  }, [user]);

  return (
    <Routes>
      {/* 1. Public Routes */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage onLogin={auth.login} />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-email/:token" element={<VerificationPage />} />

      {/* 2. Protected App Shell */}
      <Route element={<ProtectedRoute user={user} loading={loadingUser} />}>
        <Route element={<MainLayout user={user} navRoutes={navRoutes} onLogout={auth.logout} />}>
          
          {/* Dashboard Redirector at Root */}
          <Route path="/" element={<Navigate to={user?.vai_tro === 'NGUOI_THUE' ? '/tenant/dashboard' : '/dashboard'} replace />} />

          {/* Shared routes (any role) */}
          <Route path="/profile" element={<ProfilePage user={user!} onUpdateUser={setUser} />} />
          <Route path="/rooms/:id" element={<RoomDetailPage user={user!} />} />
          <Route path="/contracts/:id" element={<ContractDetailPage user={user!} />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage user={user!} />} />
          <Route path="/payments/:invoiceId" element={<PaymentPage user={user!} />} />

          {/* Role-Specific Blocks */}
          
          {/* ADMINISTRATOR & LANDLORD */}
          <Route element={<ProtectedRoute user={user} loading={loadingUser} allowedRoles={['CHU_TRO', 'ADMIN']} />}>
            <Route path="/dashboard" element={<DashboardPage user={user!} />} />
            <Route path="/rooms" element={<RoomListPage user={user!} />} />
            <Route path="/rooms/new" element={<RoomFormPage user={user!} />} />
            <Route path="/rooms/:id/edit" element={<RoomFormPage user={user!} />} />
            <Route path="/contracts" element={<ContractListPage user={user!} />} />
            <Route path="/contracts/new" element={<ContractFormPage user={user!} />} />
            <Route path="/contracts/:id/edit" element={<ContractFormPage user={user!} />} />
            <Route path="/invoices" element={<InvoiceListPage user={user!} />} />
            <Route path="/invoices/new" element={<InvoiceFormPage user={user!} />} />
            <Route path="/invoices/:id/edit" element={<InvoiceFormPage user={user!} />} />
            <Route path="/tenants" element={<TenantListPage user={user!} />} />
            <Route path="/tenants/new" element={<TenantFormPage user={user!} />} />
            <Route path="/tenants/:id/edit" element={<TenantFormPage user={user!} />} />
            <Route path="/tenants/:id" element={<TenantDetailPage user={user!} />} />
            <Route path="/rent-requests" element={<RentRequestListPage user={user!} />} />
            <Route path="/reports" element={<ReportPage user={user!} />} />

            {/* Admin Exclusive */}
            <Route element={<ProtectedRoute user={user} loading={loadingUser} allowedRoles={['ADMIN']} />}>
              <Route path="/users" element={<UserManagementPage />} />
            </Route>
          </Route>

          {/* TENANT ONLY */}
          <Route element={<ProtectedRoute user={user} loading={loadingUser} allowedRoles={['NGUOI_THUE']} />}>
            <Route path="/tenant/dashboard" element={<DashboardPage user={user!} />} />
            <Route path="/tenant/my-room" element={<MyRoomPage />} />
            <Route path="/tenant/rooms" element={<RoomListPage user={user!} />} />
            <Route path="/tenant/contracts" element={<ContractListPage user={user!} />} />
            <Route path="/tenant/invoices" element={<InvoiceListPage user={user!} />} />
            <Route path="/tenant/profile" element={<ProfilePage user={user!} onUpdateUser={setUser} />} />
            <Route path="/tenant/rent-requests" element={<RentRequestListPage user={user!} />} />
          </Route>

        </Route>
      </Route>

      {/* 3. Global Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
