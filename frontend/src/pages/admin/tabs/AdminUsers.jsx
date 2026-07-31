import { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
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
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-indigo-50">
            <tr>
              <th className="px-4 py-3 font-semibold">Họ tên</th>
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold text-center">Quyền hạn</th>
              <th className="px-4 py-3 font-semibold text-center">Trạng thái</th>
              <th className="px-4 py-3 font-semibold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500 font-medium">Đang tải dữ liệu...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500 font-medium">Không tìm thấy người dùng phù hợp</td>
              </tr>
            ) : users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                {/* Avatar and Name */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-white">
                      {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : u.full_name[0].toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800 truncate max-w-[200px]">{u.full_name}</span>
                  </div>
                </td>

                {/* Email */}
                <td className="px-4 py-3 text-slate-600 truncate max-w-[200px]">
                  {u.email}
                </td>

                {/* Role */}
                <td className="px-4 py-3 text-center">
                  {u.role === 'admin' ? (
                    <span className="bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">Admin</span>
                  ) : (
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">User</span>
                  )}
                </td>

                {/* Status */}
                <td className="px-4 py-3 text-center">
                  {u.is_active ? (
                    <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">Hoạt động</span>
                  ) : (
                    <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">Bị khóa</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 justify-end">
                    {/* Promote / Demote */}
                    <button
                      onClick={() => handleRoleToggle(u.id, u.role)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                    >
                      {u.role === 'admin' ? <FiUserMinus size={14} /> : <FiUserPlus size={14} />}
                      {u.role === 'admin' ? 'Hạ quyền' : 'Lên Admin'}
                    </button>

                    {/* Ban / Unban */}
                    <button
                      onClick={() => handleBanToggle(u.id, u.is_active)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-sm border ${
                        u.is_active 
                          ? 'text-red-600 bg-red-50 border-red-100 hover:bg-red-100 hover:border-red-200' 
                          : 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200'
                      }`}
                    >
                      {u.is_active ? <FiSlash size={14} /> : <FiCheck size={14} />}
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
