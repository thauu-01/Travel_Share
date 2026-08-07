import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { FiSearch, FiCheck, FiSlash, FiUserPlus, FiUserMinus, FiShield, FiX } from 'react-icons/fi';

export default function AdminUsers() {
  const { user: currentUser } = useSelector(state => state.auth);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  // Confirm modals state
  const [banModal, setBanModal] = useState(null); // { id, name, isActive }
  const [roleModal, setRoleModal] = useState(null); // { id, name, currentRole }

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

  const handleOpenBanModal = (u) => {
    if (String(u.id) === String(currentUser?.id)) {
      return toast.error('Bạn không thể tự khóa tài khoản của chính mình!');
    }
    setBanModal({ id: u.id, name: u.full_name, isActive: u.is_active });
  };

  const handleConfirmBan = async () => {
    if (!banModal) return;
    try {
      const res = await adminAPI.banUser(banModal.id);
      toast.success(res.data.message || 'Cập nhật trạng thái tài khoản thành công');
      setBanModal(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xử lý');
    }
  };

  const handleOpenRoleModal = (u) => {
    if (String(u.id) === String(currentUser?.id)) {
      return toast.error('Bạn không thể tự hạ quyền của chính mình!');
    }
    setRoleModal({ id: u.id, name: u.full_name, currentRole: u.role });
  };

  const handleConfirmRole = async () => {
    if (!roleModal) return;
    const nextRole = roleModal.currentRole === 'admin' ? 'user' : 'admin';
    try {
      const res = await adminAPI.updateUserRole(roleModal.id, { role: nextRole });
      toast.success(res.data.message || 'Cập nhật quyền hạn thành công');
      setRoleModal(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xử lý');
    }
  };

  return (
    <div className="animate-in">
      {/* Filter and search bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 mb-5 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="flex items-center border border-slate-300 rounded-xl px-3 bg-slate-50 flex-1 min-w-[200px] focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
          <FiSearch className="text-slate-400 mr-2" size={16} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full py-2.5 text-sm font-medium text-slate-900 bg-transparent border-none outline-none placeholder:text-slate-400"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="banned">Bị khóa</option>
        </select>

        {/* Role Filter */}
        <select
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-4 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
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
            ) : users.map(u => {
              const isSelf = String(u.id) === String(currentUser?.id);
              return (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  {/* Avatar and Name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-white">
                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : u.full_name[0].toUpperCase()}
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold text-slate-800 truncate max-w-[180px]">{u.full_name}</span>
                        {isSelf && (
                          <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">
                            Bạn
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-slate-600 truncate max-w-[200px] font-medium">
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
                        onClick={() => handleOpenRoleModal(u)}
                        disabled={isSelf}
                        title={isSelf ? 'Tài khoản của bạn' : ''}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg transition-colors shadow-sm cursor-pointer ${
                          isSelf ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {u.role === 'admin' ? <FiUserMinus size={14} /> : <FiUserPlus size={14} />}
                        {u.role === 'admin' ? 'Hạ quyền' : 'Lên Admin'}
                      </button>

                      {/* Ban / Unban */}
                      <button
                        onClick={() => handleOpenBanModal(u)}
                        disabled={isSelf}
                        title={isSelf ? 'Tài khoản của bạn' : ''}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-lg transition-colors shadow-sm border cursor-pointer ${
                          isSelf ? 'opacity-40 cursor-not-allowed ' : ''
                        } ${
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
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          {Array.from({ length: pagination.totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setPage(idx + 1)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                page === idx + 1 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      )}

      {/* Ban / Unban Modal */}
      {banModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold ${
                banModal.isActive ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {banModal.isActive ? '🚫' : '🔓'}
              </div>
              <button
                onClick={() => setBanModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 mb-2">
              {banModal.isActive ? 'Xác nhận Khóa tài khoản' : 'Xác nhận Mở khóa tài khoản'}
            </h3>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              Bạn có chắc chắn muốn {banModal.isActive ? 'khóa' : 'mở khóa'} tài khoản của <strong>"{banModal.name}"</strong>?
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBanModal(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer bg-white"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmBan}
                className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm transition-all shadow-md border-none cursor-pointer ${
                  banModal.isActive ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Role Toggle Modal */}
      {roleModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold">
                👑
              </div>
              <button
                onClick={() => setRoleModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 mb-2">
              Xác nhận phân quyền tài khoản
            </h3>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              Bạn có chắc chắn muốn {roleModal.currentRole === 'admin' ? 'hạ quyền xuống User thường' : 'nâng quyền thành Quản trị viên (Admin)'} cho <strong>"{roleModal.name}"</strong>?
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRoleModal(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer bg-white"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRole}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-600/20 border-none cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
