import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiUsers, FiFileText, FiMapPin, FiTag,
  FiMessageSquare, FiAlertTriangle, FiBell, FiHeadphones,
  FiBarChart2, FiChevronLeft, FiMenu, FiHome, FiLogOut,
  FiShield, FiActivity, FiCreditCard
} from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import { logout } from '../../store/authSlice';

const MENU = [
  { path: '/admin',               label: 'Dashboard',     icon: FiBarChart2,     color: 'text-blue-400',   dot: 'bg-blue-500' },
  { path: '/admin/users',         label: 'Người dùng',    icon: FiUsers,         color: 'text-indigo-400', dot: 'bg-indigo-500' },
  { path: '/admin/posts',         label: 'Bài viết',      icon: FiFileText,      color: 'text-teal-400',   dot: 'bg-teal-500' },
  { path: '/admin/places',        label: 'Địa điểm',      icon: FiMapPin,        color: 'text-amber-400',  dot: 'bg-amber-500' },
  { path: '/admin/categories',    label: 'Danh mục',      icon: FiTag,           color: 'text-pink-400',   dot: 'bg-pink-500' },
  { path: '/admin/comments',      label: 'Bình luận',     icon: FiMessageSquare, color: 'text-cyan-400',   dot: 'bg-cyan-500' },
  { path: '/admin/reports',       label: 'Báo cáo',       icon: FiAlertTriangle, color: 'text-red-400',    dot: 'bg-red-500' },
  { path: '/admin/notifications', label: 'Thông báo',     icon: FiBell,          color: 'text-violet-400', dot: 'bg-violet-500' },
  { path: '/admin/support',       label: 'Hỗ trợ CSKH',  icon: FiHeadphones,    color: 'text-sky-400',    dot: 'bg-sky-500' },
  { path: '/admin/transactions',  label: 'Giao dịch',      icon: FiCreditCard,    color: 'text-emerald-400',dot: 'bg-emerald-500' },
];

const PAGE_META = [
  { match: p => p === '/admin',                    title: 'Tổng quan hệ thống',   desc: 'Theo dõi hoạt động và tình trạng nền tảng',     icon: FiBarChart2,     accent: '#3b82f6' },
  { match: p => p.startsWith('/admin/users'),      title: 'Quản lý người dùng',   desc: 'Phân quyền và quản lý tài khoản thành viên',    icon: FiUsers,         accent: '#6366f1' },
  { match: p => p.startsWith('/admin/posts'),      title: 'Quản lý bài viết',     desc: 'Kiểm duyệt bài đăng trên nền tảng',             icon: FiFileText,      accent: '#14b8a6' },
  { match: p => p.startsWith('/admin/places'),     title: 'Quản lý địa điểm',     desc: 'Cập nhật các địa điểm du lịch',                 icon: FiMapPin,        accent: '#f59e0b' },
  { match: p => p.startsWith('/admin/categories'), title: 'Quản lý danh mục',     desc: 'Nhóm danh mục và phân loại nội dung',           icon: FiTag,           accent: '#ec4899' },
  { match: p => p.startsWith('/admin/comments'),   title: 'Quản lý bình luận',    desc: 'Kiểm soát bình luận và tương tác người dùng',   icon: FiMessageSquare, accent: '#06b6d4' },
  { match: p => p.startsWith('/admin/reports'),    title: 'Xử lý báo cáo',        desc: 'Xử lý các báo cáo vi phạm từ cộng đồng',       icon: FiAlertTriangle, accent: '#ef4444' },
  { match: p => p.startsWith('/admin/notifications'), title: 'Thông báo',         desc: 'Gửi thông báo hệ thống đến người dùng',         icon: FiBell,          accent: '#8b5cf6' },
  { match: p => p.startsWith('/admin/support'),       title: 'Hỗ trợ khách hàng',    desc: 'Trả lời tin nhắn và hỗ trợ người dùng',        icon: FiHeadphones,    accent: '#0ea5e9' },
  { match: p => p.startsWith('/admin/transactions'),   title: 'Lịch sử Giao dịch',     desc: 'Theo dõi doanh thu và giao dịch VNPay',         icon: FiCreditCard,    accent: '#10b981' },
];

