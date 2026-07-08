import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { FiUsers, FiFileText, FiMapPin, FiAlertTriangle, FiEye, FiHeart } from 'react-icons/fi';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => {
        setData(res.data.data);
      })
      .catch(err => {
        console.error('Error fetching dashboard stats:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner"></div></div>;
  if (!data) return <div style={{ padding: '2rem', textAlign: 'center' }}>Không thể tải dữ liệu thống kê</div>;

  // Process last 7 days user registrations count
  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  const chartData = days.map(day => {
    const label = `${day.getDate()}/${day.getMonth() + 1}`;
    const count = data.newUsers?.filter(user => {
      const uDate = new Date(user.created_at);
      return uDate.getDate() === day.getDate() && uDate.getMonth() === day.getMonth();
    }).length || 0;
    return { label, count };
  });

  const maxCount = Math.max(...chartData.map(c => c.count), 1);

  return (
    <div className="animate-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>📊 Thống kê & Báo cáo</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>Tổng quan hoạt động hệ thống TravelShare</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '28px' }}>
        <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontSize: '1.4rem' }}>
            <FiUsers />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{data.totalUsers}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>Tổng người dùng</div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', fontSize: '1.4rem' }}>
            <FiFileText />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{data.totalPosts}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>Tổng bài viết</div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontSize: '1.4rem' }}>
            <FiMapPin />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{data.totalPlaces}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>Tổng địa điểm</div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #e2e8f0' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', fontSize: '1.4rem' }}>
            <FiAlertTriangle />
          </div>
          <div>
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0f172a', lineHeight: 1 }}>{data.totalReports}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 4 }}>Báo cáo chưa duyệt</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart and lists */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* User Signups Chart */}
        <div style={{ background: 'white', borderRadius: 12, padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 20px 0' }}>📈 Người dùng đăng ký mới (7 ngày qua)</h3>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
            {chartData.map((c, i) => {
              const pct = (c.count / maxCount) * 100;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4 }}>{c.count}</div>
                  <div style={{
                    width: '100%',
                    maxWidth: '30px',
                    height: `${pct}%`,
                    background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
                    borderRadius: '4px 4px 0 0',
                    minHeight: c.count > 0 ? 8 : 0,
                    transition: 'height 0.5s ease'
                  }}></div>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
            {chartData.map((c, i) => (
              <div key={i} style={{ flex: 1, textBreak: 'normal', textAlign: 'center', fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>
                {c.label}
              </div>
            ))}
          </div>
        </div>

        {/* Top Hot Places */}
        <div style={{ background: 'white', borderRadius: 12, padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 16px 0' }}>🔥 Top địa điểm nổi bật</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {data.topPlaces?.map((place, idx) => (
              <div key={place.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '10px', borderBottom: idx < 4 ? '1px solid #f1f5f9' : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: idx === 0 ? '#fef08a' : '#f1f5f9', color: idx === 0 ? '#854d0e' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{place.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{place.category?.icon} {place.category?.name} • {place.province}</div>
                </div>
                <div style={{ textAlign: 'right', fontWeight: 600, color: '#eab308', fontSize: '0.9rem' }}>
                  ★ {place.avg_rating?.toFixed(1) || '0.0'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Posts by Views */}
      <div style={{ background: 'white', borderRadius: 12, padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', margin: '0 0 16px 0' }}>📝 Bài viết xem nhiều nhất</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid #f1f5f9' }}>
                <th style={{ padding: '12px' }}>Bài viết</th>
                <th style={{ padding: '12px' }}>Tác giả</th>
                <th style={{ padding: '12px', textAlign: 'center' }}><FiEye /> Lượt xem</th>
                <th style={{ padding: '12px', textAlign: 'center' }}><FiHeart /> Lượt thích</th>
              </tr>
            </thead>
            <tbody>
              {data.topPosts?.map((post, idx) => (
                <tr key={post.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontWeight: 500, color: '#0f172a' }}>
                    <a href={`/posts/${post.id}`} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {post.title}
                    </a>
                  </td>
                  <td style={{ padding: '12px', color: '#475569' }}>{post.author?.full_name || 'N/A'}</td>
                  <td style={{ padding: '12px', textAlign: 'center', fontWeight: 500 }}>{post.view_count}</td>
                  <td style={{ padding: '12px', textAlign: 'center', color: '#e11d48', fontWeight: 500 }}>{post.likes?.length || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
