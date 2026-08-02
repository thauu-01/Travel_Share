import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { FiHeadphones, FiSend, FiX } from 'react-icons/fi';
import store from './store';
import { chatAPI } from './services/api';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import PostDetailPage from './pages/PostDetailPage';
import CreatePostPage from './pages/CreatePostPage';
import EditPostPage from './pages/EditPostPage';
import ExplorePage from './pages/ExplorePage';
import TripPlannerPage from './pages/TripPlannerPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

// Admin imports
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

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
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
    }

    document.title = title;
  }, [pathname]);

  return null;
}

function AppContent() {
  const location = useLocation();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const hideNavbar = location.pathname.startsWith('/admin');
  const showSupportButton = user?.role !== 'admin';
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'admin', text: 'Xin chào! Mình là trợ lý AI TravelShare ✈️. Mình có thể hỗ trợ gì cho bạn?' }
  ]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isChatOpen || !showSupportButton || !isAuthenticated) return;

    const fetchHistory = async () => {
      try {
        const res = await chatAPI.getHistory();
        const history = res?.data?.data || [];
        if (history.length > 0) {
          const mapped = history.map(item => ({
            id: item._id || `${item.sender_type}-${item.created_at}`,
            sender: item.sender_type === 'user' ? 'user' : 'admin',
            text: item.message
          }));
          setMessages(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch chat history', error);
      }
    };

    fetchHistory();
  }, [isChatOpen, showSupportButton, isAuthenticated]);

  const handleSupportClick = () => {
    setIsChatOpen(prev => !prev);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isLoading) return;

    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text }]);
    setDraft('');
    setIsLoading(true);

    try {
      const res = await chatAPI.sendMessage({ message: text });
      const aiMessage = res?.data?.data?.aiMessage;
      if (aiMessage) {
        setMessages(prev => [...prev, {
          id: aiMessage._id || `${aiMessage.sender_type}-${aiMessage.created_at}`,
          sender: 'admin',
          text: aiMessage.message
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'admin',
        text: 'Xin lỗi, hệ thống hỗ trợ đang gặp sự cố. Vui lòng thử lại sau.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ScrollToTop />
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
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:id" element={<ProfilePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

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
        </Route>
      </Routes>

      {/* Support Chat Button & Floating Window */}
      {showSupportButton && (
        <>
          {isChatOpen && (
            <div className="fixed right-5 bottom-[90px] w-[340px] max-w-[calc(100vw-24px)] h-[430px] bg-white rounded-[18px] shadow-2xl border border-slate-200 overflow-hidden z-[1000] flex flex-col">
              {/* Chat Header */}
              <div className="px-4 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white flex items-center justify-between">
                <div>
                  <div className="font-bold">Hỗ trợ TravelShare</div>
                  <div className="text-xs opacity-90">Admin sẽ phản hồi trong vài phút</div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  aria-label="Đóng chat"
                  className="bg-white/20 border-none text-white rounded-full w-8 h-8 cursor-pointer flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <FiX size={16} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 p-3.5 overflow-y-auto bg-slate-50">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex mb-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2.5 rounded-xl text-sm shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-slate-900 border border-slate-200'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="px-2.5 py-2.5 border-t border-slate-200 flex gap-2 bg-white">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Nhập tin nhắn..."
                  className="flex-1 border border-slate-200 rounded-full px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  aria-label="Gửi tin nhắn"
                  className={`${isLoading ? 'bg-slate-400' : 'bg-gradient-to-br from-blue-600 to-violet-600'} text-white border-none rounded-full w-10 h-10 cursor-pointer flex items-center justify-center transition-all hover:shadow-lg`}
                >
                  <FiSend size={16} />
                </button>
              </form>
            </div>
          )}

          <button
            onClick={handleSupportClick}
            aria-label={isChatOpen ? 'Đóng chat hỗ trợ' : 'Mở chat hỗ trợ'}
            title={isChatOpen ? 'Đóng chat hỗ trợ' : 'Yêu cầu hỗ trợ từ admin'}
            className="fixed right-5 bottom-5 w-[54px] h-[54px] rounded-full border-none bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.35)] cursor-pointer z-[1000] flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isChatOpen ? <FiX size={22} /> : <FiHeadphones size={22} />}
          </button>
        </>
      )}

      {!hideNavbar && <Footer />}

      <Toaster position="top-right" toastOptions={{
        style: { background: '#ffffff', color: '#0f172a', border: '1px solid #e0e7ff', boxShadow: '0 4px 24px rgba(59, 130, 246, 0.15)' }
      }} />
    </>
  );
}

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </Provider>
  );
}

export default App;
