import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { postAPI, placeAPI, categoryAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiSave, FiMapPin, FiPlus } from 'react-icons/fi';
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

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

export default function EditPostPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useSelector(s => s.auth);
  const navigate = useNavigate();

  const [form, setForm] = useState({ title: '', content: '', place_id: '', rating: 5 });
  const [existingImages, setExistingImages] = useState([]);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const fileInputRef = useRef(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
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
    
    Promise.all([
      placeAPI.getAll({ limit: 100 }),
      categoryAPI.getAll(),
      postAPI.getById(id)
    ]).then(([placesRes, catRes, postRes]) => {
      let fetchedPlaces = placesRes.data.data.places || [];
      setCategories(catRes.data.data || []);
      
      const post = postRes.data.data;
      if (post.place && !fetchedPlaces.find(p => String(p.id) === String(post.place.id))) {
        fetchedPlaces = [post.place, ...fetchedPlaces];
      }
      setPlaces(fetchedPlaces);
      if (String(post.user_id) !== String(user?.id) && user?.role !== 'admin') {
        toast.error('Bạn không có quyền sửa bài viết này');
        navigate('/profile');
        return;
      }
      
      setForm({
        title: post.title || '',
        content: post.content || '',
        place_id: post.place?.id || '',
        rating: post.rating || 5
      });
      setExistingImages(post.images || []);
      setLoading(false);
    }).catch(err => {
      toast.error('Lỗi tải dữ liệu bài viết');
      setLoading(false);
    });
  }, [id, isAuthenticated]);

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
    } catch (err) {}
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

  const handleNewImages = (e) => {
    const files = Array.from(e.target.files);
    if (existingImages.length - imagesToRemove.length + newImages.length + files.length > 5) {
      return toast.error('Tối đa 5 hình ảnh');
    }
    setNewImages(prev => [...prev, ...files]);
  };

  const handleRemoveExistingImage = (imgId) => {
    setImagesToRemove(prev => [...prev, imgId]);
  };

  const handleRemoveNewImage = (index) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) return toast.error('Vui lòng nhập tiêu đề và nội dung');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('content', form.content);
      if (form.place_id) fd.append('place_id', form.place_id);
      fd.append('rating', form.rating);
      
      imagesToRemove.forEach(id => fd.append('images_to_remove', id));
      newImages.forEach(img => fd.append('images', img));

      await postAPI.update(id, fd);
      toast.success('Cập nhật bài viết thành công!');
      navigate(`/posts/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi cập nhật bài viết');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="pt-24 min-h-screen bg-[#f0f7ff] flex justify-center">
      <div className="w-10 h-10 border-4 border-indigo-100 border-t-blue-600 rounded-full animate-spin mt-20"></div>
    </div>
  );

  return (
    <div className="pt-24 min-h-screen bg-[#f0f7ff]">
      <div className="max-w-3xl mx-auto px-6 pb-12">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-indigo-100 animate-in">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 mb-2">
              <FiSave className="text-blue-600" /> Chỉnh sửa bài viết
            </h1>
            <p className="text-slate-500">Cập nhật nội dung trải nghiệm của bạn</p>
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
              {form.place_id && places.find(p => String(p.id) === String(form.place_id)) && (
                <div className="mt-3 p-4 bg-blue-50/50 border border-blue-100 rounded-xl flex items-start gap-3 animate-in">
                  <div className="mt-1"><FiMapPin className="text-blue-500" /></div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">{places.find(p => String(p.id) === String(form.place_id)).name}</div>
                    <div className="text-xs text-slate-500 mt-1">{places.find(p => String(p.id) === String(form.place_id)).address || places.find(p => String(p.id) === String(form.place_id)).province}</div>
                  </div>
                </div>
              )}
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
              <label className="block text-sm font-semibold text-slate-700 mb-3">Hình ảnh (tối đa 5 ảnh)</label>
              <div className="flex gap-3 flex-wrap">
                {existingImages.filter(img => !imagesToRemove.includes(img.id)).map((img, i) => (
                  <div key={`old-${i}`} className="w-24 h-24 rounded-xl overflow-hidden border-2 border-indigo-50 shadow-sm relative group">
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => handleRemoveExistingImage(img.id)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                ))}
                
                {newImages.map((file, i) => (
                  <div key={`new-${i}`} className="w-24 h-24 rounded-xl overflow-hidden border-2 border-blue-200 shadow-sm relative group">
                    <img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => handleRemoveNewImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                  </div>
                ))}
                
                {(existingImages.length - imagesToRemove.length + newImages.length) < 5 && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-colors bg-slate-50"
                  >
                    <FiPlus size={24} />
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} accept="image/*" multiple onChange={handleNewImages} className="hidden" />
            </div>
            
            <button 
              type="submit" 
              className="w-full py-4 mt-4 rounded-xl font-bold text-lg bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2" 
              disabled={saving}
            >
              <FiSave size={20} /> {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
