import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { userAPI } from '../services/api';
import { updateUser } from '../store/authSlice';
import PostCard from '../components/PostCard';
import toast from 'react-hot-toast';
import { FiEdit2, FiCamera } from 'react-icons/fi';

export default function ProfilePage() {
  const { id } = useParams();
  const { user: currentUser, isAuthenticated } = useSelector(s => s.auth);
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [tab, setTab] = useState('posts');
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: '', bio: '' });
  const [loading, setLoading] = useState(true);
  const isOwner = currentUser?.id === parseInt(id);

  useEffect(() => {
    fetchProfile();
    fetchPosts();
  }, [id]);

  const fetchProfile = async () => {
    try {
      const res = await userAPI.getProfile(id);
      setProfile(res.data.data);
      setForm({ full_name: res.data.data.full_name, bio: res.data.data.bio || '' });
    } catch (err) { toast.error('Không tìm thấy người dùng'); }
    setLoading(false);
  };

  const fetchPosts = async () => {
    try {
      const res = await userAPI.getUserPosts(id);
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

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div></div></div>;
  if (!profile) return <div className="page"><div className="container"><div className="empty-state"><div className="icon">😕</div>Không tìm thấy người dùng</div></div></div>;

  return (
    <div className="page">
      <div className="container">
        <div className="profile-header animate-in">
          <div style={{ position: 'relative' }}>
            <div className="avatar avatar-lg">
              {profile.avatar_url ? <img src={profile.avatar_url} alt="" /> : profile.full_name?.[0]}
            </div>
            {isOwner && (
              <label style={{ position: 'absolute', bottom: -4, right: -4, cursor: 'pointer' }}>
                <div className="btn-icon" style={{ width: 28, height: 28 }}><FiCamera size={14} /></div>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
              </label>
            )}
          </div>
          <div className="profile-info" style={{ flex: 1 }}>
            {editing ? (
              <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <input className="form-input" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
                <textarea className="form-textarea" rows={2} value={form.bio} placeholder="Giới thiệu bản thân..."
                  onChange={e => setForm({...form, bio: e.target.value})} />
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary btn-sm">Lưu</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(false)}>Hủy</button>
                </div>
              </form>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h2>{profile.full_name}</h2>
                  {isOwner && <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}><FiEdit2 /> Sửa</button>}
                </div>
                {profile.bio && <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{profile.bio}</p>}
                <div className="profile-stats">
                  <div className="profile-stat"><div className="value">{profile.postCount || 0}</div><div className="label">Bài viết</div></div>
                  <div className="profile-stat"><div className="value">{profile.likeCount || 0}</div><div className="label">Lượt thích</div></div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === 'posts' ? 'active' : ''}`} onClick={() => setTab('posts')}>Bài viết</button>
          {isOwner && <button className={`tab ${tab === 'liked' ? 'active' : ''}`} onClick={() => { setTab('liked'); fetchLiked(); }}>Đã thích</button>}
        </div>

        <div className="grid grid-3 animate-in">
          {(tab === 'posts' ? posts : likedPosts).map(post => <PostCard key={post.id} post={post} />)}
        </div>
        {(tab === 'posts' ? posts : likedPosts).length === 0 && (
          <div className="empty-state"><div className="icon">📝</div>{tab === 'posts' ? 'Chưa có bài viết nào' : 'Chưa thích bài viết nào'}</div>
        )}
      </div>
    </div>
  );
}
