import { useState, useEffect } from 'react';
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
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', gap: '20px', marginBottom: '20px' }}>
        <button
          onClick={() => { setStatusFilter('pending'); setPage(1); }}
          style={{ padding: '12px 4px', border: 'none', borderBottom: statusFilter === 'pending' ? '2px solid #6366f1' : '2px solid transparent', background: 'none', color: statusFilter === 'pending' ? '#6366f1' : '#64748b', fontWeight: statusFilter === 'pending' ? 600 : 400, cursor: 'pointer' }}
        >
          Chờ xử lý
        </button>
        <button
          onClick={() => { setStatusFilter('resolved'); setPage(1); }}
          style={{ padding: '12px 4px', border: 'none', borderBottom: statusFilter === 'resolved' ? '2px solid #6366f1' : '2px solid transparent', background: 'none', color: statusFilter === 'resolved' ? '#6366f1' : '#64748b', fontWeight: statusFilter === 'resolved' ? 600 : 400, cursor: 'pointer' }}
        >
          Đã xử lý (Chấp thuận)
        </button>
        <button
          onClick={() => { setStatusFilter('rejected'); setPage(1); }}
          style={{ padding: '12px 4px', border: 'none', borderBottom: statusFilter === 'rejected' ? '2px solid #6366f1' : '2px solid transparent', background: 'none', color: statusFilter === 'rejected' ? '#6366f1' : '#64748b', fontWeight: statusFilter === 'rejected' ? 600 : 400, cursor: 'pointer' }}
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
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-white bg-emerald-600 border border-transparent rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                      >
                        <FiCheck size={14} /> Duyệt
                      </button>
                      <button
                        onClick={() => handleOpenResolve(r.id, 'rejected')}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 hover:border-red-200 transition-colors shadow-sm"
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

      {/* Admin Note Modal */}
      {showNoteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: 12, padding: '24px', width: '380px', maxWidth: '90vw', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h3 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: 700 }}>
              {resolveAction === 'resolved' ? '✅ Xác nhận Duyệt Báo Cáo' : '❌ Xác nhận Bác Bỏ Báo Cáo'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 16 }}>Nhập ghi chú xử lý (tùy chọn) trước khi lưu trạng thái.</p>
            <form onSubmit={handleResolveSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  placeholder="Ghi chú của Admin (Ví dụ: Đã ẩn bài viết vi phạm)..."
                  className="form-input"
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNoteModal(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: resolveAction === 'resolved' ? '#16a34a' : '#dc2626', borderColor: resolveAction === 'resolved' ? '#16a34a' : '#dc2626' }}>
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
