import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiSearch, FiCheck, FiSlash, FiUserPlus, FiUserMinus } from 'react-icons/fi';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter, roleFilter, page]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers({
        search,
        status: statusFilter,
        role: roleFilter,
        page
      });
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleBanToggle = async (userId, isActive) => {
    const actionText = isActive ? 'Khóa' : 'Mở khóa';
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} tài khoản này?`)) return;

    try {
      const res = await adminAPI.banUser(userId);
      toast.success(res.data.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xử lý');
    }
  };

  const handleRoleToggle = async (userId, currentRole) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    const actionText = nextRole === 'admin' ? 'nâng lên Admin' : 'hạ xuống User thường';
    if (!confirm(`Bạn có chắc chắn muốn ${actionText} người dùng này?`)) return;

    try {
      const res = await adminAPI.updateUserRole(userId, { role: nextRole });
      toast.success(res.data.message);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xử lý');
    }
  };

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>👥 Quản lý người dùng</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>Phân quyền, khóa hoặc mở khóa tài khoản thành viên</p>
      </div>

      {/* Filter and search bar */}
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '20px',
        alignItems: 'center'
      }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 10px', backgroundColor: '#f8fafc', flex: '1', minWidth: '200px' }}>
          <FiSearch style={{ color: '#94a3b8', marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ border: 'none', background: 'none', padding: '8px 0', width: '100%', fontSize: '0.9rem', outline: 'none' }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="form-select"
          style={{ width: '160px', marginBottom: 0 }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="banned">Bị khóa</option>
        </select>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="form-select"
          style={{ width: '150px', marginBottom: 0 }}
        >
          <option value="">Tất cả vai trò</option>
          <option value="admin">Admin</option>
          <option value="user">User thường</option>
        </select>
      </div>

      {/* Users table */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '14px 16px' }}>Họ tên</th>
              <th style={{ padding: '14px 16px' }}>Email</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Quyền hạn</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Trạng thái</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy người dùng phù hợp</td>
              </tr>
            ) : users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                {/* Avatar and Name */}
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar" style={{ width: 32, height: 32 }}>
                      {u.avatar_url ? <img src={u.avatar_url} alt="" /> : u.full_name[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{u.full_name}</span>
                  </div>
                </td>

                {/* Email */}
                <td style={{ padding: '14px 16px', color: '#475569' }}>{u.email}</td>

                {/* Role */}
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  {u.role === 'admin' ? (
                    <span style={{ backgroundColor: '#ede9fe', color: '#6366f1', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>Admin</span>
                  ) : (
                    <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 500 }}>User</span>
                  )}
                </td>

                {/* Status */}
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  {u.is_active ? (
                    <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>Hoạt động</span>
                  ) : (
                    <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>Bị khóa</span>
                  )}
                </td>

                {/* Actions */}
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {/* Promote / Demote */}
                    <button
                      onClick={() => handleRoleToggle(u.id, u.role)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      {u.role === 'admin' ? <FiUserMinus /> : <FiUserPlus />}
                      {u.role === 'admin' ? 'Hạ quyền' : 'Lên Admin'}
                    </button>

                    {/* Ban / Unban */}
                    <button
                      onClick={() => handleBanToggle(u.id, u.is_active)}
                      className={u.is_active ? "btn btn-sm" : "btn btn-primary btn-sm"}
                      style={{
                        padding: '4px 8px',
                        fontSize: '0.8rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: u.is_active ? '#fee2e2' : undefined,
                        color: u.is_active ? '#dc2626' : undefined,
                        border: u.is_active ? '1px solid #fecaca' : undefined
                      }}
                    >
                      {u.is_active ? <FiSlash /> : <FiCheck />}
                      {u.is_active ? 'Khóa' : 'Mở khóa'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '20px' }}>
          {Array.from({ length: pagination.totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setPage(idx + 1)}
              className={page === idx + 1 ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
              style={{ minWidth: '32px' }}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
