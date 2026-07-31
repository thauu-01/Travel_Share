import { useState, useEffect } from 'react';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiSearch, FiX } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
      map.setView(center, 14);
    }
  }, [center, map]);
  return null;
}

export default function AdminPlaces() {
  const [places, setPlaces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    province: '',
    address: '',
    latitude: '16.0544',
    longitude: '108.2472',
    category_id: '',
    description: ''
  });

  // Map view toggle
  const [showMap, setShowMap] = useState(false);
  const [mapCenter, setMapCenter] = useState([16.0544, 108.2472]);
  
  // Search suggestion state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    fetchPlacesAndCategories();
  }, [search]);

  // Autocomplete search Nominatim
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=vn&addressdetails=1&limit=5`)
        .then(res => res.json())
        .then(data => setSuggestions(data || []))
        .catch(err => console.error(err));
    }, 600);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchPlacesAndCategories = async () => {
    setLoading(true);
    try {
      const [placesRes, categoriesRes] = await Promise.all([
        adminAPI.getPlaces({ search }),
        adminAPI.getCategories()
      ]);
      setPlaces(placesRes.data.data);
      setCategories(categoriesRes.data.data);
    } catch (err) {
      toast.error('Không thể tải thông tin địa điểm');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingPlace(null);
    setFormData({
      name: '',
      province: '',
      address: '',
      latitude: '16.0544',
      longitude: '108.2472',
      category_id: categories[0]?.id || '',
      description: ''
    });
    setMapCenter([16.0544, 108.2472]);
    setShowForm(true);
  };

  const handleOpenEdit = (place) => {
    setEditingPlace(place);
    setFormData({
      name: place.name,
      province: place.province,
      address: place.address || '',
      latitude: place.latitude.toString(),
      longitude: place.longitude.toString(),
      category_id: place.category_id,
      description: place.description || ''
    });
    setMapCenter([place.latitude, place.longitude]);
    setShowForm(true);
  };

  const extractProvince = (address) => {
    if (!address) return '';
    return address.city || address.state || address.province || address.town || '';
  };

  const handleSelectSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const province = extractProvince(item.address);
    const displayName = item.display_name;
    const name = item.name || displayName.split(',')[0];

    setFormData(prev => ({
      ...prev,
      name,
      province,
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
        setFormData(prev => ({
          ...prev,
          province: province || prev.province,
          address: data.display_name || prev.address
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.province || !formData.category_id) {
      return toast.error('Vui lòng điền đủ thông tin');
    }

    try {
      if (editingPlace) {
        await adminAPI.updatePlace(editingPlace.id, formData);
        toast.success('Cập nhật địa điểm thành công');
      } else {
        await adminAPI.createPlace(formData);
        toast.success('Tạo địa điểm thành công');
      }
      setShowForm(false);
      fetchPlacesAndCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const handleDelete = async (placeId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa địa điểm này?')) return;
    try {
      const res = await adminAPI.deletePlace(placeId);
      toast.success(res.data.message);
      fetchPlacesAndCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa địa điểm');
    }
  };

  return (
    <div className="animate-in">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-3">
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-indigo-300 transition-all font-semibold shadow-sm text-sm"
            onClick={() => setShowMap(!showMap)}
          >
            <span className="text-lg">🗺️</span> {showMap ? 'Ẩn bản đồ' : 'Hiển thị bản đồ tổng'}
          </button>
          <button 
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-sm shadow-blue-600/20 text-sm"
            onClick={handleOpenCreate}
          >
            <FiPlus size={18} /> Thêm địa điểm
          </button>
        </div>
      </div>

      {/* Global Map of all Places */}
      {showMap && places.length > 0 && (
        <div style={{ height: '380px', width: '100%', borderRadius: 12, marginBottom: '20px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #cbd5e1', zIndex: 1 }}>
          <MapContainer center={[16.0544, 108.2472]} zoom={6} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; OpenStreetMap'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {places.map(p => (
              <Marker key={p.id} position={[p.latitude, p.longitude]}>
                <Popup>
                  <div style={{ padding: '4px' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{p.name}</strong>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>{p.category?.icon} {p.category?.name} • {p.province}</div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Search Filter */}
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: '16px 20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        border: '1px solid #e2e8f0',
        display: 'flex',
        gap: '12px',
        marginBottom: '20px',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '0 10px', backgroundColor: '#f8fafc', flex: '1' }}>
          <FiSearch style={{ color: '#94a3b8', marginRight: '8px' }} />
          <input
            type="text"
            placeholder="Tìm theo tên địa điểm hoặc tỉnh thành..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ border: 'none', background: 'none', padding: '8px 0', width: '100%', fontSize: '0.9rem', outline: 'none' }}
          />
        </div>
      </div>

      {/* Places table */}
      <div style={{ background: 'white', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', overflowX: 'auto' }}>
        <table className="table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
              <th style={{ padding: '14px 16px' }}>Địa điểm</th>
              <th style={{ padding: '14px 16px' }}>Tỉnh/Thành phố</th>
              <th style={{ padding: '14px 16px' }}>Danh mục</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Đánh giá TB</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải...</td>
              </tr>
            ) : places.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Không tìm thấy địa điểm nào</td>
              </tr>
            ) : places.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '14px 16px', fontWeight: 600, color: '#0f172a' }}>{p.name}</td>
                <td style={{ padding: '14px 16px', color: '#475569' }}>{p.province}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ fontSize: '0.85rem' }}>{p.category?.icon} {p.category?.name}</span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 'bold', color: '#eab308' }}>
                  ★ {p.avg_rating?.toFixed(1) || '0.0'}
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                    >
                      <FiEdit2 size={14} /> Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 hover:border-red-200 transition-colors shadow-sm"
                    >
                      <FiTrash2 size={14} /> Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Form Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '24px', width: '560px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                {editingPlace ? '📍 Chỉnh sửa địa điểm' : '📍 Thêm địa điểm mới'}
              </h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><FiX size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Geocoding Search */}
              <div className="form-group" style={{ position: 'relative' }}>
                <label className="form-label">🔍 Bản đồ & Tìm kiếm địa chỉ tự động</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Tìm kiếm địa điểm trên bản đồ..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: 'white', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 1000, maxHeight: '180px', overflowY: 'auto', marginTop: 4 }}>
                    {suggestions.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectSuggestion(item)}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'white'}
                      >
                        {item.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leaflet map inside Modal */}
              <div style={{ height: '180px', width: '100%', borderRadius: 8, overflow: 'hidden', marginBottom: 16, zIndex: 1 }}>
                <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker
                    position={[parseFloat(formData.latitude) || mapCenter[0], parseFloat(formData.longitude) || mapCenter[1]]}
                    draggable={true}
                    eventHandlers={{
                      dragend: (e) => {
                        const marker = e.target;
                        const latLng = marker.getLatLng();
                        setFormData(prev => ({
                          ...prev,
                          latitude: latLng.lat.toFixed(6),
                          longitude: latLng.lng.toFixed(6)
                        }));
                        reverseGeocode(latLng.lat, latLng.lng);
                      }
                    }}
                  />
                  <MapController center={mapCenter} />
                </MapContainer>
              </div>

              {/* Name */}
              <div className="form-group">
                <label className="form-label">Tên hiển thị</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Province and Category */}
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Tỉnh/Thành phố</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.province}
                    onChange={e => setFormData({ ...formData, province: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Danh mục phân loại</label>
                  <select
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    className="form-select"
                    required
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Readonly Address */}
              <div className="form-group">
                <label className="form-label">Địa chỉ chi tiết (Tự động)</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              {/* Lat / Long */}
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Vĩ độ (Latitude)</label>
                  <input type="text" className="form-input" value={formData.latitude} readOnly style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Kinh độ (Longitude)</label>
                  <input type="text" className="form-input" value={formData.longitude} readOnly style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }} />
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Mô tả giới thiệu địa điểm</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Hủy</button>
                <button type="submit" className="btn btn-primary">Lưu thông tin</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
