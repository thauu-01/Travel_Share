import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import { SupportChatWidget } from './components/chat/SupportChatWidget';

// User Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PostDetailPage from './pages/PostDetailPage';
import CreatePostPage from './pages/CreatePostPage';
import EditPostPage from './pages/EditPostPage';
import ExplorePage from './pages/ExplorePage';
import TripPlannerPage from './pages/TripPlannerPage';
import AITripPlannerPage from './pages/AITripPlannerPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import PaymentReturnPage from './pages/PaymentReturnPage';

// Admin Pages & Layout
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/tabs/AdminDashboard';
import AdminUsers from './pages/admin/tabs/AdminUsers';
import AdminPosts from './pages/admin/tabs/AdminPosts';
import AdminPlaces from './pages/admin/tabs/AdminPlaces';
import AdminCategories from './pages/admin/tabs/AdminCategories';
import AdminComments from './pages/admin/tabs/AdminComments';
import AdminReports from './pages/admin/tabs/AdminReports';
import AdminNotifications from './pages/admin/tabs/AdminNotifications';
import AdminSupport from './pages/admin/tabs/AdminSupport';
import AdminTransactions from './pages/admin/tabs/AdminTransactions';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// Lắng nghe sự kiện auth:logout từ axios interceptor → redirect về /login
function AuthGuard() {
  useEffect(() => {
    const handleForceLogout = () => {
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    };
    window.addEventListener('auth:logout', handleForceLogout);
    return () => window.removeEventListener('auth:logout', handleForceLogout);
  }, []);
  return null;
}

function PageTitleUpdater() {
  const { pathname } = useLocation();

  useEffect(() => {
    let title = 'TravelShare - Chia sẻ & Khám phá Du lịch Việt Nam';

    if (pathname === '/') {
      title = 'Trang chủ | TravelShare';
    } else if (pathname === '/explore') {
      title = 'Khám phá Bản đồ | TravelShare';
    } else if (pathname === '/search') {
      title = 'Tìm kiếm & Lọc bài viết | TravelShare';
    } else if (pathname === '/trips') {
      title = 'Lịch trình chuyến đi | TravelShare';
    } else if (pathname === '/trips/ai') {
      title = '✨ AI Tạo Lịch Trình VIP | TravelShare';
    } else if (pathname === '/create-post') {
      title = 'Đăng bài viết mới | TravelShare';
    } else if (pathname.startsWith('/posts/') && pathname.endsWith('/edit')) {
      title = 'Chỉnh sửa bài viết | TravelShare';
    } else if (pathname.startsWith('/posts/')) {
      title = 'Chi tiết bài viết | TravelShare';
    } else if (pathname === '/login') {
      title = 'Đăng nhập | TravelShare';
    } else if (pathname === '/register') {
      title = 'Đăng ký tài khoản | TravelShare';
    } else if (pathname === '/forgot-password') {
      title = 'Quên mật khẩu | TravelShare';
    } else if (pathname.startsWith('/profile')) {
      title = 'Hồ sơ cá nhân | TravelShare';
    } else if (pathname === '/admin') {
      title = 'Tổng quan Hệ thống | Admin TravelShare';
    } else if (pathname === '/admin/users') {
      title = 'Quản lý Người dùng | Admin TravelShare';
    } else if (pathname === '/admin/posts') {
      title = 'Quản lý Bài viết | Admin TravelShare';
    } else if (pathname === '/admin/places') {
      title = 'Quản lý Địa điểm | Admin TravelShare';
    } else if (pathname === '/admin/categories') {
      title = 'Quản lý Danh mục | Admin TravelShare';
    } else if (pathname === '/admin/comments') {
      title = 'Quản lý Bình luận | Admin TravelShare';
    } else if (pathname === '/admin/reports') {
      title = 'Xử lý Báo cáo | Admin TravelShare';
    } else if (pathname === '/admin/notifications') {
      title = 'Phát sóng Thông báo | Admin TravelShare';
    } else if (pathname === '/admin/support') {
      title = 'Hỗ trợ CSKH | Admin TravelShare';
    } else if (pathname === '/admin/transactions') {
      title = 'Lịch sử Giao dịch | Admin TravelShare';
    } else if (pathname === '/payment/return') {
      title = 'Kết quả Thanh toán | TravelShare';
    }

    document.title = title;
  }, [pathname]);

  return null;
}

function AppContent() {
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith('/admin');

  return (
    <>
      <ScrollToTop />
      <AuthGuard />
      <PageTitleUpdater />
      {!hideNavbar && <Navbar />}

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/posts/:id" element={<PostDetailPage />} />
        <Route path="/posts/:id/edit" element={<EditPostPage />} />
        <Route path="/create-post" element={<CreatePostPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/trips" element={<TripPlannerPage />} />
        <Route path="/trips/ai" element={<AITripPlannerPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/payment/return" element={<PaymentReturnPage />} />

        {/* Admin routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="posts" element={<AdminPosts />} />
          <Route path="places" element={<AdminPlaces />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="comments" element={<AdminComments />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="notifications" element={<AdminNotifications />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="transactions" element={<AdminTransactions />} />
        </Route>
      </Routes>

      {/* Floating Support Chat Widget */}
      <SupportChatWidget />

      {!hideNavbar && <Footer />}

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid #e0e7ff',
            boxShadow: '0 4px 24px rgba(59, 130, 246, 0.15)'
          }
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
