import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { FiSearch, FiTrash2, FiX } from 'react-icons/fi';

export default function AdminComments() {
  const [comments, setComments] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  // Delete confirm modal state
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [deleteCommentSnippet, setDeleteCommentSnippet] = useState('');

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

  const handleOpenDelete = (comment) => {
    setDeleteTargetId(comment.id);
    setDeleteCommentSnippet(comment.content);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await adminAPI.deleteComment(deleteTargetId);
      toast.success('Đã xóa bình luận thành công');
      setDeleteTargetId(null);
      fetchComments();
    } catch (err) {
      toast.error('Lỗi khi xóa bình luận');
    }
  };

  return (
    <div className="animate-in">
      {/* Filter panel */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 mb-5 flex items-center gap-3">
        <div className="flex items-center border border-slate-300 rounded-xl px-3 bg-slate-50 flex-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
          <FiSearch className="text-slate-400 mr-2" size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm nội dung bình luận..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full py-2.5 text-sm font-medium text-slate-900 bg-transparent border-none outline-none placeholder:text-slate-400"
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
                <td className="px-4 py-3 text-slate-700 max-w-[280px] break-words font-medium">
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
                      onClick={() => handleOpenDelete(c)}
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

      {/* Custom Modern Confirm Modal — Rendered via Portal to document.body */}
      {deleteTargetId && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-lg font-bold">
                🗑️
              </div>
              <button
                onClick={() => setDeleteTargetId(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 mb-2">
              Xác nhận xóa bình luận
            </h3>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              Bạn có chắc chắn muốn xóa bình luận này cùng tất cả phản hồi liên quan? Thao tác này không thể hoàn tác.
            </p>

            {deleteCommentSnippet && (
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 mb-6 text-xs text-slate-700 italic line-clamp-3">
                "{deleteCommentSnippet}"
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer bg-white"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-md shadow-red-600/20 border-none cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FiTrash2 size={15} /> Xóa ngay
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
