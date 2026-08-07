import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { FiSearch, FiEye, FiEyeOff, FiTrash2, FiExternalLink, FiX } from 'react-icons/fi';

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  // Modal confirm states
  const [visibilityModal, setVisibilityModal] = useState(null); // { id, title, isHidden }
  const [deleteModal, setDeleteModal] = useState(null); // { id, title }

  useEffect(() => {
    fetchPosts();
  }, [search, statusFilter, page]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getPosts({
        search,
        status: statusFilter,
        page
      });
      setPosts(res.data.data.posts);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách bài viết');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmVisibility = async () => {
    if (!visibilityModal) return;
    try {
      const res = await adminAPI.togglePostVisibility(visibilityModal.id);
      toast.success(res.data.message || 'Cập nhật trạng thái bài viết thành công');
      setVisibilityModal(null);
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xử lý');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal) return;
    try {
      const res = await adminAPI.deletePost(deleteModal.id);
      toast.success(res.data.message || 'Đã xóa bài viết vĩnh viễn');
      setDeleteModal(null);
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xử lý');
    }
  };

  return (
    <div className="animate-in">
      {/* Filter panel */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 mb-5 flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="flex items-center border border-slate-300 rounded-xl px-3 bg-slate-50 flex-1 min-w-[200px] focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
          <FiSearch className="text-slate-400 mr-2" size={16} />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề hoặc nội dung..."
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
          <option value="published">Đang hiển thị</option>
          <option value="hidden">Bị ẩn vi phạm</option>
          <option value="draft">Bản nháp</option>
        </select>
      </div>

      {/* Posts table */}
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-indigo-50">
            <tr>
              <th className="px-4 py-3 font-semibold">Bài đăng</th>
              <th className="px-4 py-3 font-semibold">Tác giả</th>
              <th className="px-4 py-3 font-semibold">Địa điểm</th>
              <th className="px-4 py-3 font-semibold text-center">Đánh giá</th>
              <th className="px-4 py-3 font-semibold text-center">Trạng thái</th>
              <th className="px-4 py-3 font-semibold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500 font-medium">Đang tải dữ liệu...</td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500 font-medium">Không tìm thấy bài viết phù hợp</td>
              </tr>
            ) : posts.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                {/* Title */}
                <td className="px-4 py-3 font-semibold text-slate-800 max-w-[240px] truncate">
                  {p.title}
                </td>

                {/* Author */}
                <td className="px-4 py-3 text-slate-600 font-medium">
                  {p.author?.full_name || 'Không rõ'}
                </td>

                {/* Place */}
                <td className="px-4 py-3 text-slate-600 text-xs truncate max-w-[200px]">
                  {p.place ? `${p.place.name} (${p.place.province})` : 'N/A'}
                </td>

                {/* Rating */}
                <td className="px-4 py-3 text-center font-bold text-amber-500">
                  {p.rating ? `⭐ ${p.rating}` : '—'}
                </td>

                {/* Status */}
                <td className="px-4 py-3 text-center">
                  {p.status === 'hidden' || p.is_hidden ? (
                    <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">Bị ẩn</span>
                  ) : p.status === 'draft' ? (
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">Bản nháp</span>
                  ) : (
                    <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider">Hiển thị</span>
                  )}
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 justify-end">
                    <a
                      href={`/posts/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-transparent rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <FiExternalLink size={14} /> Xem
                    </a>

                    <button
                      onClick={() => setVisibilityModal({ id: p.id, title: p.title, isHidden: p.is_hidden })}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm cursor-pointer"
                    >
                      {p.is_hidden ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                      {p.is_hidden ? 'Hiện' : 'Ẩn'}
                    </button>

                    <button
                      onClick={() => setDeleteModal({ id: p.id, title: p.title })}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 hover:border-red-200 transition-colors shadow-sm cursor-pointer"
                    >
                      <FiTrash2 size={14} /> Xóa
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

      {/* Visibility Modal */}
      {visibilityModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-bold">
                {visibilityModal.isHidden ? '👁️' : '🙈'}
              </div>
              <button
                onClick={() => setVisibilityModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 mb-2">
              {visibilityModal.isHidden ? 'Xác nhận hiển thị bài viết' : 'Xác nhận ẩn bài viết'}
            </h3>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              Bạn có chắc chắn muốn {visibilityModal.isHidden ? 'hiển thị lại' : 'ẩn đi'} bài viết <strong>"{visibilityModal.title}"</strong> khỏi Newsfeed chính?
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setVisibilityModal(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer bg-white"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmVisibility}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-600/20 border-none cursor-pointer"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Modal */}
      {deleteModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-lg font-bold">
                🗑️
              </div>
              <button
                onClick={() => setDeleteModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 mb-2">
              Xác nhận xóa vĩnh viễn
            </h3>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn bài viết <strong>"{deleteModal.title}"</strong> cùng toàn bộ bình luận/lượt thích liên quan? Thao tác này không thể hoàn tác.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer bg-white"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-md shadow-red-600/20 border-none cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FiTrash2 size={15} /> Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
