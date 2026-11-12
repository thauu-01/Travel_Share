import React, { useState, useEffect, useRef } from 'react';
import { FiImage, FiSend, FiSave, FiMapPin, FiPlus, FiX, FiCalendar, FiStar, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { placeAPI } from '../../services/api';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

// Leaflet default marker icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

function MapEvents({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) onMapClick(e.latlng);
    }
  });
  return null;
}

const DEFAULT_INITIAL_VALUES = {
  title: '',
  content: '',
  place_id: '',
  trip_id: '',
  rating: 5,
  status: 'published'
};
const DEFAULT_IMAGES = [];
const DEFAULT_PLACES = [];
const DEFAULT_CATEGORIES = [];
const DEFAULT_TRIPS = [];

export function PostForm({
  initialValues = DEFAULT_INITIAL_VALUES,
  existingImages = DEFAULT_IMAGES,
  places = DEFAULT_PLACES,
  categories = DEFAULT_CATEGORIES,
  trips = DEFAULT_TRIPS,
  onSubmit,
  isEdit = false,
  submitting = false,
  onCancel
}) {
  const fileInputRef = useRef(null);

  const [form, setForm] = useState(initialValues);
  const [currentExistingImages, setCurrentExistingImages] = useState(existingImages);
  const [imagesToRemove, setImagesToRemove] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);

  // Local place list (can be updated when a new place is created)
  const [localPlaces, setLocalPlaces] = useState(places);

  // New place creation modal state
  const [showNewPlace, setShowNewPlace] = useState(false);
  const [creatingPlace, setCreatingPlace] = useState(false);
  const [newPlace, setNewPlace] = useState({
    name: '',
    province: '',
    address: '',
    latitude: '16.0544',
    longitude: '108.2472',
    category_id: ''
  });

  // Map & Autocomplete state
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapCenter, setMapCenter] = useState([16.0544, 108.2472]);

  useEffect(() => {
    if (isEdit && initialValues) {
      setForm(initialValues);
    }
  }, [initialValues, isEdit]);

  useEffect(() => {
    if (isEdit && existingImages && existingImages.length > 0) {
      setCurrentExistingImages(existingImages);
    }
  }, [existingImages, isEdit]);

  useEffect(() => {
    if (places && places.length > 0) {
      setLocalPlaces(places);
    }
  }, [places]);

  // Geocoding Nominatim autocomplete search
  useEffect(() => {
    if (searchQuery.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=vn&addressdetails=1&limit=5`)
        .then(r => r.json())
        .then(data => setSuggestions(data || []))
        .catch(err => console.error('Geocoding error:', err));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const extractProvince = (address, displayName = '') => {
    if (address) {
      const p = address.state || address.province || address.city || address.municipality || address.town || address.county || address.city_district || '';
      if (p) return p.replace(/^tỉnh\s+/i, '').replace(/^thành phố\s+/i, '').trim();
    }
    if (displayName) {
      const cleaned = displayName.replace(/,\s*\d{5,6}\s*(,|$)/g, '$1').replace(/,\s*Việt Nam\s*$/i, '').trim();
      const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean);
      if (parts.length > 1) {
        return parts[parts.length - 1].replace(/^tỉnh\s+/i, '').replace(/^thành phố\s+/i, '').trim();
      }
    }
    return '';
  };

  const handleSelectSuggestion = (item) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    const displayName = item.display_name || '';
    const name = item.name || displayName.split(',')[0]?.trim() || '';
    let province = extractProvince(item.address, displayName);
    if (!province) {
      province = name.replace(/^tỉnh\s+/i, '').replace(/^thành phố\s+/i, '').trim() || name;
    }

    setNewPlace(prev => ({
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
    setSearchQuery(name);
  };

  const handleMapClick = (latlng) => {
    const lat = latlng.lat.toFixed(6);
    const lon = latlng.lng.toFixed(6);
    setMapCenter([latlng.lat, latlng.lng]);
    setNewPlace(prev => ({
      ...prev,
      latitude: lat,
      longitude: lon
    }));

    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1`)
      .then(r => r.json())
      .then(data => {
        if (data) {
          const prov = extractProvince(data.address, data.display_name);
          const name = data.name || data.display_name?.split(',')[0]?.trim() || '';
          setNewPlace(prev => ({
            ...prev,
            name: prev.name || name || 'Địa điểm mới',
            province: prev.province || prov || 'Việt Nam',
            address: data.display_name || prev.address
          }));
        }
      })
      .catch(() => {});
  };

  // Image handlers
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const totalImages = currentExistingImages.length + newImages.length + files.length;
    if (totalImages > 10) {
      toast.error('Tối đa 10 hình ảnh cho một bài viết');
      return;
    }

    const validFiles = files.filter(f => {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`${f.name} vượt quá 5MB`);
        return false;
      }
      return true;
    });

    const previews = validFiles.map(f => URL.createObjectURL(f));
    setNewImages(prev => [...prev, ...validFiles]);
    setNewPreviews(prev => [...prev, ...previews]);
  };

  const handleRemoveExistingImage = (imgUrl) => {
    setCurrentExistingImages(prev => prev.filter(img => img !== imgUrl));
    setImagesToRemove(prev => [...prev, imgUrl]);
  };

  const handleRemoveNewImage = (index) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewImages(prev => prev.filter((_, i) => i !== index));
    setNewPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Handle create new place inline
  const handleCreatePlace = async (e) => {
    e.preventDefault();
    const placeName = (newPlace.name || searchQuery || '').trim();
    let placeProvince = (newPlace.province || '').trim();

    if (!placeName) {
      toast.error('Vui lòng nhập tên địa điểm');
      return;
    }

    // Tự động suy luận tỉnh/thành nếu người dùng chưa nhập
    if (!placeProvince) {
      placeProvince = extractProvince(null, newPlace.address || searchQuery) || placeName;
      setNewPlace(prev => ({ ...prev, province: placeProvince }));
    }

    setCreatingPlace(true);
    try {
      const payload = {
        ...newPlace,
        name: placeName,
        province: placeProvince,
        category_id: newPlace.category_id || (categories[0]?.id || null)
      };
      const res = await placeAPI.create(payload);
      const createdPlace = res.data.data;
      toast.success(`Đã thêm địa điểm "${createdPlace.name}"!`);
      setLocalPlaces(prev => [createdPlace, ...prev]);
      setForm(prev => ({ ...prev, place_id: createdPlace.id }));
      setShowNewPlace(false);
      setNewPlace({ name: '', province: '', address: '', latitude: '16.0544', longitude: '108.2472', category_id: '' });
      setSearchQuery('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi thêm địa điểm');
    } finally {
      setCreatingPlace(false);
    }
  };

  // Submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Vui lòng nhập tiêu đề bài viết');
      return;
    }
    if (!form.content.trim()) {
      toast.error('Vui lòng nhập nội dung bài viết');
      return;
    }

    onSubmit({
      ...form,
      newImages,
      existingImages: currentExistingImages,
      imagesToRemove
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tiêu đề & Đánh giá */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
        <Input
          label="Tiêu đề bài viết *"
          value={form.title}
          onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
          placeholder="Ví dụ: Hành trình chinh phục đỉnh Fansipan 3N2Đ tuyệt đẹp..."
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Địa điểm */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <FiMapPin className="text-blue-500" /> Địa điểm liên quan
              </label>
              <button
                type="button"
                onClick={() => setShowNewPlace(!showNewPlace)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <FiPlus size={14} /> {showNewPlace ? 'Chọn có sẵn' : 'Thêm địa điểm mới'}
              </button>
            </div>

            {!showNewPlace ? (
              <select
                value={form.place_id || ''}
                onChange={(e) => setForm(prev => ({ ...prev, place_id: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="">-- Chọn địa điểm (tùy chọn) --</option>
                {localPlaces.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.province ? `(${p.province})` : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 space-y-3">
                <div className="text-xs font-medium text-blue-800">Tạo địa điểm nhanh từ bản đồ:</div>
                <div className="relative z-30">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      setShowSuggestions(true);
                      setNewPlace(prev => ({
                        ...prev,
                        name: prev.name || val,
                        province: prev.province || val
                      }));
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Tìm kiếm địa điểm trên bản đồ..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                  />
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-[1001] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                      {suggestions.map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectSuggestion(item)}
                          className="px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs border-b border-slate-100 last:border-0"
                        >
                          <div className="font-semibold text-slate-800">{item.name || item.display_name.split(',')[0]}</div>
                          <div className="text-slate-500 text-[11px] truncate">{item.display_name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tên địa điểm *</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Bãi Sau"
                      value={newPlace.name}
                      onChange={(e) => setNewPlace(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tỉnh / Thành phố *</label>
                    <input
                      type="text"
                      placeholder="Ví dụ: Vũng Tàu"
                      value={newPlace.province}
                      onChange={(e) => setNewPlace(prev => ({ ...prev, province: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="h-36 rounded-lg overflow-hidden border border-slate-200 relative z-10">
                  <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={mapCenter} />
                    <MapController center={mapCenter} />
                    <MapEvents onMapClick={handleMapClick} />
                  </MapContainer>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewPlace(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Hủy
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    loading={creatingPlace}
                    onClick={handleCreatePlace}
                  >
                    Lưu & Chọn địa điểm
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Chuyến đi liên kết */}
          <div>
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-1.5">
              <FiCalendar className="text-emerald-500" /> Thuộc chuyến đi (Lịch trình)
            </label>
            <select
              value={form.trip_id || ''}
              onChange={(e) => setForm(prev => ({ ...prev, trip_id: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="">-- Không liên kết chuyến đi --</option>
              {trips.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} {t.start_date ? `(${new Date(t.start_date).toLocaleDateString('vi-VN')})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Đánh giá số sao */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Đánh giá trải nghiệm</label>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setForm(prev => ({ ...prev, rating: star }))}
                className="p-1 text-2xl transition-transform hover:scale-110 cursor-pointer focus:outline-none"
              >
                <FiStar
                  className={star <= form.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}
                />
              </button>
            ))}
            <span className="text-sm font-medium text-slate-600 ml-2">
              {form.rating}/5 sao
            </span>
          </div>
        </div>

        {/* Trạng thái bài viết (chỉ dành cho edit) */}
        {isEdit && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Trạng thái bài viết</label>
            <select
              value={form.status}
              onChange={(e) => setForm(prev => ({ ...prev, status: e.target.value }))}
              className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
            >
              <option value="published">Công khai (Mọi người đều xem được)</option>
              <option value="hidden">Ẩn (Chỉ mình tôi xem)</option>
            </select>
          </div>
        )}
      </div>

      {/* Nội dung bài viết */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-3">
        <label className="block text-sm font-semibold text-slate-700">Nội dung bài viết *</label>
        <textarea
          rows={10}
          value={form.content}
          onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
          placeholder="Chia sẻ kinh nghiệm, cảm nhận, tips ăn uống, chi phí chi tiết..."
          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-y"
          required
        />
      </div>

      {/* Quản lý hình ảnh */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <FiImage className="text-purple-500" /> Hình ảnh đính kèm (Tối đa 10 ảnh)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Mỗi ảnh không quá 5MB. Định dạng JPG, PNG, WEBP.</p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 text-xs font-semibold hover:bg-purple-100 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FiPlus size={14} /> Thêm ảnh
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            multiple
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Existing Images (Edit mode) */}
        {currentExistingImages.length > 0 && (
          <div>
            <div className="text-xs font-medium text-slate-500 mb-2">Ảnh hiện có:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {currentExistingImages.map((img, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-200">
                  <img src={img} alt={`Existing ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(img)}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-600/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Xóa ảnh này"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Selected Images */}
        {newPreviews.length > 0 && (
          <div>
            <div className="text-xs font-medium text-slate-500 mb-2">Ảnh mới thêm:</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {newPreviews.map((preview, idx) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-blue-200">
                  <img src={preview} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveNewImage(idx)}
                    className="absolute top-2 right-2 w-7 h-7 bg-red-600/80 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Xóa ảnh này"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentExistingImages.length === 0 && newPreviews.length === 0 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-50/20 transition-all"
          >
            <FiImage className="mx-auto text-3xl text-slate-300 mb-2" />
            <div className="text-xs font-semibold text-slate-600">Bấm vào đây để chọn ảnh từ máy tính</div>
            <div className="text-[11px] text-slate-400 mt-1">Hỗ trợ chọn nhiều ảnh cùng lúc</div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            icon={FiArrowLeft}
          >
            Hủy / Quay lại
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          loading={submitting}
          icon={isEdit ? FiSave : FiSend}
        >
          {isEdit ? 'Lưu thay đổi' : 'Đăng bài viết ngay'}
        </Button>
      </div>
    </form>
  );
}