export default function AdminLayout() {
  const { user, isAuthenticated } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [showReportsPanel, setShowReportsPanel] = useState(false);
  const reportsRef = useRef(null);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(res => setPendingReportsCount(res?.data?.data?.totalReports || 0))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (reportsRef.current && !reportsRef.current.contains(e.target)) setShowReportsPanel(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!isAuthenticated || user?.role !== 'admin') {
    setTimeout(() => navigate('/'), 0);
    return null;
  }

  const isActive = (path) => path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);
  const currentMeta = PAGE_META.find(m => m.match(location.pathname)) || PAGE_META[0];
  const PageIcon = currentMeta.icon;

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── SIDEBAR ── */}
      <aside className={`fixed top-0 left-0 bottom-0 z-50 flex flex-col transition-all duration-300 ease-in-out ${collapsed ? 'w-[68px]' : 'w-[240px]'}`}
        style={{ background: 'linear-gradient(180deg, #0f172a 0%, #0f1629 100%)', borderRight: '1px solid rgba(255,255,255,0.05)' }}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center shrink-0 border-b ${collapsed ? 'justify-center px-4' : 'gap-2.5 px-5'}`}
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shrink-0">
            <FiShield size={16} />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-bold text-white leading-tight">Admin Panel</div>
              <div className="text-[10px] text-slate-500 font-medium">TravelShare</div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`ml-auto p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all border-none bg-transparent cursor-pointer ${collapsed ? 'hidden' : ''}`}
          >
            <FiChevronLeft size={16} />
          </button>
        </div>

        {/* Collapse toggle when collapsed */}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="mx-auto mt-2 p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-all border-none bg-transparent cursor-pointer"
          >
            <FiMenu size={16} />
          </button>
        )}

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {!collapsed && <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider px-2 mb-3">Menu</p>}
          {MENU.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={collapsed ? item.label : ''}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                {/* Active indicator */}
                {active && !collapsed && (
                  <span className={`absolute left-0 w-0.5 h-6 rounded-r-full ${item.dot}`} style={{ marginLeft: '-12px' }} />
                )}
                <Icon size={17} className={`shrink-0 ${active ? item.color : ''}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
                {active && collapsed && <span className={`absolute left-0 w-0.5 h-6 rounded-r-full ${item.dot}`} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom actions */}
        <div className={`p-3 border-t space-y-1 shrink-0 ${collapsed ? 'flex flex-col items-center' : ''}`}
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <button
            onClick={() => navigate('/')}
            title={collapsed ? 'Trang chủ' : ''}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all border-none bg-transparent cursor-pointer text-sm font-medium ${collapsed ? 'justify-center w-11' : 'w-full'}`}
          >
            <FiHome size={16} className="shrink-0" />
            {!collapsed && 'Trang chủ'}
          </button>
          <button
            onClick={() => { dispatch(logout()); navigate('/'); }}
            title={collapsed ? 'Đăng xuất' : ''}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all border-none bg-transparent cursor-pointer text-sm font-medium ${collapsed ? 'justify-center w-11' : 'w-full'}`}
          >
            <FiLogOut size={16} className="shrink-0" />
            {!collapsed && 'Đăng xuất'}
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'ml-[68px]' : 'ml-[240px]'}`}
        style={{ background: '#f8faff' }}
      >
        {/* Top Header */}
        <header className="h-16 px-6 flex items-center justify-between sticky top-0 z-40 bg-white border-b border-slate-100">
          {/* Page info */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm shrink-0"
              style={{ background: currentMeta.accent }}
            >
              <PageIcon size={17} />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">{currentMeta.title}</h1>
              <p className="text-xs text-slate-400 leading-tight mt-0.5">{currentMeta.desc}</p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Reports bell */}
            <div ref={reportsRef} className="relative">
              <button
                onClick={() => setShowReportsPanel(!showReportsPanel)}
                className="relative w-9 h-9 rounded-xl border border-slate-100 bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all cursor-pointer"
              >
                <FiBell size={16} />
                {pendingReportsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white">
                    {pendingReportsCount > 99 ? '99+' : pendingReportsCount}
                  </span>
                )}
              </button>

              {showReportsPanel && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-72 bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-100 p-5 z-50 animate-scale-in">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                      <FiAlertTriangle size={15} className="text-red-500" />
                    </div>
                    <div className="font-bold text-sm text-slate-900">Báo cáo chờ xử lý</div>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">
                    {pendingReportsCount > 0
                      ? `Có ${pendingReportsCount} báo cáo vi phạm đang chờ kiểm duyệt.`
                      : 'Không có báo cáo nào đang chờ xử lý.'}
                  </p>
                  <button
                    onClick={() => { setShowReportsPanel(false); navigate('/admin/reports'); }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-colors border-none cursor-pointer"
                  >
                    Xem tất cả báo cáo →
                  </button>
                </div>
              )}
            </div>

            {/* Live badge */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Online
            </div>

            {/* Admin avatar */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                : user?.full_name?.[0]}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
