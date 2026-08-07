import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    province: '',
    category_id: '',
    address: '',
    latitude: 10.7769,
    longitude: 106.7009,
    description: ''
  });

  // Delete confirm modal state
  const [deleteTargetPlace, setDeleteTargetPlace] = useState(null);

  // Map Nominatim search state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapCenter, setMapCenter] = useState([10.7769, 106.7009]);

  useEffect(() => {
    fetchPlacesAndCategories();
  }, [search, selectedCategory, selectedProvince]);

  const fetchPlacesAndCategories = async () => {
    setLoading(true);
    try {
      const [resPlaces, resCats] = await Promise.all([
        adminAPI.getPlaces({
          search,
          category_id: selectedCategory,
          province: selectedProvince,
          limit: 100
        }),
        adminAPI.getCategories()
      ]);

      const fetchedPlaces = Array.isArray(resPlaces.data?.data?.places)
        ? resPlaces.data.data.places
        : (Array.isArray(resPlaces.data?.data) ? resPlaces.data.data : []);
      const fetchedCats = Array.isArray(resCats.data?.data) ? resCats.data.data : [];

      setPlaces(fetchedPlaces);
      setCategories(fetchedCats);

      const uniqueProvinces = [...new Set(fetchedPlaces.map(p => p.province).filter(Boolean))];
      setProvinces(uniqueProvinces);
    } catch (err) {
      console.error(err);
      toast.error('Lỗi khi tải dữ liệu địa điểm');
    } finally {
      setLoading(false);
    }
  };

  // Nominatim Autocomplete Live Search
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=vn&addressdetails=1&limit=5`)
        .then(res => res.json())
        .then(data => {
          setSuggestions(data || []);
        })
        .catch(() => setSuggestions([]));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const parts = item.display_name.split(',');
    const name = parts[0] ? parts[0].trim() : item.display_name;
    const prov = item.address?.state || item.address?.city || item.address?.province || (parts[parts.length - 2] ? parts[parts.length - 2].trim() : 'Việt Nam');

    setFormData(prev => ({
      ...prev,
      name: name,
      province: prov,
      address: item.display_name,
      latitude: lat.toFixed(6),
      longitude: lon.toFixed(6)
    }));

    setMapCenter([lat, lon]);
    setSearchQuery(name);
    setShowSuggestions(false);
  };

  const reverseGeocode = (lat, lng) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`)
      .then(res => res.json())
      .then(data => {
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          const prov = data.address?.state || data.address?.city || data.address?.province || (parts[parts.length - 2] ? parts[parts.length - 2].trim() : 'Việt Nam');
          setFormData(prev => ({
            ...prev,
            address: data.display_name,
            province: prov
          }));
        }
      })
      .catch(() => {});
  };

  const handleOpenCreate = () => {
    setEditingPlace(null);
    setFormData({
      name: '',
      province: '',
      category_id: categories[0]?.id || '',
      address: '',
      latitude: 10.7769,
      longitude: 106.7009,
      description: ''
    });
    setMapCenter([10.7769, 106.7009]);
    setSearchQuery('');
    setShowForm(true);
  };

  const handleOpenEdit = (place) => {
    setEditingPlace(place);
    const lat = parseFloat(place.latitude) || 10.7769;
    const lon = parseFloat(place.longitude) || 106.7009;
    setFormData({
      name: place.name || '',
      province: place.province || '',
      category_id: place.category_id || '',
      address: place.address || '',
      latitude: lat,
      longitude: lon,
      description: place.description || ''
    });
    setMapCenter([lat, lon]);
    setSearchQuery(place.name || '');
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.province || !formData.category_id) {
      return toast.error('Vui lòng điền đủ Tên, Tỉnh thành và Danh mục');
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

  const handleOpenDelete = (place) => {
    setDeleteTargetPlace(place);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetPlace) return;
    try {
      const res = await adminAPI.deletePlace(deleteTargetPlace.id);
      toast.success(res.data.message || 'Xóa địa điểm thành công');
      setDeleteTargetPlace(null);
      fetchPlacesAndCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa địa điểm');
    }
  };

  return (
    <div className="animate-in">
      <div className="mb-6 flex justify-between items-center flex-wrap gap-3">
        <div className="flex gap-3 flex-wrap flex-1">
          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả danh mục</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>

          {/* Province filter */}
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="px-4 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Tất cả tỉnh thành</option>
            {provinces.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm shadow-blue-600/20 text-sm border-none cursor-pointer transition-all"
        >
          <FiPlus size={16} /> Thêm địa điểm mới
        </button>
      </div>

      {/* Filter search bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 mb-5 flex items-center gap-3">
        <div className="flex items-center border border-slate-300 rounded-xl px-3 bg-slate-50 flex-1 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
          <FiSearch className="text-slate-400 mr-2" size={16} />
          <input
            type="text"
            placeholder="Tìm theo tên địa điểm hoặc tỉnh thành..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-2.5 text-sm font-medium text-slate-900 bg-transparent border-none outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Places table */}
      <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-600 uppercase bg-slate-50 border-b border-indigo-50 font-bold">
            <tr>
              <th className="px-4 py-3.5 font-bold text-slate-700">Địa điểm</th>
              <th className="px-4 py-3.5 font-bold text-slate-700">Tỉnh / Thành phố</th>
              <th className="px-4 py-3.5 font-bold text-slate-700">Danh mục</th>
              <th className="px-4 py-3.5 font-bold text-slate-700 text-center">Đánh giá TB</th>
              <th className="px-4 py-3.5 font-bold text-slate-700 text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500 font-medium">Đang tải địa điểm...</td>
              </tr>
            ) : (!places || places.length === 0) ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500 font-medium">Không tìm thấy địa điểm nào</td>
              </tr>
            ) : (places || []).map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3.5 font-bold text-slate-900">{p.name}</td>
                <td className="px-4 py-3.5 font-medium text-slate-700">{p.province}</td>
                <td className="px-4 py-3.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200/60">
                    {p.category?.icon || '📍'} {p.category?.name || 'Chưa phân loại'}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-center font-extrabold text-amber-500">
                  ★ {p.avg_rating?.toFixed(1) || '0.0'}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm cursor-pointer"
                    >
                      <FiEdit2 size={14} /> Sửa
                    </button>
                    <button
                      onClick={() => handleOpenDelete(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 hover:border-red-200 transition-colors shadow-sm border-none cursor-pointer"
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

      {/* Add / Edit Form Modal — Rendered via Portal */}
      {showForm && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">
                {editingPlace ? '📍 Chỉnh sửa địa điểm' : '📍 Thêm địa điểm mới'}
              </h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Geocoding Search */}
              <div className="relative">
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                  🔍 Bản đồ & Tìm kiếm địa chỉ tự động
                </label>
                <input
                  type="text"
                  placeholder="Tìm kiếm địa điểm trên bản đồ..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  className="w-full px-4 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-44 overflow-y-auto mt-1">
                    {suggestions.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectSuggestion(item)}
                        className="px-3 py-2 cursor-pointer border-b border-slate-100 hover:bg-indigo-50 text-xs text-slate-700 transition-colors"
                      >
                        {item.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Leaflet map inside Modal */}
              <div className="h-44 w-full rounded-2xl overflow-hidden border border-slate-200">
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
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Tên hiển thị</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl outline-none"
                  required
                />
              </div>

              {/* Province and Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Tỉnh / Thành phố</label>
                  <input
                    type="text"
                    value={formData.province}
                    onChange={e => setFormData({ ...formData, province: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Danh mục phân loại</label>
                  <select
                    value={formData.category_id}
                    onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl outline-none"
                    required
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Readonly Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Địa chỉ chi tiết (Tự động)</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl outline-none"
                />
              </div>

              {/* Lat / Long */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Vĩ độ (Latitude)</label>
                  <input type="text" value={formData.latitude} readOnly className="w-full px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-xl outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Kinh độ (Longitude)</label>
                  <input type="text" value={formData.longitude} readOnly className="w-full px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 border border-slate-200 rounded-xl outline-none cursor-not-allowed" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Mô tả giới thiệu địa điểm</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer bg-white">
                  Hủy
                </button>
                <button type="submit" className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-blue-600/20 border-none cursor-pointer">
                  Lưu thông tin
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Custom Modern Delete Confirm Modal — Rendered via Portal */}
      {deleteTargetPlace && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-lg font-bold">
                📍
              </div>
              <button
                onClick={() => setDeleteTargetPlace(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 mb-2">
              Xác nhận xóa địa điểm
            </h3>
            <p className="text-slate-600 text-sm mb-4 leading-relaxed">
              Bạn có chắc chắn muốn xóa địa điểm <strong>"{deleteTargetPlace.name}"</strong> ({deleteTargetPlace.province})? Thao tác này không thể hoàn tác.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetPlace(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer bg-white"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-all shadow-md shadow-red-600/20 border-none cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FiTrash2 size={15} /> Xóa địa điểm
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
