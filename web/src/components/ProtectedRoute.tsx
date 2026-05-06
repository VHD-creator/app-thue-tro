import { Navigate, Outlet } from 'react-router-dom';
import { User } from '../types';

interface ProtectedRouteProps {
  user: User | null;
  loading: boolean;
  allowedRoles?: string[];
}

export default function ProtectedRoute({
  user,
  loading,
  allowedRoles,
}: ProtectedRouteProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.vai_tro)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-2">Truy cập bị từ chối</h2>
        <p className="text-gray-600 mb-4">Bạn không có quyền truy cập vào chức năng này.</p>
        <button 
          onClick={() => window.history.back()} 
          className="button button-secondary"
        >
          Quay lại
        </button>
      </div>
    );
  }

  return <Outlet />;
}
