import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { postAPI, placeAPI, categoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiImage, FiSend, FiMapPin, FiPlus } from 'react-icons/fi';

export default function CreatePostPage() {
  const { isAuthenticated } = useSelector(s => s.auth);
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', content: '', place_id: '', rating: 5 });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewPlace, setShowNewPlace] = useState(false);
  const [newPlace, setNewPlace] = useState({ name: '', province: '', latitude: '', longitude: '', category_id: '' });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    placeAPI.getAll({ limit: 100 }).then(r => setPlaces(r.data.data.places || []));
    categoryAPI.getAll().then(r => setCategories(r.data.data || []));
  }, []);

  const handleImages = (e) => {
    const files = Array.from(e.target.files).slice(0, 5);
    setImages(files);
    setPreviews(files.map(f => URL.createObjectURL(f)));
  };

  const handleCreatePlace = async () => {
    try {
      const res = await placeAPI.create(newPlace);
      const p = res.data.data;
      setPlaces(prev => [p, ...prev]);
      setForm({ ...form, place_id: p.id });
      setShowNewPlace(false);
      toast.success('Tạo địa điểm thành công!');
    } catch (err) { toast.error('Lỗi tạo địa điểm'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return toast.error('Vui lòng nhập tiêu đề và nội dung');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('content', form.content);
      if (form.place_id) fd.append('place_id', form.place_id);
      fd.append('rating', form.rating);
      images.forEach(img => fd.append('images', img));
      const res = await postAPI.create(fd);
      toast.success('Tạo bài viết thành công!');
      navigate(`/posts/${res.data.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi tạo bài viết');
    } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 720 }}>
        <div className="page-header animate-in">
          <h1 className="page-title">✍️ Viết bài chia sẻ</h1>
          <p className="page-subtitle">Chia sẻ trải nghiệm du lịch của bạn với cộng đồng</p>
        </div>
        <form onSubmit={handleSubmit} className="animate-in delay-1">
          <div className="form-group">
            <label className="form-label">Tiêu đề bài viết</label>
            <input type="text" className="form-input" placeholder="VD: Review Bãi biển Mỹ Khê - Thiên đường biển Đà Nẵng"
              value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label">Nội dung</label>
            <textarea className="form-textarea" style={{ minHeight: 200 }} placeholder="Chia sẻ chi tiết trải nghiệm của bạn..."
              value={form.content} onChange={e => setForm({...form, content: e.target.value})} required />
          </div>
          <div className="form-group">
            <label className="form-label"><FiMapPin /> Địa điểm</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select className="form-select" value={form.place_id} onChange={e => setForm({...form, place_id: e.target.value})}>
                <option value="">-- Chọn địa điểm --</option>
                {places.map(p => <option key={p.id} value={p.id}>{p.name} - {p.province}</option>)}
              </select>
              <button type="button" className="btn btn-secondary" onClick={() => setShowNewPlace(!showNewPlace)}>
                <FiPlus /> Mới
              </button>
            </div>
          </div>
          {showNewPlace && (
            <div className="card" style={{ padding: '1rem', marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Tạo địa điểm mới</h4>
              <div className="grid grid-2">
                <div className="form-group">
                  <input className="form-input" placeholder="Tên địa điểm" value={newPlace.name}
                    onChange={e => setNewPlace({...newPlace, name: e.target.value})} />
                </div>
                <div className="form-group">
                  <input className="form-input" placeholder="Tỉnh/Thành phố" value={newPlace.province}
                    onChange={e => setNewPlace({...newPlace, province: e.target.value})} />
                </div>
                <div className="form-group">
                  <input className="form-input" placeholder="Latitude (VD: 16.0544)" value={newPlace.latitude}
                    onChange={e => setNewPlace({...newPlace, latitude: e.target.value})} />
                </div>
                <div className="form-group">
                  <input className="form-input" placeholder="Longitude (VD: 108.2472)" value={newPlace.longitude}
                    onChange={e => setNewPlace({...newPlace, longitude: e.target.value})} />
                </div>
              </div>
              <select className="form-select" style={{ marginBottom: '0.75rem' }} value={newPlace.category_id}
                onChange={e => setNewPlace({...newPlace, category_id: e.target.value})}>
                <option value="">-- Danh mục --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleCreatePlace}>Tạo địa điểm</button>
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Đánh giá</label>
            <div className="stars">
              {[1,2,3,4,5].map(s => (
                <span key={s} className={`star ${s <= form.rating ? 'filled' : ''}`}
                  onClick={() => setForm({...form, rating: s})} style={{ cursor: 'pointer', fontSize: '1.5rem' }}>★</span>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label"><FiImage /> Hình ảnh (tối đa 5 ảnh)</label>
            <input type="file" accept="image/*" multiple onChange={handleImages}
              style={{ display: 'block', color: 'var(--text-secondary)' }} />
            {previews.length > 0 && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                {previews.map((p, i) => (
                  <img key={i} src={p} alt="" style={{ width: 100, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                ))}
              </div>
            )}
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}>
            <FiSend /> {loading ? 'Đang đăng...' : 'Đăng bài viết'}
          </button>
        </form>
      </div>
    </div>
  );
}
