import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiExternalLink } from 'react-icons/fi';

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);

  // Resolution note state
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [resolveAction, setResolveAction] = useState('resolved'); // or rejected

  useEffect(() => {
    fetchReports();
  }, [statusFilter, page]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getReports({ status: statusFilter, page });
      setReports(res.data.data.reports);
      setPagination(res.data.data.pagination);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResolve = (id, action) => {
    setSelectedReportId(id);
    setResolveAction(action);
    setAdminNote('');
    setShowNoteModal(true);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    try {
      await adminAPI.updateReport(selectedReportId, {
        status: resolveAction,
        admin_note: adminNote
      });
      toast.success(resolveAction === 'resolved' ? 'Đã duyệt xử lý báo cáo' : 'Đã bác bỏ báo cáo');
      setShowNoteModal(false);
      fetchReports();
    } catch (err) {
      toast.error('Gặp lỗi khi cập nhật báo cáo');
    }
  };

  const getReasonText = (reason) => {
    const map = {
      spam: 'Spam / Quảng cáo',
      inappropriate: 'Nội dung bạo lực/nhạy cảm',
      hate_speech: 'Ngôn từ kích động thù ghét',
      misinformation: 'Thông tin sai sự thật',
      other: 'Lý do khác'
    };
    return map[reason] || reason;
  };

  return (
    <div className="animate-in">
      {/* Filter Tabs */}
      <div className="flex border-b border-slate-200 gap-5 mb-5">
        <button
          onClick={() => { setStatusFilter('pending'); setPage(1); }}
          className={`py-3 px-1 border-b-2 text-sm font-semibold transition-all border-none bg-transparent cursor-pointer ${
            statusFilter === 'pending' ? 'border-indigo-600 text-indigo-600 border-solid' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Chờ xử lý
        </button>
        <button
          onClick={() => { setStatusFilter('resolved'); setPage(1); }}
          className={`py-3 px-1 border-b-2 text-sm font-semibold transition-all border-none bg-transparent cursor-pointer ${
            statusFilter === 'resolved' ? 'border-indigo-600 text-indigo-600 border-solid' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Đã xử lý (Chấp thuận)
        </button>
        <button
          onClick={() => { setStatusFilter('rejected'); setPage(1); }}
          className={`py-3 px-1 border-b-2 text-sm font-semibold transition-all border-none bg-transparent cursor-pointer ${
            statusFilter === 'rejected' ? 'border-indigo-600 text-indigo-600 border-solid' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Đã bác bỏ
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-indigo-50">
            <tr>
              <th className="px-4 py-3 font-semibold">Loại đối tượng</th>
              <th className="px-4 py-3 font-semibold">Nội dung bị báo cáo</th>
              <th className="px-4 py-3 font-semibold">Người báo cáo</th>
              <th className="px-4 py-3 font-semibold">Lý do</th>
              <th className="px-4 py-3 font-semibold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500 font-medium">Đang tải báo cáo...</td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500 font-medium">Không có báo cáo nào ở trạng thái này</td>
              </tr>
            ) : reports.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                {/* Target Type */}
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                    r.target_type === 'post' ? 'bg-sky-50 text-sky-600' : r.target_type === 'comment' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                  }`}>
                    {r.target_type === 'post' ? 'Bài viết' : r.target_type === 'comment' ? 'Bình luận' : 'Thành viên'}
                  </span>
                </td>

                {/* Target Snippet */}
                <td className="px-4 py-3 text-slate-700 max-w-[260px] truncate">
                  {r.target_type === 'post' ? (
                    <div className="flex items-center gap-1.5">
                      <a href={`/posts/${r.target_id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-blue-600 font-medium hover:underline">
                        {r.target?.title || `Bài viết #${r.target_id}`} <FiExternalLink size={12} />
                      </a>
                    </div>
                  ) : r.target_type === 'comment' ? (
                    <span className="italic">"{r.target?.content || `Bình luận #${r.target_id}`}"</span>
                  ) : (
                    <span>User: {r.target?.full_name || `User #${r.target_id}`} ({r.target?.email})</span>
                  )}
                </td>

                {/* Reporter */}
                <td className="px-4 py-3 text-slate-600">
                  <div className="font-semibold text-slate-800">{r.reporter?.full_name}</div>
                  <div className="text-xs text-slate-500">{r.reporter?.email}</div>
                </td>

                {/* Reason */}
                <td className="px-4 py-3 text-red-600 font-semibold text-xs">
                  {getReasonText(r.reason)}
                </td>

                {/* Action buttons */}
                <td className="px-4 py-3">
                  {r.status === 'pending' ? (
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={() => handleOpenResolve(r.id, 'resolved')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 border border-transparent rounded-lg hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                      >
                        <FiCheck size={14} /> Duyệt
                      </button>
                      <button
                        onClick={() => handleOpenResolve(r.id, 'rejected')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 hover:border-red-200 transition-colors shadow-sm cursor-pointer"
                      >
                        <FiX size={14} /> Bác bỏ
                      </button>
                    </div>
                  ) : (
                    <div className="text-right text-xs text-slate-500 italic">
                      Đã xử lý {r.admin_note ? `(${r.admin_note})` : ''}
                    </div>
                  )}
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

      {/* Admin Note Modal — Rendered via Portal to document.body */}
      {showNoteModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold ${
                resolveAction === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              }`}>
                {resolveAction === 'resolved' ? '✅' : '❌'}
              </div>
              <button
                onClick={() => setShowNoteModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 mb-1">
              {resolveAction === 'resolved' ? 'Xác nhận Duyệt Báo Cáo' : 'Xác nhận Bác Bỏ Báo Cáo'}
            </h3>
            <p className="text-slate-500 text-sm mb-5 leading-relaxed">
              Nhập ghi chú xử lý (tùy chọn) trước khi lưu thay đổi trạng thái báo cáo.
            </p>

            <form onSubmit={handleResolveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  Ghi chú của Admin
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Đã gỡ nội dung vi phạm..."
                  className="w-full px-4 py-3 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer bg-white"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className={`flex-1 py-3 px-4 rounded-xl text-white font-bold text-sm transition-all shadow-md border-none cursor-pointer ${
                    resolveAction === 'resolved'
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                      : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                  }`}
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
