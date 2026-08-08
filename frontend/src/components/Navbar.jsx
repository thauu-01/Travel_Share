import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { notificationAPI } from '../services/api';
import { io } from 'socket.io-client';
import { FiBell, FiPlus, FiSearch, FiLogOut, FiCompass, FiCalendar, FiUser, FiShield } from 'react-icons/fi';

export default function Navbar() {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      const socketUrl = import.meta.env.VITE_SOCKET_URL || (typeof window !== 'undefined' ? window.location.origin : '');
      socketRef.current = io(socketUrl);
      socketRef.current.emit('join', user.id);
      socketRef.current.on('notification', (notif) => {
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
      });
      return () => { if (socketRef.current) socketRef.current.disconnect(); };
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotif(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    // Only fetch if we have a token stored (avoid 401 noise)
    if (!localStorage.getItem('token')) return;
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.data?.notifications || []);
      setUnreadCount(res.data.data?.unreadCount || 0);
    } catch (err) {
      // 401 handled by axios interceptor (auto-refresh), ignore other errors
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) { /* ignore */ }
  };

  const handleMarkRead = async (notif) => {
    // Optimistic update ngay lập tức
    if (!notif.is_read) {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      try {
        await notificationAPI.markRead(notif.id);
      } catch { /* ignore */ }
    }
    // Navigate nếu có bài viết
    if (notif.post_id) navigate(`/posts/${notif.post_id}`);
    setShowNotif(false);
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    setShowNotif(false);
    dispatch(logout());
    navigate('/');
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'Vừa xong';
    if (s < 3600) return `${Math.floor(s/60)} phút trước`;
    if (s < 86400) return `${Math.floor(s/3600)} giờ trước`;
    return `${Math.floor(s/86400)} ngày trước`;
  };

  if (location.pathname === '/login' || location.pathname === '/register') return null;

  const navLinks = [
    { to: '/', label: 'Trang chủ', icon: null },
    { to: '/explore', label: 'Khám phá', icon: <FiCompass size={15} /> },
    { to: '/search', label: 'Tìm kiếm', icon: <FiSearch size={15} /> },
    ...(isAuthenticated ? [{ to: '/trips', label: 'Lịch trình', icon: <FiCalendar size={15} /> }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[1000] h-16 flex items-center justify-between px-6 md:px-8 transition-all duration-300 ${
      scrolled
        ? 'bg-white/90 backdrop-blur-xl shadow-sm shadow-blue-900/5 border-b border-slate-100'
        : 'bg-white/70 backdrop-blur-lg border-b border-slate-100/60'
    }`}>

      {/* Brand */}
      <Link to="/" className="flex items-center gap-2.5 font-extrabold text-lg shrink-0">
        <span className="text-xl">✈️</span>
        <span className="gradient-text tracking-tight">TravelShare</span>
      </Link>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-1">
        {navLinks.map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            className={`relative inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive(to)
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {icon}
            {label}
            {isActive(to) && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-blue-600 rounded-full" />
            )}
          </Link>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {isAuthenticated ? (
          <>
            {/* Write button */}
            <Link
              to="/create-post"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-xs bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all duration-200 hover:-translate-y-px"
            >
              <FiPlus size={14} /> Viết bài
            </Link>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                className="relative w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all cursor-pointer border-none bg-transparent"
                onClick={() => setShowNotif(!showNotif)}
              >
                <FiBell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[0.6rem] font-bold flex items-center justify-center leading-none">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-[360px] max-h-[420px] bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100 overflow-hidden z-[100] animate-scale-in">
                  <div className="flex justify-between items-center px-5 py-3.5 border-b border-slate-50">
                    <span className="font-bold text-sm text-slate-900">Thông báo</span>
                    {unreadCount > 0 && (
                      <button
                        className="text-xs text-blue-600 font-semibold hover:text-blue-800 bg-transparent border-none cursor-pointer"
                        onClick={handleMarkAllRead}
                      >
                        Đánh dấu tất cả đã đọc
                      </button>
                    )}
                  </div>

                  <div className="overflow-y-auto max-h-[360px]">
                    {notifications.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-sm">
                        <div className="text-3xl mb-2">🔔</div>
                        Chưa có thông báo
                      </div>
                    ) : (
                      notifications.slice(0, 20).map(n => (
                        <div
                          key={n.id}
                          className={`flex items-start gap-3 px-4 py-3.5 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${!n.is_read ? 'bg-blue-50/50' : ''}`}
                          onClick={() => handleMarkRead(n)}
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-[0.7rem] overflow-hidden shrink-0">
                            {n.fromUser?.avatar_url
                              ? <img src={n.fromUser.avatar_url} alt="" className="w-full h-full object-cover" />
                              : (n.fromUser?.full_name?.[0] || '?')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-slate-800 leading-snug">{n.message}</div>
                            <div className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</div>
                          </div>
                          {!n.is_read && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0 cursor-pointer ring-2 ring-white hover:ring-blue-200 transition-all"
              >
                {user.avatar_url
                  ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
                  : user.full_name?.[0]}
              </button>

              {showUserMenu && (
                <div className="absolute top-[calc(100%+8px)] right-0 w-[200px] p-1.5 bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-slate-100 z-[120] animate-scale-in">
                  {/* User info header */}
                  <div className="px-3 py-2.5 mb-1">
                    <p className="font-bold text-sm text-slate-900 truncate">{user.full_name}</p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                  </div>
                  <div className="h-px bg-slate-100 mx-2 mb-1" />

                  <button
                    type="button"
                    className="w-full border-none bg-transparent px-3 py-2.5 flex items-center gap-2.5 rounded-xl text-slate-700 text-sm font-medium cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                  >
                    <FiUser size={15} /> Hồ sơ của tôi
                  </button>

                  {user?.role === 'admin' && (
                    <button
                      type="button"
                      className="w-full border-none bg-transparent px-3 py-2.5 flex items-center gap-2.5 rounded-xl text-slate-700 text-sm font-medium cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      onClick={() => { setShowUserMenu(false); navigate('/admin'); }}
                    >
                      <FiShield size={15} /> Trang quản trị
                    </button>
                  )}

                  <div className="h-px bg-slate-100 mx-2 my-1" />

                  <button
                    type="button"
                    className="w-full border-none bg-transparent px-3 py-2.5 flex items-center gap-2.5 rounded-xl text-red-500 text-sm font-medium cursor-pointer hover:bg-red-50 transition-colors"
                    onClick={handleLogout}
                  >
                    <FiLogOut size={15} /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="inline-flex items-center px-3.5 py-2 rounded-xl font-semibold text-sm text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-all duration-200"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center px-3.5 py-2 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all duration-200 hover:-translate-y-px"
            >
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
