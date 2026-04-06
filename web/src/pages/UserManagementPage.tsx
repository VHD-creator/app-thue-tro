import { useEffect, useState } from 'react';
import { fetchUsers, lockUser, unlockUser, resetUserPassword } from '../api/api';
import { UserAccount } from '../types';

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchUsers()
      .then(setUsers)
      .catch((err) => setError(err instanceof Error ? err.message : 'Không tải được danh sách người dùng'))
      .finally(() => setLoading(false));
  }, []);

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được danh sách người dùng');
    } finally {
      setLoading(false);
    }
  }

  async function handleLock(userId: number, locked: boolean) {
    setActionLoading(true);
    try {
      if (locked) {
        await unlockUser(userId);
      } else {
        await lockUser(userId);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi cập nhật tài khoản');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetPassword(userId: number) {
    const newPassword = window.prompt('Nhập mật khẩu mới cho tài khoản');
    if (!newPassword) return;
    setActionLoading(true);
    try {
      await resetUserPassword(userId, newPassword);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi đặt lại mật khẩu');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div>
      <div className="section-title">
        <div>
          <h2>Quản lý tài khoản</h2>
          <p className="text-muted">Danh sách người dùng và trạng thái tài khoản.</p>
        </div>
        <button type="button" className="button button-secondary" onClick={refresh} disabled={loading || actionLoading}>
          Làm mới
        </button>
      </div>
      {loading ? (
        <div className="panel">Đang tải danh sách...</div>
      ) : error ? (
        <div className="panel">{error}</div>
      ) : (
        <div className="list-card">
          {users.map((user) => (
            <div key={user.id_tai_khoan} className="list-item">
              <div>
                <h3>{user.ten_dang_nhap}</h3>
                <small>{user.ChuTro?.ho_ten || user.NguoiThue?.ho_ten || user.vai_tro}</small>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>{user.vai_tro}</div>
                <div>{user.trang_thai === 1 ? 'Hoạt động' : 'Đã khóa'}</div>
                <div style={{ marginTop: 8, display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                  <button className="button button-secondary" disabled={actionLoading} onClick={() => handleLock(user.id_tai_khoan, user.trang_thai === 0)}>
                    {user.trang_thai === 0 ? 'Mở khóa' : 'Khóa'}
                  </button>
                  <button className="button button-secondary" disabled={actionLoading} onClick={() => handleResetPassword(user.id_tai_khoan)}>
                    Đặt lại MK
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
