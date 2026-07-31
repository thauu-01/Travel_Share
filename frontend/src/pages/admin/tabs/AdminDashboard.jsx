import { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import { FiUsers, FiFileText, FiMapPin, FiAlertTriangle, FiEye, FiHeart } from 'react-icons/fi';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => setData(res.data.data))
      .catch(err => console.error('Error fetching dashboard stats:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center items-center p-20"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div></div>;
  if (!data) return <div className="p-8 text-center text-slate-500 font-medium">Không thể tải dữ liệu thống kê</div>;

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

  const stats = [
    { label: 'Tổng người dùng', value: data.totalUsers, icon: FiUsers, bg: 'bg-indigo-50', text: 'text-indigo-600' },
    { label: 'Tổng bài viết', value: data.totalPosts, icon: FiFileText, bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Tổng địa điểm', value: data.totalPlaces, icon: FiMapPin, bg: 'bg-emerald-50', text: 'text-emerald-600' },
    { label: 'Báo cáo chưa duyệt', value: data.totalReports, icon: FiAlertTriangle, bg: 'bg-red-50', text: 'text-red-600' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-sm flex items-center gap-4 hover:-translate-y-1 hover:shadow-md transition-all">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.text}`}>
                <Icon size={24} />
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900 leading-none mb-1">{stat.value}</div>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Signups Chart */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span> Người dùng đăng ký mới (7 ngày qua)
          </h3>
          <div className="flex-1 flex items-end justify-between gap-4 border-b border-slate-100 pb-2 h-[180px]">
            {chartData.map((c, i) => {
              const pct = (c.count / maxCount) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                  <div className="text-xs font-bold text-slate-400 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">{c.count}</div>
                  <div 
                    className="w-full max-w-[32px] rounded-t-md bg-gradient-to-t from-blue-600 to-indigo-500 transition-all duration-500 hover:from-blue-500 hover:to-indigo-400"
                    style={{ height: `${Math.max(pct, c.count > 0 ? 5 : 0)}%` }}
                  ></div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-3 px-1">
            {chartData.map((c, i) => (
              <div key={i} className="flex-1 text-center text-[11px] font-semibold text-slate-400">{c.label}</div>
            ))}
          </div>
        </div>

        {/* Top Hot Places */}
        <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
            🔥 Top địa điểm nổi bật
          </h3>
          <div className="space-y-4">
            {data.topPlaces?.map((place, idx) => (
              <div key={place.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${idx === 0 ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-100 ring-offset-1' : idx === 1 ? 'bg-slate-200 text-slate-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-slate-900 truncate">{place.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 truncate">{place.category?.icon} {place.category?.name} • {place.province}</div>
                </div>
                <div className="flex items-center gap-1 text-sm font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-lg">
                  <FiMapPin size={12} className="text-amber-400" /> {place.avg_rating?.toFixed(1) || '0.0'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Posts */}
      <div className="bg-white rounded-2xl border border-indigo-100 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-5 flex items-center gap-2">
          📝 Bài viết xem nhiều nhất
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 rounded-lg">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Bài viết</th>
                <th className="px-4 py-3">Tác giả</th>
                <th className="px-4 py-3 text-center">Lượt xem</th>
                <th className="px-4 py-3 text-center rounded-r-lg">Lượt thích</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.topPosts?.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3">
                    <a href={`/posts/${post.id}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-800 hover:text-blue-600 transition-colors">
                      {post.title}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                        {post.author?.full_name?.charAt(0) || 'N'}
                      </div>
                      {post.author?.full_name || 'N/A'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 font-semibold text-xs">
                      <FiEye size={12} /> {post.view_count}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-pink-50 text-pink-600 font-semibold text-xs">
                      <FiHeart size={12} /> {post.likes?.length || 0}
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
