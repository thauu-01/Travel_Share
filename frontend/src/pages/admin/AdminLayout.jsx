import { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiUsers, FiFileText, FiMapPin, FiTag,
  FiMessageSquare, FiAlertTriangle, FiBell, FiHeadphones,
  FiBarChart2, FiChevronRight, FiMenu
} from 'react-icons/fi';

const MENU = [
  { path: '/admin', label: 'Dashboard', icon: FiBarChart2 },
  { path: '/admin/users', label: 'Người dùng', icon: FiUsers },
  { path: '/admin/posts', label: 'Bài viết', icon: FiFileText },
  { path: '/admin/places', label: 'Địa điểm', icon: FiMapPin },
  { path: '/admin/categories', label: 'Danh mục', icon: FiTag },
  { path: '/admin/comments', label: 'Bình luận', icon: FiMessageSquare },
  { path: '/admin/reports', label: 'Báo cáo', icon: FiAlertTriangle },
  { path: '/admin/notifications', label: 'Thông báo hệ thống', icon: FiBell },
  { path: '/admin/support', label: 'Hỗ trợ chat & AI', icon: FiHeadphones },
];

export default function AdminLayout() {
  const { user, isAuthenticated } = useSelector(s => s.auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Check role
  if (!isAuthenticated || user?.role !== 'admin') {
    // Redirect if not admin
    setTimeout(() => navigate('/'), 0);
    return null;
  }

  const isActive = (path) => path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', paddingTop: '65px' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 70 : 260,
        background: '#0f172a',
        color: 'white',
        position: 'fixed',
        top: 65,
        left: 0,
        bottom: 0,
        overflowY: 'auto',
        transition: 'width 0.2s ease',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 24px rgba(0,0,0,0.05)'
      }}>
        <div style={{
          padding: collapsed ? '16px 12px' : '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          {!collapsed && <span style={{ fontWeight: 700, fontSize: '1rem', color: '#818cf8' }}>🛡️ Quản trị hệ thống</span>}
          <button onClick={() => setCollapsed(!collapsed)} style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {collapsed ? <FiChevronRight size={18} /> : <FiMenu size={18} />}
          </button>
        </div>
        <nav style={{ flex: 1, padding: '12px 0' }}>
          {MENU.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} to={item.path} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 20px',
                color: active ? '#818cf8' : 'rgba(255,255,255,0.7)',
                textDecoration: 'none',
                background: active ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                borderLeft: active ? '4px solid #6366f1' : '4px solid transparent',
                transition: 'all 0.15s ease',
                fontSize: '0.9rem',
                fontWeight: active ? 600 : 400,
                whiteSpace: 'nowrap',
                overflow: 'hidden'
              }}>
                <Icon size={18} style={{ flexShrink: 0 }} />
                {!collapsed && item.label}
              </Link>
            );
          })}
        </nav>
        {!collapsed && (
          <div style={{
            padding: '16px 20px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            fontSize: '0.8rem',
            color: 'rgba(255,255,255,0.4)',
            backgroundColor: '#090d16'
          }}>
            Admin: <strong style={{ color: '#818cf8' }}>{user?.full_name}</strong>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main style={{
        flex: 1,
        marginLeft: collapsed ? 70 : 260,
        padding: '28px',
        transition: 'margin-left 0.2s ease',
        minWidth: 0
      }}>
        <Outlet />
      </main>
    </div>
  );
}
