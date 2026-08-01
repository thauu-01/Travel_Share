import { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import { FiUsers, FiFileText, FiMapPin, FiAlertTriangle, FiEye, FiHeart, FiTrendingUp, FiArrowUp } from 'react-icons/fi';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => setData(res.data.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Đang tải dữ liệu...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className="flex justify-center items-center h-64 text-slate-400">
      <div className="text-center">
        <div className="text-4xl mb-3">📊</div>
        <p className="font-medium">Không thể tải dữ liệu thống kê</p>
      </div>
    </div>
  );

  const today = new Date();
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    return d;
  });

  const chartData = days.map(day => {
    const label = `${day.getDate()}/${day.getMonth() + 1}`;
    const count = data.newUsers?.filter(u => {
      const ud = new Date(u.created_at);
      return ud.getDate() === day.getDate() && ud.getMonth() === day.getMonth();
    }).length || 0;
    return { label, count };
  });

  const maxCount = Math.max(...chartData.map(c => c.count), 1);

  const stats = [
    {
      label: 'Tổng người dùng',
      value: data.totalUsers,
      icon: FiUsers,
      gradient: 'from-blue-500 to-blue-600',
      light: 'bg-blue-50',
      text: 'text-blue-600',
      change: '+12%',
    },
    {
      label: 'Tổng bài viết',
      value: data.totalPosts,
      icon: FiFileText,
      gradient: 'from-indigo-500 to-indigo-600',
      light: 'bg-indigo-50',
      text: 'text-indigo-600',
      change: '+8%',
    },
    {
      label: 'Tổng địa điểm',
      value: data.totalPlaces,
      icon: FiMapPin,
      gradient: 'from-emerald-500 to-emerald-600',
      light: 'bg-emerald-50',
      text: 'text-emerald-600',
      change: '+3%',
    },
    {
      label: 'Báo cáo chờ duyệt',
      value: data.totalReports,
      icon: FiAlertTriangle,
      gradient: 'from-red-500 to-rose-600',
      light: 'bg-red-50',
      text: 'text-red-600',
      change: data.totalReports > 0 ? 'Cần xử lý' : 'Sạch',
      changeColor: data.totalReports > 0 ? 'text-red-500' : 'text-emerald-500',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in">

      {/* ── STAT CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white shadow-sm`}>
                  <Icon size={20} />
                </div>
                <span className={`text-xs font-semibold flex items-center gap-1 ${stat.changeColor || 'text-emerald-500'}`}>
                  {!stat.changeColor && <FiArrowUp size={11} />}
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-slate-900 mb-1 tabular-nums">{stat.value?.toLocaleString()}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{stat.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ── CHART ── */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FiTrendingUp size={16} className="text-blue-500" />
                Người dùng đăng ký mới
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">7 ngày gần nhất</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Người dùng mới
            </div>
          </div>

          <div className="flex items-end justify-between gap-2 h-[160px] border-b border-slate-100 pb-3">
            {chartData.map((c, i) => {
              const pct = (c.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group/bar cursor-default">
                  {c.count > 0 && (
                    <div className="text-[10px] font-bold text-slate-500 mb-1.5 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-slate-100 px-1.5 py-0.5 rounded-md">
                      {c.count}
                    </div>
                  )}
                  <div
                    className="w-full max-w-[28px] rounded-t-lg transition-all duration-500 group-hover/bar:brightness-110"
                    style={{
                      height: `${Math.max(pct, c.count > 0 ? 6 : 1)}%`,
                      background: c.count > 0
                        ? 'linear-gradient(to top, #2563eb, #818cf8)'
                        : '#f1f5f9'
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-3 px-1">
            {chartData.map((c, i) => (
              <div key={i} className="flex-1 text-center text-[10px] font-semibold text-slate-400">{c.label}</div>
            ))}
          </div>
        </div>

        {/* ── TOP PLACES ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
            🔥 Top địa điểm nổi bật
          </h3>
          <div className="space-y-3">
            {data.topPlaces?.slice(0, 5).map((place, idx) => (
              <div key={place.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group/place">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  idx === 0 ? 'bg-amber-100 text-amber-700' :
                  idx === 1 ? 'bg-slate-100 text-slate-600' :
                  idx === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-50 text-slate-400'
                }`}>
                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-slate-800 truncate group-hover/place:text-blue-600 transition-colors">{place.name}</div>
                  <div className="text-xs text-slate-400 truncate">{place.province}</div>
                </div>
                <div className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg shrink-0">
                  ⭐ {place.avg_rating?.toFixed(1) || '0.0'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TOP POSTS TABLE ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-50">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            📝 Bài viết xem nhiều nhất
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/80">
                <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bài viết</th>
                <th className="px-6 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tác giả</th>
                <th className="px-6 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lượt xem</th>
                <th className="px-6 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lượt thích</th>
              </tr>
            </thead>
            <tbody>
              {data.topPosts?.map((post, idx) => (
                <tr key={post.id} className="border-t border-slate-50 hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <a
                      href={`/posts/${post.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-slate-800 hover:text-blue-600 transition-colors line-clamp-1 block"
                    >
                      {post.title}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden shrink-0">
                        {post.author?.avatar_url
                          ? <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                          : post.author?.full_name?.charAt(0) || 'N'}
                      </div>
                      <span className="text-sm text-slate-600 font-medium">{post.author?.full_name || 'N/A'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold text-xs">
                      <FiEye size={11} /> {post.view_count?.toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-500 font-semibold text-xs">
                      <FiHeart size={11} /> {post.likes?.length || 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
