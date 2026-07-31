import { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { FiSearch, FiEye, FiEyeOff, FiTrash2, FiExternalLink } from 'react-icons/fi';

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

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

  const handleToggleVisibility = async (postId, isHidden) => {
    const actionText = isHidden ? 'hiển thị lại' : 'ẩn đi';
    if (!confirm(`Bạn có chắc muốn ${actionText} bài viết này khỏi Newsfeed chính?`)) return;

    try {
      const res = await adminAPI.togglePostVisibility(postId);
      toast.success(res.data.message);
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xử lý');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Bạn có CỰC KỲ chắc chắn muốn xóa vĩnh viễn bài viết này cùng tất cả bình luận/lượt thích liên quan? Thao tác này không thể hoàn tác.')) return;

    try {
      const res = await adminAPI.deletePost(postId);
      toast.success(res.data.message);
      fetchPosts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi xử lý');
    }
  };

  return (
    <div className="animate-in">
      {/* Filter panel */}
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
            placeholder="Tìm theo tiêu đề hoặc nội dung..."
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
          style={{ width: '180px', marginBottom: 0 }}
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
                    {/* View Details */}
                    <a
                      href={`/posts/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-transparent rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <FiExternalLink size={14} /> Xem
                    </a>

                    {/* Toggle hide/show */}
                    <button
                      onClick={() => handleToggleVisibility(p.id, p.is_hidden)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                    >
                      {p.is_hidden ? <FiEye size={14} /> : <FiEyeOff size={14} />}
                      {p.is_hidden ? 'Hiện' : 'Ẩn'}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeletePost(p.id)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 hover:border-red-200 transition-colors shadow-sm"
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
