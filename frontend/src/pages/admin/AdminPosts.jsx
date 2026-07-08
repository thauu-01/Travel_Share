import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
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
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>📝 Quản lý bài viết</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>Kiểm duyệt ẩn bài viết vi phạm hoặc xóa bài viết xấu độc hại</p>
      </div>

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
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '14px 16px' }}>Bài đăng</th>
              <th style={{ padding: '14px 16px' }}>Tác giả</th>
              <th style={{ padding: '14px 16px' }}>Địa điểm</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Đánh giá</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Trạng thái</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải dữ liệu...</td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy bài viết phù hợp</td>
              </tr>
            ) : posts.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                {/* Title */}
                <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.title}
                </td>

                {/* Author */}
                <td style={{ padding: '14px 16px', color: '#475569' }}>{p.author?.full_name || 'Không rõ'}</td>

                {/* Place */}
                <td style={{ padding: '14px 16px', color: '#475569' }}>{p.place ? `${p.place.name} (${p.place.province})` : 'N/A'}</td>

                {/* Rating */}
                <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 'bold', color: '#eab308' }}>
                  {p.rating ? `⭐ ${p.rating}` : '—'}
                </td>

                {/* Status */}
                <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                  {p.status === 'hidden' || p.is_hidden ? (
                    <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>Bị ẩn</span>
                  ) : p.status === 'draft' ? (
                    <span style={{ backgroundColor: '#f1f5f9', color: '#475569', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>Bản nháp</span>
                  ) : (
                    <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '4px 8px', borderRadius: 12, fontSize: '0.75rem', fontWeight: 600 }}>Hiển thị</span>
                  )}
                </td>

                {/* Actions */}
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    {/* View Details */}
                    <a
                      href={`/posts/${p.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <FiExternalLink /> Xem
                    </a>

                    {/* Toggle hide/show */}
                    <button
                      onClick={() => handleToggleVisibility(p.id, p.is_hidden)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        padding: '4px 8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        borderColor: p.is_hidden ? '#e2e8f0' : '#cbd5e1'
                      }}
                    >
                      {p.is_hidden ? <FiEye /> : <FiEyeOff />}
                      {p.is_hidden ? 'Hiện bài' : 'Ẩn bài'}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeletePost(p.id)}
                      className="btn btn-sm"
                      style={{
                        padding: '4px 8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        backgroundColor: '#fee2e2',
                        color: '#dc2626',
                        border: '1px solid #fecaca'
                      }}
                    >
                      <FiTrash2 /> Xóa
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
