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
    if (!newPlace.name.trim() || !newPlace.province.trim() || !newPlace.latitude || !newPlace.longitude) {
      toast.error('Tên địa điểm, Tỉnh/TP và Tọa độ là bắt buộc');
      return null;
    }
    try {
      const res = await placeAPI.create(newPlace);
      const p = res.data.data;
      const createdId = p.id || p._id;
      setPlaces(prev => [p, ...prev]);
      setForm(prev => ({ ...prev, place_id: createdId }));
      setShowNewPlace(false);
      toast.success(`Đã lưu & chọn địa điểm "${p.name}"!`);
      return createdId;
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Lỗi tạo địa điểm'); 
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return toast.error('Vui lòng nhập tiêu đề và nội dung');
    setLoading(true);
    try {
      let activePlaceId = form.place_id;

      // Tự động tạo địa điểm nếu người dùng chọn trên bản đồ mà chưa nhấn "Thêm địa điểm này"
      if (!activePlaceId && showNewPlace && newPlace.name.trim() && newPlace.province.trim()) {
        const createdId = await handleCreatePlace();
        if (createdId) activePlaceId = createdId;
      }

      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('content', form.content);
      if (activePlaceId) fd.append('place_id', activePlaceId);
      fd.append('rating', form.rating);
      images.forEach(img => fd.append('images', img));

      const res = await postAPI.create(fd);
      toast.success('Tạo bài viết thành công!');
      const createdPost = res.data.data;
      navigate(`/posts/${createdPost.id || createdPost._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi tạo bài viết');
    } finally { setLoading(false); }
  };

  return (
    <div className="pt-24 min-h-screen bg-[#f0f7ff]">
      <div className="max-w-3xl mx-auto px-6 pb-12">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-indigo-100 animate-in">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-2">
              <span className="text-3xl">✍️</span> Viết bài chia sẻ
            </h1>
            <p className="text-slate-500">Chia sẻ trải nghiệm du lịch của bạn với cộng đồng</p>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tiêu đề bài viết</label>
              <input 
                type="text" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                placeholder="VD: Review Bãi biển Mỹ Khê - Thiên đường biển Đà Nẵng"
                value={form.title} 
                onChange={e => setForm({...form, title: e.target.value})} 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nội dung</label>
              <textarea 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" 
                style={{ minHeight: 200 }} 
                placeholder="Chia sẻ chi tiết trải nghiệm của bạn..."
                value={form.content} 
                onChange={e => setForm({...form, content: e.target.value})} 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
                <FiMapPin /> Địa điểm
              </label>
              <div className="flex gap-3">
                <select 
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                  value={form.place_id} 
                  onChange={e => {
                    const val = e.target.value;
                    setForm({...form, place_id: val});
                    if (val) setShowNewPlace(false);
                  }}
                >
                  <option value="">-- Chọn địa điểm --</option>
                  {places.map(p => <option key={p.id} value={p.id}>{p.name} - {p.province}</option>)}
                </select>
                <button 
                  type="button" 
                  className="px-5 py-3 rounded-xl font-semibold bg-indigo-50 text-blue-600 hover:bg-blue-100 transition-colors flex items-center gap-2" 
                  onClick={() => {
                    setShowNewPlace(!showNewPlace);
                    if (!showNewPlace) setForm({...form, place_id: ''});
                  }}
                >
                  <FiPlus /> Mới
                </button>
              </div>
            </div>
            
            {showNewPlace && !form.place_id && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-2">
                <h4 className="font-bold text-slate-800 mb-4 border-b border-slate-200 pb-3 flex items-center gap-2">
                  📍 Tạo địa điểm mới
                </h4>
                
                <div className="mb-4 relative">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">🔍 Tìm kiếm địa điểm</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Nhập tên địa điểm..."
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                  />
                  
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-60 overflow-y-auto mt-2">
                      {suggestions.map((item, index) => (
                        <div key={index} onClick={() => handleSelectSuggestion(item)}
                          className="px-4 py-3 cursor-pointer border-b border-slate-50 hover:bg-slate-50 text-sm text-slate-700 transition-colors"
                        >
                          {item.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="h-64 w-full rounded-xl overflow-hidden mb-4 z-10 relative border border-slate-200">
                  <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
                    <TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker
                      position={[parseFloat(newPlace.latitude) || mapCenter[0], parseFloat(newPlace.longitude) || mapCenter[1]]}
                      draggable={true}
                      eventHandlers={{
                        dragend: (e) => {
                          const marker = e.target;
                          const latLng = marker.getLatLng();
                          const lat = latLng.lat.toFixed(6);
                          const lon = latLng.lng.toFixed(6);
                          setNewPlace(prev => ({ ...prev, latitude: lat, longitude: lon }));
                          reverseGeocode(lat, lon);
                        }
                      }}
                    />
                    <MapController center={mapCenter} />
                  </MapContainer>
                  <p className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur text-xs px-3 py-2 rounded-lg text-slate-600 shadow-sm z-[400] text-center">
                    * Kéo marker màu xanh trên bản đồ để tinh chỉnh tọa độ và tự động lấy địa chỉ
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Tên hiển thị</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    placeholder="Nhập tên địa điểm hiển thị..." 
                    value={newPlace.name} 
                    onChange={e => setNewPlace({ ...newPlace, name: e.target.value })} 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Tỉnh/Thành phố</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                      placeholder="Tỉnh/Thành phố..." 
                      value={newPlace.province} 
                      onChange={e => setNewPlace({ ...newPlace, province: e.target.value })} 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Tọa độ</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed outline-none" 
                      value={`${newPlace.latitude}, ${newPlace.longitude}`} 
                      readOnly 
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Địa chỉ</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed outline-none" 
                    placeholder="Địa chỉ tự động..." 
                    value={newPlace.address} 
                    readOnly 
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Danh mục</label>
                  <select 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" 
                    value={newPlace.category_id} 
                    onChange={e => setNewPlace({...newPlace, category_id: e.target.value})}
                  >
                    <option value="">-- Danh mục --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>

                <button 
                  type="button" 
                  className="w-full py-3 rounded-xl font-bold bg-slate-800 text-white hover:bg-slate-900 transition-colors" 
                  onClick={handleCreatePlace}
                >
                  Thêm địa điểm này
                </button>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Đánh giá</label>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(s => (
                  <span 
                    key={s} 
                    className={`text-3xl cursor-pointer transition-colors ${s <= form.rating ? 'text-yellow-400 drop-shadow-sm' : 'text-slate-200 hover:text-yellow-200'}`}
                    onClick={() => setForm({...form, rating: s})}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1">
                <FiImage /> Hình ảnh (tối đa 5 ảnh)
              </label>
              <div className="flex gap-3 flex-wrap items-center">
                {previews.map((p, i) => (
                  <div key={i} className="w-24 h-24 rounded-xl overflow-hidden border-2 border-indigo-50 shadow-sm relative group">
                    <img src={p} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                ))}
                
                {images.length < 5 && (
                  <div
                    onClick={() => fileInputRef.current.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400 flex items-center justify-center cursor-pointer transition-colors text-slate-400 hover:text-blue-500"
                  >
                    <FiPlus size={24} />
                  </div>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                multiple
                onChange={handleImages}
                className="hidden"
              />
            </div>
            
            <button 
              type="submit" 
              className="w-full py-2.5 mt-4 rounded-xl font-semibold text-sm bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2" 
              disabled={loading}
            >
              <FiSend size={16} /> {loading ? 'Đang đăng...' : 'Đăng bài viết'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
