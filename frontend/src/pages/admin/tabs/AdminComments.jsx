import { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
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
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-indigo-50">
            <tr>
              <th className="px-4 py-3 font-semibold">Họ tên</th>
              <th className="px-4 py-3 font-semibold">Nội dung bình luận</th>
              <th className="px-4 py-3 font-semibold">Bài viết liên kết</th>
              <th className="px-4 py-3 font-semibold text-center">Thời gian gửi</th>
              <th className="px-4 py-3 font-semibold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500 font-medium">Đang tải bình luận...</td>
              </tr>
            ) : comments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500 font-medium">Không tìm thấy bình luận nào</td>
              </tr>
            ) : comments.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                {/* Author Name */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-white">
                      {c.user?.avatar_url ? <img src={c.user.avatar_url} alt="" className="w-full h-full object-cover" /> : c.user?.full_name[0].toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-800 truncate max-w-[150px]">{c.user?.full_name}</span>
                  </div>
                </td>

                {/* Comment Content */}
                <td className="px-4 py-3 text-slate-700 max-w-[280px] break-words">
                  {c.content}
                </td>

                {/* Linked Post */}
                <td className="px-4 py-3 text-slate-600 text-xs truncate max-w-[180px]">
                  {c.post?.title || 'N/A'}
                </td>

                {/* Time */}
                <td className="px-4 py-3 text-slate-500 text-xs text-center">
                  {new Date(c.created_at).toLocaleString('vi-VN')}
                </td>

                {/* Action delete */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => handleDelete(c.id)}
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
