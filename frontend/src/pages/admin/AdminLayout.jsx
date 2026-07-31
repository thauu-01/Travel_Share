import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiUsers, FiFileText, FiMapPin, FiTag,
  FiMessageSquare, FiAlertTriangle, FiBell, FiHeadphones,
  FiBarChart2, FiChevronLeft, FiMenu, FiHome, FiLogOut
} from 'react-icons/fi';
import { adminAPI } from '../../services/api';
import { logout } from '../../store/authSlice';

const MENU = [
  { path: '/admin', label: 'Dashboard', icon: FiBarChart2 },
  { path: '/admin/users', label: 'Người dùng', icon: FiUsers },
  { path: '/admin/posts', label: 'Bài viết', icon: FiFileText },
  { path: '/admin/places', label: 'Địa điểm', icon: FiMapPin },
  { path: '/admin/categories', label: 'Danh mục', icon: FiTag },
  { path: '/admin/comments', label: 'Bình luận', icon: FiMessageSquare },
  { path: '/admin/reports', label: 'Báo cáo', icon: FiAlertTriangle },
  { path: '/admin/notifications', label: 'Thông báo', icon: FiBell },
  { path: '/admin/support', label: 'Hỗ trợ CSKH', icon: FiHeadphones },
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
    const fetchPendingReports = async () => {
      try {
        const res = await adminAPI.getDashboard();
        setPendingReportsCount(res?.data?.data?.totalReports || 0);
      } catch (error) {
        console.error('Failed to fetch admin dashboard stats', error);
      }
    };
    fetchPendingReports();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (reportsRef.current && !reportsRef.current.contains(event.target)) {
        setShowReportsPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated || user?.role !== 'admin') {
    setTimeout(() => navigate('/'), 0);
    return null;
  }

  const isActive = (path) => path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);
  
  const pageMeta = [
    { match: (path) => path === '/admin', title: 'Tổng quan hệ thống', description: 'Theo dõi hoạt động và tình trạng', icon: FiBarChart2, bg: 'bg-blue-100', text: 'text-blue-600' },
    { match: (path) => path.startsWith('/admin/users'), title: 'Quản lý người dùng', description: 'Phân quyền, quản lý tài khoản thành viên', icon: FiUsers, bg: 'bg-indigo-100', text: 'text-indigo-600' },
    { match: (path) => path.startsWith('/admin/posts'), title: 'Quản lý bài viết', description: 'Kiểm duyệt bài đăng trên nền tảng', icon: FiFileText, bg: 'bg-teal-100', text: 'text-teal-600' },
    { match: (path) => path.startsWith('/admin/places'), title: 'Quản lý địa điểm', description: 'Cập nhật các địa điểm du lịch', icon: FiMapPin, bg: 'bg-amber-100', text: 'text-amber-600' },
    { match: (path) => path.startsWith('/admin/categories'), title: 'Quản lý danh mục', description: 'Nhóm danh mục và phân loại nội dung', icon: FiTag, bg: 'bg-pink-100', text: 'text-pink-600' },
    { match: (path) => path.startsWith('/admin/comments'), title: 'Quản lý bình luận', description: 'Kiểm soát bình luận và tương tác', icon: FiMessageSquare, bg: 'bg-cyan-100', text: 'text-cyan-600' },
    { match: (path) => path.startsWith('/admin/reports'), title: 'Quản lý báo cáo', description: 'Xử lý báo cáo vi phạm', icon: FiAlertTriangle, bg: 'bg-red-100', text: 'text-red-600' },
    { match: (path) => path.startsWith('/admin/notifications'), title: 'Thông báo', description: 'Gửi thông báo hệ thống', icon: FiBell, bg: 'bg-violet-100', text: 'text-violet-600' },
    { match: (path) => path.startsWith('/admin/support'), title: 'Hỗ trợ khách hàng', description: 'Trả lời tin nhắn người dùng', icon: FiHeadphones, bg: 'bg-sky-100', text: 'text-sky-600' },
  ];
  const currentPageMeta = pageMeta.find(item => item.match(location.pathname)) || pageMeta[0];
  const PageIcon = currentPageMeta.icon;

  return (
    <div className="flex min-h-screen bg-[#f0f7ff] font-sans text-slate-800">
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 bottom-0 z-50 bg-white border-r border-indigo-100 shadow-[4px_0_24px_rgba(30,58,138,0.02)] flex flex-col transition-all duration-300 ${collapsed ? 'w-[70px]' : 'w-[240px]'}`}>
        <div className="h-16 px-4 flex items-center justify-between border-b border-indigo-50 shrink-0">
          {!collapsed && <span className="font-extrabold text-blue-600 text-lg tracking-tight">AdminPanel</span>}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors mx-auto">
            {collapsed ? <FiMenu size={20} /> : <FiChevronLeft size={20} />}
          </button>
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto space-y-1 px-3 custom-scrollbar">
          {MENU.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} title={collapsed ? item.label : ''} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                active ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' : 'text-slate-500 hover:bg-indigo-50 hover:text-blue-600'
              }`}>
                <Icon size={18} className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-indigo-50 space-y-2 shrink-0">
          <button onClick={() => navigate('/')} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
            <FiHome size={16} /> {!collapsed && 'Trang chủ'}
          </button>
          <button onClick={() => { dispatch(logout()); navigate('/'); }} className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors">
            <FiLogOut size={16} /> {!collapsed && 'Đăng xuất'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${collapsed ? 'ml-[70px]' : 'ml-[240px]'}`}>
        <header className="h-16 px-6 bg-white/80 backdrop-blur-md border-b border-indigo-100 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentPageMeta.bg} ${currentPageMeta.text}`}>
              <PageIcon size={20} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">{currentPageMeta.title}</h1>
              <p className="text-xs text-slate-500 font-medium">{currentPageMeta.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div ref={reportsRef} className="relative">
              <button
                onClick={() => setShowReportsPanel(!showReportsPanel)}
                className="w-10 h-10 rounded-full border border-indigo-100 bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors relative"
              >
                <FiBell size={18} />
                {pendingReportsCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white shadow-sm">
                    {pendingReportsCount > 99 ? '99+' : pendingReportsCount}
                  </span>
                )}
              </button>

              {showReportsPanel && (
                <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-indigo-100 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="font-bold text-slate-900 mb-1">Báo cáo chưa xử lý</div>
                  <div className="text-sm text-slate-500 mb-4">
                    {pendingReportsCount > 0
                      ? `Có ${pendingReportsCount} báo cáo vi phạm đang chờ bạn kiểm duyệt.`
                      : 'Tuyệt vời! Không có báo cáo nào đang chờ xử lý.'}
                  </div>
                  <button
                    onClick={() => { setShowReportsPanel(false); navigate('/admin/reports'); }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-xl transition-colors"
                  >
                    Xem chi tiết báo cáo
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Đang trực tuyến
            </div>
          </div>
        </header>

        <div className="p-6 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
