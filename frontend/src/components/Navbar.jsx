import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { notificationAPI } from '../services/api';
import { io } from 'socket.io-client';
import { FiBell, FiPlus, FiSearch, FiLogOut, FiMap, FiCompass, FiCalendar } from 'react-icons/fi';

export default function Navbar() {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef(null);
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
    dispatch(logout());
    navigate('/');
  };

  const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'Vừa xong';
    if (s < 3600) return `${Math.floor(s/60)} phút trước`;
    if (s < 86400) return `${Math.floor(s/3600)} giờ trước`;
    return `${Math.floor(s/86400)} ngày trước`;
  };

  if (location.pathname === '/login' || location.pathname === '/register') return null;

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand"><span>✈️</span> TravelShare</Link>
      <div className="nav-links">
        <Link to="/" className={isActive('/')}>Trang chủ</Link>
        <Link to="/explore" className={isActive('/explore')}><FiCompass style={{marginRight:4}} /> Khám phá</Link>
        <Link to="/search" className={isActive('/search')}><FiSearch style={{marginRight:4}} /> Tìm kiếm</Link>
        {isAuthenticated && <Link to="/trips" className={isActive('/trips')}><FiCalendar style={{marginRight:4}} /> Lịch trình</Link>}
      </div>
      <div className="nav-actions">
        {isAuthenticated ? (
          <>
            <Link to="/create-post" className="btn btn-primary btn-sm"><FiPlus /> Viết bài</Link>
            <div className="notif-wrapper" ref={notifRef}>
              <button className="btn-icon" onClick={() => setShowNotif(!showNotif)}><FiBell />
                {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {showNotif && (
                <div className="notif-dropdown">
                  <div className="notif-header">
                    <span>Thông báo</span>
                    {unreadCount > 0 && <button className="btn btn-sm btn-secondary" onClick={handleMarkAllRead}>Đọc tất cả</button>}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="empty-state" style={{padding:'2rem'}}>Chưa có thông báo</div>
                  ) : notifications.slice(0, 20).map(n => (
                    <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                      onClick={() => { if (n.post_id) navigate(`/posts/${n.post_id}`); setShowNotif(false); }}>
                      <div className="avatar" style={{width:32,height:32,fontSize:'0.7rem'}}>
                        {n.fromUser?.avatar_url ? <img src={n.fromUser.avatar_url} alt="" /> : (n.fromUser?.full_name?.[0] || '?')}
                      </div>
                      <div style={{flex:1}}>
                        <div className="notif-text">{n.message}</div>
                        <div className="notif-time">{timeAgo(n.created_at)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Link to={`/profile/${user.id}`} className="avatar" title={user.full_name}>
              {user.avatar_url ? <img src={user.avatar_url} alt="" /> : user.full_name?.[0]}
            </Link>
            <button className="btn-icon" onClick={handleLogout} title="Đăng xuất"><FiLogOut /></button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary btn-sm">Đăng nhập</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Đăng ký</Link>
          </>
        )}
      </div>
    </nav>
  );
}
