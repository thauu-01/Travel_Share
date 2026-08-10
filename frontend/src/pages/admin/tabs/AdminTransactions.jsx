import { useState, useEffect, useCallback } from 'react';
import { adminAPI } from '../../../services/api';
import { FiSearch, FiRefreshCw, FiChevronLeft, FiChevronRight, FiTrendingUp, FiDollarSign, FiZap, FiCheckCircle } from 'react-icons/fi';

const STATUS_CONFIG = {
  success: { label: '✅ Thành công', bg: 'rgba(16,185,129,0.15)', color: '#10b981', border: 'rgba(16,185,129,0.3)' },
  failed:  { label: '❌ Thất bại',   bg: 'rgba(239,68,68,0.12)',  color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  expired: { label: '⏱️ Hết hạn',   bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  pending: { label: '⌛ Chờ xử lý', bg: 'rgba(59,130,246,0.12)', color: '#3b82f6', border: 'rgba(59,130,246,0.3)' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
      {cfg.label}
    </span>
  );
}

function formatVND(amount) {
  return (amount || 0).toLocaleString('vi-VN') + ' đ';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminTransactions() {
  const [data, setData] = useState({ payments: [], pagination: {}, stats: {} });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const res = await adminAPI.getTransactions(params);
      setData(res.data.data);
    } catch (err) {
      console.error('AdminTransactions error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const handleStatusFilter = (s) => {
    setStatusFilter(s);
    setPage(1);
  };

  const { payments, pagination, stats } = data;

  return (
    <div style={{ padding: '28px 32px', minHeight: '100vh', background: '#f8fafc' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>💳 Lịch sử Giao dịch</h1>
        <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Toàn bộ lịch sử thanh toán VNPay của người dùng</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          {
            label: 'Tổng doanh thu', icon: <FiDollarSign size={20} />,
            value: formatVND(stats.totalRevenue),
            bg: 'linear-gradient(135deg, #10b981, #059669)', shadow: 'rgba(16,185,129,0.25)'
          },
          {
            label: 'Lượt AI đã bán', icon: <FiZap size={20} />,
            value: `${stats.totalCredits || 0} lượt`,
            bg: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', shadow: 'rgba(139,92,246,0.25)'
          },
          {
            label: 'Đơn thành công', icon: <FiCheckCircle size={20} />,
            value: `${stats.totalOrders || 0} đơn`,
            bg: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', shadow: 'rgba(59,130,246,0.25)'
          },
        ].map((card, i) => (
          <div key={i} style={{
            background: 'white', borderRadius: 16, padding: '20px 24px',
            boxShadow: '0 1px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 16
          }}>
            <div style={{
              background: card.bg, borderRadius: 12, width: 44, height: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              boxShadow: `0 4px 14px ${card.shadow}`, flexShrink: 0
            }}>{card.icon}</div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', lineHeight: 1.1 }}>{card.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '16px 20px',
        marginBottom: 20, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)'
      }}>
        {/* Search */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 220 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 14 }} />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder="Tìm email hoặc tên user..."
              style={{
                width: '100%', paddingLeft: 32, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
                border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 13, outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit'
              }}
            />
          </div>
          <button type="submit" style={{
            padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600,
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: 'white', fontSize: 13
          }}>Tìm</button>
        </form>

        {/* Status filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {['', 'success', 'failed', 'expired', 'pending'].map(s => (
            <button
              key={s || 'all'}
              onClick={() => handleStatusFilter(s)}
              style={{
                padding: '7px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600,
                fontSize: 12, transition: 'all 0.15s',
                background: statusFilter === s ? '#1e293b' : '#f1f5f9',
                color: statusFilter === s ? 'white' : '#64748b',
              }}
            >
              {s === '' ? 'Tất cả' : STATUS_CONFIG[s]?.label || s}
            </button>
          ))}
        </div>

        <button
          onClick={fetchData}
          style={{
            padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 10, background: 'white',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontWeight: 600, fontSize: 13
          }}
        >
          <FiRefreshCw size={13} /> Làm mới
        </button>
      </div>

      {/* Table */}
      <div style={{ background: 'white', borderRadius: 16, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
            Đang tải...
          </div>
        ) : payments?.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>Không có giao dịch nào</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['ID', 'Mã VNPay', 'Người dùng', 'Số tiền', 'Lượt AI', 'Trạng thái', 'Mã lỗi', 'Thời gian'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '12px 16px', color: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}>#{p._id}</td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: '#475569' }}>
                      <span title={p.txn_ref}>{p.txn_ref?.slice(0, 16)}...</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {p.user ? (
                        <div>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.user.full_name}</div>
                          <div style={{ color: '#94a3b8', fontSize: 11 }}>{p.user.email}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>User #{p.user_id}</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#10b981', whiteSpace: 'nowrap' }}>
                      {formatVND(p.amount)}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#8b5cf6', textAlign: 'center' }}>
                      +{p.credits_purchased}
                    </td>
                    <td style={{ padding: '12px 16px' }}><StatusBadge status={p.status} /></td>
                    <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 11, color: p.vnp_response_code ? '#ef4444' : '#94a3b8' }}>
                      {p.vnp_response_code || '—'}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap', fontSize: 12 }}>
                      {formatDate(p.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination?.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 10, background: 'white', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <FiChevronLeft size={14} /> Trước
          </button>
          <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>
            Trang {pagination.page} / {pagination.totalPages} ({pagination.total} giao dịch)
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 10, background: 'white', cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer', opacity: page >= pagination.totalPages ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            Sau <FiChevronRight size={14} />
          </button>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
