import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import RoomListPage from './pages/RoomListPage';
import RoomFormPage from './pages/RoomFormPage';
import RoomDetailPage from './pages/RoomDetailPage';
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

  useEffect(() => {
    if (!loadingUser && !user) {
      navigate('/login');
    }
  }, [loadingUser, user, navigate]);

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
    ? [
        { path: '/dashboard', label: 'Dashboard' },
        { path: '/rooms', label: 'Phòng trọ' },
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
            <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} />
            <Route path="/dashboard" element={user ? <DashboardPage /> : <Navigate to="/login" />} />
            <Route path="/rooms" element={user ? <RoomListPage /> : <Navigate to="/login" />} />
            <Route path="/rooms/new" element={user ? <RoomFormPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/rooms/:id/edit" element={user ? <RoomFormPage user={user} /> : <Navigate to="/login" />} />
            <Route path="/rooms/:id" element={user ? <RoomDetailPage /> : <Navigate to="/login" />} />
            <Route path="/contracts" element={user ? <ContractListPage /> : <Navigate to="/login" />} />
            <Route path="/contracts/new" element={user ? <ContractFormPage /> : <Navigate to="/login" />} />
            <Route path="/contracts/:id/edit" element={user ? <ContractFormPage /> : <Navigate to="/login" />} />
            <Route path="/contracts/:id" element={user ? <ContractDetailPage /> : <Navigate to="/login" />} />
            <Route path="/invoices" element={user ? <InvoiceListPage /> : <Navigate to="/login" />} />
            <Route path="/invoices/new" element={user ? <InvoiceFormPage /> : <Navigate to="/login" />} />
            <Route path="/invoices/:id/edit" element={user ? <InvoiceFormPage /> : <Navigate to="/login" />} />
            <Route path="/invoices/:id" element={user ? <InvoiceDetailPage /> : <Navigate to="/login" />} />
            <Route path="/payments/:invoiceId" element={user ? <PaymentPage /> : <Navigate to="/login" />} />
            <Route path="/tenants" element={user ? <TenantListPage /> : <Navigate to="/login" />} />
            <Route path="/tenants/new" element={user ? <TenantFormPage /> : <Navigate to="/login" />} />
            <Route path="/tenants/:id/edit" element={user ? <TenantFormPage /> : <Navigate to="/login" />} />
            <Route path="/tenants/:id" element={user ? <TenantDetailPage /> : <Navigate to="/login" />} />
            <Route path="/users" element={user ? <UserManagementPage /> : <Navigate to="/login" />} />
            <Route path="/profile" element={user ? <ProfilePage user={user} onUpdateUser={setUser} /> : <Navigate to="/login" />} />
            <Route path="/*" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
