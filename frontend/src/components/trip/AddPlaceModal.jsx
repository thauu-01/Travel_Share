import React, { useState, useEffect } from 'react';
import { FiMapPin, FiSearch, FiCompass, FiLayers } from 'react-icons/fi';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export function AddPlaceModal({ isOpen, onClose, dayNumber, places = [], onAdd, loading }) {
  const [mode, setMode] = useState('system'); // 'system' | 'custom'
  const [selectedPlaceId, setSelectedPlaceId] = useState('');
  const [note, setNote] = useState('');

  // Custom / Nominatim geocoding states
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [customName, setCustomName] = useState('');
  const [customProvince, setCustomProvince] = useState('');
  const [customLat, setCustomLat] = useState(null);
  const [customLng, setCustomLng] = useState(null);

  // Autocomplete debouncer
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=vn&addressdetails=1&limit=5`)
        .then(r => r.json())
        .then(data => setSuggestions(data || []))
        .catch(() => setSuggestions([]));
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const cleanLocationDetails = (item) => {
    const full = item.display_name || '';
    const cleaned = full.replace(/,\s*\d{5,6}\s*(,|$)/g, '$1').replace(/,\s*Việt Nam\s*$/i, '').trim();
    const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean);
    if (parts.length <= 1) {
      return { name: parts[0] || cleaned, location: cleaned };
    }
    return { name: parts[0], location: parts.slice(1).join(', ') };
  };

  const handleSelectSuggestion = (item) => {
    const { name, location } = cleanLocationDetails(item);
    setCustomName(name);
    setCustomProvince(location);
    setCustomLat(parseFloat(item.lat));
    setCustomLng(parseFloat(item.lon));
    setSearchQuery(name);
    setSuggestions([]);
  };

  const resetForm = () => {
    setSelectedPlaceId('');
    setNote('');
    setSearchQuery('');
    setSuggestions([]);
    setCustomName('');
    setCustomProvince('');
    setCustomLat(null);
    setCustomLng(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'system') {
      if (!selectedPlaceId) return;
      onAdd({ place_id: selectedPlaceId, note }, resetForm);
    } else {
      if (!customName.trim()) return;
      onAdd({
        place_name: customName.trim(),
        province: customProvince.trim() || 'Việt Nam',
        latitude: customLat,
        longitude: customLng,
        note
      }, resetForm);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`📍 Thêm địa điểm vào Ngày ${dayNumber}`}
      maxWidth="max-w-lg"
    >
      {/* Mode Switcher Tabs */}
      <div className="flex border-b border-slate-200 mb-4">
        <button
          type="button"
          onClick={() => setMode('system')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 cursor-pointer transition-colors ${
            mode === 'system'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FiLayers size={14} /> Chọn từ hệ thống ({places.length})
        </button>
        <button
          type="button"
          onClick={() => setMode('custom')}
          className={`flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 cursor-pointer transition-colors ${
            mode === 'custom'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FiCompass size={14} /> Tìm kiếm bản đồ mở rộng
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'system' ? (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Chọn danh lam thắng cảnh / địa điểm
            </label>
            <select
              value={selectedPlaceId}
              onChange={(e) => setSelectedPlaceId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm font-medium"
              required
            >
              <option value="">-- Chọn một địa điểm có sẵn --</option>
              {places.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.province ? `• ${p.province}` : ''}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Tìm kiếm địa điểm trên bản đồ Việt Nam
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Gõ tên quán cafe, bãi biển, đèo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <FiSearch className="absolute left-3 top-3 text-slate-400" />
              </div>

              {suggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                  {suggestions.map((item, idx) => {
                    const info = cleanLocationDetails(item);
                    return (
                      <div
                        key={idx}
                        onClick={() => handleSelectSuggestion(item)}
                        className="px-3.5 py-2.5 hover:bg-blue-50/60 cursor-pointer border-b border-slate-100 last:border-0"
                      >
                        <div className="text-xs font-bold text-slate-800">{info.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{info.location}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tên địa điểm</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Tên điểm đến"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Khu vực / Tỉnh thành</label>
                <input
                  type="text"
                  value={customProvince}
                  onChange={(e) => setCustomProvince(e.target.value)}
                  placeholder="Tỉnh/Thành phố"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5">
            Ghi chú hoạt động (Ăn uống, check-in, chi phí dự kiến...)
          </label>
          <textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ví dụ: Ghé chụp ảnh lúc 8h sáng, thuê xe máy 150k..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            Thêm vào lịch trình
          </Button>
        </div>
      </form>
    </Modal>
  );
}
