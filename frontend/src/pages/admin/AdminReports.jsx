import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
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
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>🚩 Kiểm duyệt báo cáo vi phạm</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>Xem xét và xử lý các báo cáo vi phạm bài đăng, comment hoặc người dùng từ cộng đồng</p>
      </div>

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
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '14px 16px' }}>Loại đối tượng</th>
              <th style={{ padding: '14px 16px' }}>Nội dung bị báo cáo</th>
              <th style={{ padding: '14px 16px' }}>Người báo cáo</th>
              <th style={{ padding: '14px 16px' }}>Lý do</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải báo cáo...</td>
              </tr>
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Không có báo cáo nào ở trạng thái này</td>
              </tr>
            ) : reports.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                {/* Target Type */}
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    backgroundColor: r.target_type === 'post' ? '#e0f2fe' : r.target_type === 'comment' ? '#fef3c7' : '#fee2e2',
                    color: r.target_type === 'post' ? '#0369a1' : r.target_type === 'comment' ? '#b45309' : '#b91c1c',
                    padding: '4px 8px',
                    borderRadius: 12,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase'
                  }}>
                    {r.target_type === 'post' ? 'Bài viết' : r.target_type === 'comment' ? 'Bình luận' : 'Thành viên'}
                  </span>
                </td>

                {/* Target Snippet */}
                <td style={{ padding: '14px 16px', color: '#334155', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.target_type === 'post' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <a href={`/posts/${r.target_id}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#4f46e5', textDecoration: 'none', fontWeight: 500 }}>
                        {r.target?.title || `Bài viết #${r.target_id}`} <FiExternalLink size={12} />
                      </a>
                    </div>
                  ) : r.target_type === 'comment' ? (
                    <span>"{r.target?.content || `Bình luận #${r.target_id}`}"</span>
                  ) : (
                    <span>User: {r.target?.full_name || `User #${r.target_id}`} ({r.target?.email})</span>
                  )}
                </td>

                {/* Reporter */}
                <td style={{ padding: '14px 16px', color: '#475569' }}>
                  <div>{r.reporter?.full_name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.reporter?.email}</div>
                </td>

                {/* Reason */}
                <td style={{ padding: '14px 16px', color: '#b91c1c', fontWeight: 500 }}>
                  {getReasonText(r.reason)}
                </td>

                {/* Action buttons */}
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  {r.status === 'pending' ? (
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenResolve(r.id, 'resolved')}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: '#16a34a', borderColor: '#16a34a' }}
                      >
                        <FiCheck /> Duyệt
                      </button>
                      <button
                        onClick={() => handleOpenResolve(r.id, 'rejected')}
                        className="btn btn-sm"
                        style={{ padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: '#dc2626', color: 'white', borderColor: '#dc2626' }}
                      >
                        <FiX /> Bác bỏ
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                      Đã xử lý {r.admin_note ? `(${r.admin_note})` : ''}
                    </span>
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
