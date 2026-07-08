import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiSearch, FiTrash2 } from 'react-icons/fi';

export default function AdminComments() {
  const [comments, setComments] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [search, page]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getComments({ search, page });
      setComments(res.data.data.comments);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải danh sách bình luận');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này cùng các phản hồi của nó?')) return;

    try {
      await adminAPI.deleteComment(id);
      toast.success('Xóa bình luận thành công');
      fetchComments();
    } catch (err) {
      toast.error('Lỗi khi xóa bình luận');
    }
  };

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>💬 Quản lý bình luận</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>Kiểm duyệt và xóa bình luận thô tục, spam hoặc phản cảm</p>
      </div>

      {/* Filter panel */}
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 10px', backgroundColor: '#f8fafc', flex: '1' }}>
          <FiSearch style={{ color: '#94a3b8', marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Tìm kiếm nội dung bình luận..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ border: 'none', background: 'none', padding: '8px 0', width: '100%', fontSize: '0.9rem', outline: 'none' }}
          />
        </div>
      </div>

      {/* Comments table */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '14px 16px' }}>Họ tên</th>
              <th style={{ padding: '14px 16px' }}>Nội dung bình luận</th>
              <th style={{ padding: '14px 16px' }}>Bài viết liên kết</th>
              <th style={{ padding: '14px 16px' }}>Thời gian gửi</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải bình luận...</td>
              </tr>
            ) : comments.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy bình luận nào</td>
              </tr>
            ) : comments.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                {/* Author Name */}
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="avatar" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                      {c.user?.avatar_url ? <img src={c.user.avatar_url} alt="" /> : c.user?.full_name[0].toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{c.user?.full_name}</span>
                  </div>
                </td>

                {/* Comment Content */}
                <td style={{ padding: '14px 16px', color: '#334155', maxWidth: '300px', wordBreak: 'break-word' }}>
                  {c.content}
                </td>

                {/* Linked Post */}
                <td style={{ padding: '14px 16px', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.post?.title || 'N/A'}
                </td>

                {/* Time */}
                <td style={{ padding: '14px 16px', color: '#64748b' }}>
                  {new Date(c.created_at).toLocaleString('vi-VN')}
                </td>

                {/* Action delete */}
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <button
                    onClick={() => handleDelete(c.id)}
                    className="btn btn-sm"
                    style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}
                  >
                    <FiTrash2 /> Xóa
                  </button>
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
