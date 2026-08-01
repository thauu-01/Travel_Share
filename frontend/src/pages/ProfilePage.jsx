import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { userAPI } from '../services/api';
import { updateUser } from '../store/authSlice';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';
import { FiEdit2, FiCamera, FiImage, FiHeart } from 'react-icons/fi';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser, isAuthenticated } = useSelector(s => s.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const targetId = id || currentUser?.id;
  const isOwner = String(currentUser?.id) === String(targetId);

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [tab, setTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', bio: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!targetId) {
      navigate('/login');
      return;
    }
    fetchProfile();
    fetchPosts();
  }, [targetId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await userAPI.getProfile(targetId);
      setProfile(res.data.data);
      if (res.data.data?.full_name) document.title = `Hồ sơ ${res.data.data.full_name} | TravelShare`;
      setForm({ full_name: res.data.data.full_name, bio: res.data.data.bio || '' });
    } catch (err) { toast.error('Không tìm thấy người dùng'); }
    setLoading(false);
  };

  const fetchPosts = async () => {
    try {
      const res = await userAPI.getUserPosts(targetId);
      setPosts(res.data.data || []);
    } catch (err) { /* */ }
  };

  const fetchLiked = async () => {
    if (likedPosts.length > 0) return;
    try {
      const res = await userAPI.getLikedPosts();
      setLikedPosts(res.data.data || []);
    } catch (err) { /* */ }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append('full_name', form.full_name);
      fd.append('bio', form.bio);
      const res = await userAPI.updateProfile(fd);
      setProfile(prev => ({ ...prev, ...res.data.data }));
      dispatch(updateUser(res.data.data));
      setEditing(false);
      toast.success('Cập nhật thành công!');
    } catch (err) { toast.error('Lỗi cập nhật'); }
  };

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    fd.append('full_name', profile.full_name);
    try {
      const res = await userAPI.updateProfile(fd);
      setProfile(prev => ({ ...prev, avatar_url: res.data.data.avatar_url }));
      dispatch(updateUser({ avatar_url: res.data.data.avatar_url }));
      toast.success('Cập nhật avatar thành công!');
    } catch (err) { toast.error('Lỗi upload avatar'); }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    try {
      await userAPI.deletePost(postId); // Assuming delete post API
      setPosts(posts.filter(p => p.id !== postId));
      toast.success('Xóa bài viết thành công');
    } catch (err) {
      toast.error('Lỗi khi xóa bài viết');
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    toast.success('Đổi mật khẩu thành công (Mock)');
  };

  if (loading) return (
    <div className="pt-24 min-h-screen bg-[#f0f7ff] flex justify-center">
      <div className="w-10 h-10 border-4 border-indigo-100 border-t-blue-600 rounded-full animate-spin mt-20"></div>
    </div>
  );
  
  if (!profile) return (
    <div className="pt-24 min-h-screen bg-[#f0f7ff]">
      <div className="max-w-7xl mx-auto px-6 pb-12 flex flex-col items-center justify-center p-12 text-slate-400 bg-white rounded-2xl border-2 border-indigo-100 border-dashed mt-12">
        <div className="text-4xl mb-3">😕</div>
        <p>Không tìm thấy người dùng</p>
      </div>
    </div>
  );

  return (
    <div className="pt-24 min-h-screen bg-[#f0f7ff]">
      <div className="max-w-7xl mx-auto px-6 pb-12 flex flex-col md:flex-row gap-8">
        
        {/* Left Sidebar: Profile Summary & Nav Tabs */}
        <div className="w-full md:w-80 shrink-0">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-indigo-100 flex flex-col items-center text-center animate-in mb-6">
            <div className="relative mb-4">
              <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-4xl font-bold object-cover overflow-hidden">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : profile.full_name?.[0]}
              </div>
              {isOwner && (
                <label className="absolute bottom-0 right-0 cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors border-2 border-white">
                    <FiCamera size={14} />
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
                </label>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">{profile.full_name}</h2>
            {profile.bio && <p className="text-sm text-slate-500 mb-4">{profile.bio}</p>}
            
            <div className="flex w-full justify-center gap-6 mt-2 pt-4 border-t border-indigo-50">
              <div className="flex flex-col items-center">
                <div className="text-lg font-bold text-slate-900">{profile.postCount || 0}</div>
                <div className="text-xs text-slate-500 font-medium">Bài viết</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-lg font-bold text-slate-900">{profile.likeCount || 0}</div>
                <div className="text-xs text-slate-500 font-medium">Lượt thích</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-indigo-100 overflow-hidden animate-in delay-1">
            <div className="flex flex-col">
              <button 
                className={`px-6 py-4 text-left text-sm font-semibold transition-all ${tab === 'posts' ? 'bg-indigo-50 text-blue-600 border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'}`}
                onClick={() => setTab('posts')}
              >
                Bài viết của {isOwner ? 'bạn' : profile.full_name}
              </button>
              <button 
                className={`px-6 py-4 text-left text-sm font-semibold transition-all ${tab === 'liked' ? 'bg-indigo-50 text-blue-600 border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'}`}
                onClick={() => { setTab('liked'); fetchLiked(); }}
              >
                Bài viết đã thích
              </button>
              
              {isOwner && (
                <>
                  <div className="px-6 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-50/50">
                    Cài đặt tài khoản
                  </div>
                  <button 
                    className={`px-6 py-4 text-left text-sm font-semibold transition-all ${tab === 'profile' ? 'bg-indigo-50 text-blue-600 border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'}`}
                    onClick={() => setTab('profile')}
                  >
                    Chỉnh sửa thông tin
                  </button>
                  <button 
                    className={`px-6 py-4 text-left text-sm font-semibold transition-all ${tab === 'password' ? 'bg-indigo-50 text-blue-600 border-l-4 border-blue-600' : 'text-slate-600 hover:bg-slate-50 border-l-4 border-transparent'}`}
                    onClick={() => setTab('password')}
                  >
                    Đổi mật khẩu
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 min-w-0">
          {(tab === 'posts' || tab === 'liked') && (
            <div className="animate-in">
              <h3 className="text-xl font-bold text-slate-800 mb-6">
                {tab === 'posts' ? (isOwner ? 'Quản lý bài viết của bạn' : `Bài viết của ${profile.full_name}`) : 'Các bài viết bạn đã thích'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(tab === 'posts' ? posts : likedPosts).map(post => (
                  <div key={post.id} className="relative group">
                    <PostCard post={post} />
                    
                    {/* Edit/Delete Overlay for Post Owner */}
                    {isOwner && tab === 'posts' && (
                      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <Link 
                          to={`/posts/${post.id}/edit`} 
                          className="w-8 h-8 rounded-full bg-white/90 backdrop-blur text-blue-600 flex items-center justify-center shadow-md hover:bg-blue-600 hover:text-white transition-colors"
                          title="Sửa bài viết"
                        >
                          <FiEdit2 size={14} />
                        </Link>
                        <button 
                          onClick={(e) => { e.preventDefault(); handleDeletePost(post.id); }}
                          className="w-8 h-8 rounded-full bg-white/90 backdrop-blur text-red-600 flex items-center justify-center shadow-md hover:bg-red-600 hover:text-white transition-colors"
                          title="Xóa bài viết"
                        >
                          <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="14" width="14" xmlns="http://www.w3.org/2000/svg"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {(tab === 'posts' ? posts : likedPosts).length === 0 && (
                <div className="flex flex-col items-center justify-center p-16 text-slate-400 bg-white rounded-3xl border-2 border-indigo-50 border-dashed">
                  <div className="text-4xl mb-4 bg-gray-50 p-4 rounded-full text-blue-200">
                    {tab === 'posts' ? <FiImage size={32} /> : <FiHeart size={32} />}
                  </div>
                  <p className="font-medium text-slate-500">{tab === 'posts' ? 'Chưa có bài viết nào' : 'Chưa thích bài viết nào'}</p>
                </div>
              )}
            </div>
          )}

          {tab === 'profile' && isOwner && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-indigo-100 animate-in">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Chỉnh sửa thông tin cá nhân</h3>
              <form onSubmit={handleUpdate} className="max-w-xl">
                <div className="mb-5">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Họ và tên</label>
                  <input 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    value={form.full_name} 
                    onChange={e => setForm({...form, full_name: e.target.value})} 
                    placeholder="Nhập họ và tên..."
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Giới thiệu bản thân (Bio)</label>
                  <textarea 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" 
                    rows={4} 
                    value={form.bio} 
                    placeholder="Vài nét về bạn..."
                    onChange={e => setForm({...form, bio: e.target.value})} 
                  />
                </div>
                <button type="submit" className="px-5 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors border-none cursor-pointer shadow-sm shadow-blue-600/20">
                  Lưu thay đổi
                </button>
              </form>
            </div>
          )}

          {tab === 'password' && isOwner && (
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-indigo-100 animate-in">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Đổi mật khẩu</h3>
              <form onSubmit={handlePasswordSubmit} className="max-w-xl">
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu hiện tại</label>
                  <input 
                    type="password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    placeholder="Nhập mật khẩu hiện tại..."
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu mới</label>
                  <input 
                    type="password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    placeholder="Nhập mật khẩu mới..."
                    required
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Xác nhận mật khẩu mới</label>
                  <input 
                    type="password"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    placeholder="Nhập lại mật khẩu mới..."
                    required
                  />
                </div>
                <button type="submit" className="px-6 py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors border-none cursor-pointer shadow-sm shadow-blue-600/20">
                  Cập nhật mật khẩu
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
