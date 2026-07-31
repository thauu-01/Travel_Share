import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { notificationAPI } from '../services/api';
import { io } from 'socket.io-client';
import { FiBell, FiPlus, FiSearch, FiLogOut, FiCompass, FiCalendar } from 'react-icons/fi';

export default function Navbar() {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      fetchNotifications();
      socketRef.current = io('http://localhost:5000');
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
    try {
      const res = await notificationAPI.getAll();
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch (err) { /* ignore */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) { /* ignore */ }
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    setShowNotif(false);
    dispatch(logout());
    navigate('/');
  };

  const handleGoToProfile = () => {
    setShowUserMenu(false);
    navigate('/profile');
  };

  const handleGoToAdmin = () => {
    setShowUserMenu(false);
    navigate('/admin');
  };

  const isActive = (path) =>
    location.pathname === path
      ? 'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-blue-600 bg-blue-50/80 font-medium text-[0.9rem] transition-all'
      : 'inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-slate-500 font-medium text-[0.9rem] transition-all hover:text-blue-600 hover:bg-blue-50/80';

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'Vừa xong';
    if (s < 3600) return `${Math.floor(s/60)} phút trước`;
    if (s < 86400) return `${Math.floor(s/3600)} giờ trước`;
    return `${Math.floor(s/86400)} ngày trước`;
  };

  if (location.pathname === '/login' || location.pathname === '/register') return null;

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-xl border-b border-indigo-100 px-8 h-16 flex items-center justify-between">
      {/* Brand */}
      <Link to="/" className="flex items-center gap-2 text-[1.35rem] font-extrabold gradient-text cursor-pointer">
        <span>✈️</span> TravelShare
      </Link>

      {/* Nav Links */}
      <div className="flex items-center gap-1">
        <Link to="/" className={isActive('/')}>Trang chủ</Link>
        <Link to="/explore" className={isActive('/explore')}>
          <FiCompass /> Khám phá
        </Link>
        <Link to="/search" className={isActive('/search')}>
          <FiSearch /> Tìm kiếm
        </Link>
        {isAuthenticated && (
          <Link to="/trips" className={isActive('/trips')}>
            <FiCalendar /> Lịch trình
          </Link>
        )}
      </div>

      {/* Nav Actions */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            {/* Create Post Button */}
            <Link
              to="/create-post"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold text-xs cursor-pointer transition-all border border-transparent bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:-translate-y-px hover:shadow-lg"
            >
              <FiPlus /> Viết bài
            </Link>

            {/* Notification Bell */}
            <div className="relative" ref={notifRef}>
              <button
                className="w-10 h-10 p-0 flex items-center justify-center rounded-full bg-gray-100 border border-indigo-100 text-slate-500 cursor-pointer hover:bg-blue-100 hover:text-blue-600 transition-all"
                onClick={() => setShowNotif(!showNotif)}
              >
                <FiBell />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[0.65rem] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {showNotif && (
                <div className="absolute top-[50px] right-0 w-[360px] max-h-[400px] bg-white border border-indigo-100 rounded-2xl shadow-xl overflow-y-auto z-[100]">
                  {/* Notification Header */}
                  <div className="p-4 border-b border-indigo-100 flex justify-between items-center font-bold">
                    <span>Thông báo</span>
                    {unreadCount > 0 && (
                      <button
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold text-xs cursor-pointer transition-all border border-indigo-100 bg-gray-100 text-slate-900 hover:bg-blue-50"
                        onClick={handleMarkAllRead}
                      >
                        Đọc tất cả
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-sm" style={{ padding: '2rem' }}>
                      Chưa có thông báo
                    </div>
                  ) : (
                    notifications.slice(0, 20).map(n => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 border-b border-indigo-100 transition-all cursor-pointer hover:bg-blue-50/60 ${!n.is_read ? 'bg-blue-50/80' : ''}`}
                        onClick={() => { if (n.post_id) navigate(`/posts/${n.post_id}`); setShowNotif(false); }}
                      >
                        {/* Notif Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-[0.7rem] overflow-hidden shrink-0">
                          {n.fromUser?.avatar_url
                            ? <img src={n.fromUser.avatar_url} alt="" />
                            : (n.fromUser?.full_name?.[0] || '?')}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-slate-900">{n.message}</div>
                          <div className="text-xs text-slate-400 mt-0.5">{timeAgo(n.created_at)}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                title={user.full_name}
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm overflow-hidden shrink-0 cursor-pointer border-2 border-white hover:ring-2 hover:ring-blue-300 transition-all"
              >
                {user.avatar_url ? <img src={user.avatar_url} alt="" /> : user.full_name?.[0]}
              </button>

              {showUserMenu && (
                <div className="absolute top-[calc(100%+0.5rem)] right-0 min-w-[180px] p-1.5 bg-white border border-indigo-100 rounded-2xl shadow-xl z-[120]">
                  <button
                    type="button"
                    className="w-full border-none bg-transparent px-3.5 py-2.5 flex justify-start items-center gap-2 rounded-lg text-slate-900 font-semibold cursor-pointer hover:bg-blue-50 hover:text-blue-600"
                    onClick={handleGoToProfile}
                  >
                    Hồ sơ
                  </button>
                  {user?.role === 'admin' && (
                    <button
                      type="button"
                      className="w-full border-none bg-transparent px-3.5 py-2.5 flex justify-start items-center gap-2 rounded-lg text-slate-900 font-semibold cursor-pointer hover:bg-blue-50 hover:text-blue-600"
                      onClick={handleGoToAdmin}
                    >
                      Trang quản trị
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Logout Button */}
            <button
              className="w-10 h-10 p-0 flex items-center justify-center rounded-full bg-gray-100 border border-indigo-100 text-slate-500 cursor-pointer hover:bg-blue-100 hover:text-blue-600 transition-all"
              onClick={handleLogout}
              title="Đăng xuất"
            >
              <FiLogOut />
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold text-xs cursor-pointer transition-all border border-indigo-100 bg-gray-100 text-slate-900 hover:bg-blue-50"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold text-xs cursor-pointer transition-all border border-transparent bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:-translate-y-px hover:shadow-lg"
            >
              Đăng ký
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
