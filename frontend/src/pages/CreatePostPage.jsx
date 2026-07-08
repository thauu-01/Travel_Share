import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { postAPI, placeAPI, categoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiImage, FiSend, FiMapPin, FiPlus, FiX } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Map controller component to handle flyTo / setView updates
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

export default function CreatePostPage() {
  const { isAuthenticated } = useSelector(s => s.auth);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({ title: '', content: '', place_id: '', rating: 5 });
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Location selection / Creation states
  const [showNewPlace, setShowNewPlace] = useState(false);
  const [newPlace, setNewPlace] = useState({ name: '', province: '', address: '', latitude: '16.0544', longitude: '108.2472', category_id: '' });
  const [categories, setCategories] = useState([]);
  
  // Geocoding / Search Map states
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapCenter, setMapCenter] = useState([16.0544, 108.2472]);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    placeAPI.getAll({ limit: 100 }).then(r => setPlaces(r.data.data.places || []));
    categoryAPI.getAll().then(r => setCategories(r.data.data || []));
  }, []);

  // Search autocomplete effect from Nominatim
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=vn&addressdetails=1&limit=5`)
        .then(res => res.json())
        .then(data => {
          setSuggestions(data || []);
        })
        .catch(err => console.error('Geocoding search error:', err));
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const extractProvince = (address) => {
    if (!address) return '';
    return address.city || address.state || address.province || address.town || address.county || '';
  };

  const handleSelectSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const province = extractProvince(item.address);
    const displayName = item.display_name;
    const name = item.name || displayName.split(',')[0];

    setNewPlace(prev => ({
      ...prev,
      name: name,
      province: province,
      address: displayName,
      latitude: lat.toFixed(6),
      longitude: lon.toFixed(6)
    }));

    setMapCenter([lat, lon]);
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchQuery('');
  };

  const reverseGeocode = async (lat, lon) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`);
      const data = await res.json();
      if (data) {
        const province = extractProvince(data.address);
        setNewPlace(prev => ({
          ...prev,
          province: province || prev.province,
          address: data.display_name || prev.address
        }));
      }
    } catch (err) {
      console.error('Reverse geocoding error:', err);
    }
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files);
    
    if (images.length + files.length > 5) {
      toast.error('Tối đa chỉ được upload 5 ảnh');
      return;
    }

    setImages(prev => {
      const next = [...prev, ...files];
      setPreviews(next.map(f => URL.createObjectURL(f)));
      return next;
    });

    if (e.target) e.target.value = '';
  };

  const removeImage = (index) => {
    setImages(prev => {
      const next = prev.filter((_, idx) => idx !== index);
      if (previews[index]) {
        URL.revokeObjectURL(previews[index]);
      }
      setPreviews(next.map(f => URL.createObjectURL(f)));
      return next;
    });
  };

  const handleCreatePlace = async () => {
    if (!newPlace.name || !newPlace.province || !newPlace.latitude || !newPlace.longitude) {
      return toast.error('Tên địa điểm, Tỉnh/TP và Tọa độ là bắt buộc');
    }
    try {
      const res = await placeAPI.create(newPlace);
      const p = res.data.data;
      setPlaces(prev => [p, ...prev]);
      setForm({ ...form, place_id: p.id });
      setShowNewPlace(false);
      toast.success('Tạo địa điểm thành công!');
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Lỗi tạo địa điểm'); 
    }
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
              <select className="form-select" value={form.place_id} onChange={e => {
                const val = e.target.value;
                setForm({...form, place_id: val});
                if (val) {
                  setShowNewPlace(false);
                }
              }}>
                <option value="">-- Chọn địa điểm --</option>
                {places.map(p => <option key={p.id} value={p.id}>{p.name} - {p.province}</option>)}
              </select>
              <button type="button" className="btn btn-secondary" onClick={() => setShowNewPlace(!showNewPlace)}>
                <FiPlus /> Mới
              </button>
            </div>
          </div>
          
          {showNewPlace && !form.place_id && (
            <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', border: '1px solid var(--border-color, #e0e0e0)' }}>
              <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border-color, #e0e0e0)', paddingBottom: '0.5rem' }}>
                📍 Tạo địa điểm mới
              </h4>
              
              {/* Google Maps (OSM Nominatim) Search Input */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">🔍 Tìm kiếm địa điểm</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập tên địa điểm..."
                  value={searchQuery}
                  onChange={e => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
                
                {/* Search Autocomplete Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    marginTop: '4px'
                  }}>
                    {suggestions.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectSuggestion(item)}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '0.9rem',
                          color: '#333'
                        }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        {item.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mini Map */}
              <div style={{ height: '220px', width: '100%', borderRadius: '8px', marginBottom: '1rem', overflow: 'hidden', zIndex: 1 }}>
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker
                    position={[parseFloat(newPlace.latitude) || mapCenter[0], parseFloat(newPlace.longitude) || mapCenter[1]]}
                    draggable={true}
                    eventHandlers={{
                      dragend: (e) => {
                        const marker = e.target;
                        const latLng = marker.getLatLng();
                        const lat = latLng.lat.toFixed(6);
                        const lon = latLng.lng.toFixed(6);
                        setNewPlace(prev => ({
                          ...prev,
                          latitude: lat,
                          longitude: lon
                        }));
                        reverseGeocode(lat, lon);
                      }
                    }}
                  />
                  <MapController center={mapCenter} />
                </MapContainer>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '-0.5rem', marginBottom: '1rem', fontStyle: 'italic' }}>
                * Kéo marker màu xanh trên bản đồ để tinh chỉnh tọa độ và tự động lấy địa chỉ
              </p>

              {/* Display fields */}
              <div className="form-group">
                <label className="form-label">Tên hiển thị</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập tên địa điểm hiển thị..."
                  value={newPlace.name}
                  onChange={e => setNewPlace({ ...newPlace, name: e.target.value })}
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Tỉnh/Thành phố</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Tỉnh/Thành phố..."
                    value={newPlace.province}
                    onChange={e => setNewPlace({ ...newPlace, province: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Tọa độ</label>
                  <input
                    type="text"
                    className="form-input"
                    value={`${newPlace.latitude}, ${newPlace.longitude}`}
                    readOnly
                    style={{ backgroundColor: '#f9f9f9', cursor: 'not-allowed' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Địa chỉ tự động..."
                  value={newPlace.address}
                  readOnly
                  style={{ backgroundColor: '#f9f9f9', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Danh mục</label>
                <select className="form-select" value={newPlace.category_id}
                  onChange={e => setNewPlace({...newPlace, category_id: e.target.value})}>
                  <option value="">-- Danh mục --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>

              <button type="button" className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={handleCreatePlace}>
                Tạo địa điểm
              </button>
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
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {previews.map((p, i) => (
                <div key={i} style={{ position: 'relative', width: 100, height: 80 }}>
                  <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: 20,
                      height: 20,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      fontSize: '10px',
                      fontWeight: 'bold',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}
                  >
                    <FiX />
                  </button>
                </div>
              ))}
              {images.length < 5 && (
                <div
                  onClick={() => fileInputRef.current.click()}
                  style={{
                    width: 100,
                    height: 80,
                    border: '2px dashed var(--border-color, #ccc)',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    fontSize: '1.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.borderColor = 'var(--primary-color)'}
                  onMouseOut={e => e.currentTarget.style.borderColor = 'var(--border-color, #ccc)'}
                >
                  <FiPlus />
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handleImages}
              style={{ display: 'none' }}
            />
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
