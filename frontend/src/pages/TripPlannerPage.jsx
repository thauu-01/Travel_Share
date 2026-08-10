import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { tripAPI, placeAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  FiPlus, FiTrash2, FiMapPin, FiCalendar, FiEye, FiLock,
  FiEdit2, FiX, FiCheck, FiSearch, FiGlobe, FiList, FiZap
} from 'react-icons/fi';

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
}

function formatDateRange(start, end) {
  if (!start) return null;
  const s = formatDate(start);
  const e = end ? formatDate(end) : null;
  return e ? `${s} → ${e}` : s;
}

export default function TripPlannerPage() {
  const { isAuthenticated, user } = useSelector(s => s.auth);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetTripId = searchParams.get('id');

  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [addingDay, setAddingDay] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  const isOwner = selectedTrip ? String(selectedTrip.user_id) === String(user?.id) : true;

  // Edit Trip Modal state
  const [showEditTrip, setShowEditTrip] = useState(false);
  const [editForm, setEditForm] = useState({ title: '', description: '', start_date: '', end_date: '', is_public: true });
  const [updatingTrip, setUpdatingTrip] = useState(false);

  // Edit Day state
  const [editingDayId, setEditingDayId] = useState(null);
  const [dayNoteText, setDayNoteText] = useState('');

  // Add place state (Supports 2 modes: system vs custom/map)
  const [addingPlaceDay, setAddingPlaceDay] = useState(null);
  const [placeInputMode, setPlaceInputMode] = useState('system'); // 'system' | 'custom'
  const [selectedPlace, setSelectedPlace] = useState('');
  const [customPlaceName, setCustomPlaceName] = useState('');
  const [customProvince, setCustomProvince] = useState('');
  const [customLat, setCustomLat] = useState(null);
  const [customLng, setCustomLng] = useState(null);
  const [placeNote, setPlaceNote] = useState('');

  // Nominatim Map Search API
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSuggestions, setMapSuggestions] = useState([]);
  const [showMapSuggestions, setShowMapSuggestions] = useState(false);

  // Form state for creating trip
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    is_public: true
  });

  // Calculate days for form preview
  const calculatedDays = (() => {
    if (!form.start_date || !form.end_date) return null;
    const s = new Date(form.start_date);
    const e = new Date(form.end_date);
    if (e < s) return null;
    return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
  })();

  const calculatedEditDays = (() => {
    if (!editForm.start_date || !editForm.end_date) return null;
    const s = new Date(editForm.start_date);
    const e = new Date(editForm.end_date);
    if (e < s) return null;
    return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
  })();

  // Nominatim Live Search Effect
  useEffect(() => {
    if (!mapSearchQuery || mapSearchQuery.trim().length < 2) {
      setMapSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(mapSearchQuery)}&countrycodes=vn&addressdetails=1&limit=5`)
        .then(res => res.json())
        .then(data => {
          setMapSuggestions(data || []);
        })
        .catch(() => setMapSuggestions([]));
    }, 400);
    return () => clearTimeout(timer);
  }, [mapSearchQuery]);

  function handleSelectMapSuggestion(item) {
    const parts = item.display_name.split(',');
    const name = parts[0] ? parts[0].trim() : item.display_name;
    const prov = item.address?.state || item.address?.city || item.address?.province || (parts[parts.length - 2] ? parts[parts.length - 2].trim() : 'Việt Nam');
    setCustomPlaceName(name);
    setCustomProvince(prov);
    setCustomLat(parseFloat(item.lat));
    setCustomLng(parseFloat(item.lon));
    setMapSearchQuery(name);
    setShowMapSuggestions(false);
  }

  // Load places for dropdown
  useEffect(() => {
    if (isAuthenticated) {
      placeAPI.getAll({ limit: 200 }).then(r => setPlaces(r.data.data?.places || [])).catch(() => {});
    }
  }, [isAuthenticated]);

  const fetchTrips = useCallback(async () => {
    try {
      let data = [];
      if (isAuthenticated) {
        const res = await tripAPI.getAll();
        data = res.data.data || [];
        setTrips(data);
      }

      if (targetTripId) {
        try {
          const resTarget = await tripAPI.getById(targetTripId);
          setSelectedTrip(resTarget.data.data);
        } catch {
          if (data.length > 0) setSelectedTrip(data[0]);
        }
      } else if (data.length > 0) {
        setSelectedTrip(prev => {
          if (!prev) return data[0];
          return data.find(t => t.id === prev.id) || data[0];
        });
      }
    } catch (err) {
      if (err.response?.status !== 401) {
        toast.error('Không thể tải danh sách lịch trình');
      }
    } finally {
      setLoading(false);
    }
  }, [targetTripId, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated && !targetTripId) {
      navigate('/login');
      return;
    }
    fetchTrips();
  }, [isAuthenticated, targetTripId, fetchTrips, navigate]);

  // Select a trip (fetch fresh detail)
  async function handleSelectTrip(trip) {
    if (!trip) return;
    try {
      const res = await tripAPI.getById(trip.id);
      setSelectedTrip(res.data.data);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Bạn chỉ có thể xem và quản lý lịch trình của chính mình');
      } else {
        setSelectedTrip(trip);
      }
    }
  }

  // Create trip
  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Vui lòng nhập tên lịch trình');
    if (form.start_date && form.end_date) {
      if (new Date(form.end_date) < new Date(form.start_date)) {
        return toast.error('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu');
      }
    }
    setCreating(true);
    try {
      const res = await tripAPI.create({
        ...form,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
      });
      const newTrip = res.data.data;
      setTrips(prev => [newTrip, ...prev]);
      setForm({ title: '', description: '', start_date: '', end_date: '', is_public: true });
      setShowCreate(false);
      setSelectedTrip(newTrip);
      toast.success('🎉 Tạo lịch trình thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi tạo lịch trình');
    } finally {
      setCreating(false);
    }
  }

  // Edit Trip Modal handlers
  function handleOpenEditTrip() {
    if (!selectedTrip) return;
    setEditForm({
      title: selectedTrip.title || '',
      description: selectedTrip.description || '',
      start_date: selectedTrip.start_date ? selectedTrip.start_date.split('T')[0] : '',
      end_date: selectedTrip.end_date ? selectedTrip.end_date.split('T')[0] : '',
      is_public: selectedTrip.is_public !== undefined ? selectedTrip.is_public : true
    });
    setShowEditTrip(true);
  }

  async function handleSaveTripEdit(e) {
    e.preventDefault();
    if (!editForm.title.trim()) return toast.error('Vui lòng nhập tên lịch trình');
    setUpdatingTrip(true);
    try {
      await tripAPI.update(selectedTrip.id, editForm);
      toast.success('Cập nhật lịch trình thành công!');
      setShowEditTrip(false);
      const refreshed = await tripAPI.getById(selectedTrip.id);
      setSelectedTrip(refreshed.data.data);
      setTrips(prev => prev.map(t => t.id === selectedTrip.id ? refreshed.data.data : t));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật lịch trình');
    } finally {
      setUpdatingTrip(false);
    }
  }

  // Delete trip
  async function handleDeleteTrip(id, e) {
    e?.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa lịch trình này? Các bài viết đính kèm sẽ không bị xóa nhưng sẽ gỡ đính kèm.')) return;
    try {
      await tripAPI.delete(id);
      setTrips(prev => prev.filter(t => t.id !== id));
      if (selectedTrip?.id === id) setSelectedTrip(null);
      toast.success('Đã xóa lịch trình');
    } catch {
      toast.error('Không thể xóa lịch trình');
    }
  }

  // Add Day (Sequential)
  async function handleAddDay() {
    if (!selectedTrip) return;
    const currentDays = selectedTrip.days?.length || 0;
    let maxDays = selectedTrip.total_days || 1;

    if (selectedTrip.start_date && selectedTrip.end_date) {
      const s = new Date(selectedTrip.start_date);
      const e = new Date(selectedTrip.end_date);
      const diffDays = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) maxDays = diffDays;
    }

    if (currentDays >= maxDays) {
      return toast.error(`Đã đủ số ngày trong lịch trình (${currentDays}/${maxDays} ngày)`);
    }

    setAddingDay(true);
    try {
      const res = await tripAPI.addDay(selectedTrip.id, {});
      toast.success(`🎉 Đã thêm Ngày ${currentDays + 1}!`);
      // Refresh selected trip detail
      const refreshed = await tripAPI.getById(selectedTrip.id);
      setSelectedTrip(refreshed.data.data);
      setTrips(prev => prev.map(t => t.id === selectedTrip.id ? refreshed.data.data : t));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm ngày');
    } finally {
      setAddingDay(false);
    }
  }

  // Save Day note edit
  async function handleSaveDayNote(dayId) {
    try {
      await tripAPI.updateDay(selectedTrip.id, dayId, { note: dayNoteText });
      toast.success('Đã cập nhật ghi chú ngày!');
      setEditingDayId(null);
      const refreshed = await tripAPI.getById(selectedTrip.id);
      setSelectedTrip(refreshed.data.data);
    } catch {
      toast.error('Không thể cập nhật ngày');
    }
  }

  // Delete Day (with Renumbering warning)
  async function handleDeleteDay(dayId, dayNumber) {
    const confirmMessage = `⚠️ CẢNH BÁO DỊCH CHUYỂN NGÀY THÁNG:\n\nXóa Ngày ${dayNumber} sẽ tự động dịch chuyển ngày tháng và số thứ tự của tất cả các ngày phía sau lên trước 1 ngày.\n\nBạn có chắc chắn muốn xóa Ngày ${dayNumber}?`;
    if (!confirm(confirmMessage)) return;

    try {
      await tripAPI.deleteDay(selectedTrip.id, dayId);
      toast.success(`Đã xóa Ngày ${dayNumber} và cập nhật lại lịch trình!`);
      const refreshed = await tripAPI.getById(selectedTrip.id);
      setSelectedTrip(refreshed.data.data);
      setTrips(prev => prev.map(t => t.id === selectedTrip.id ? refreshed.data.data : t));
    } catch {
      toast.error('Không thể xóa ngày');
    }
  }

  // Add place to day (System OR Custom / Map Search)
  async function handleAddPlace(dayId) {
    try {
      let payload = { note: placeNote };
      if (placeInputMode === 'system') {
        if (!selectedPlace) return toast.error('Vui lòng chọn địa điểm từ hệ thống');
        payload.place_id = selectedPlace;
      } else {
        if (!customPlaceName.trim()) return toast.error('Vui lòng nhập hoặc chọn tên địa điểm');
        payload.place_name = customPlaceName.trim();
        payload.province = customProvince.trim() || 'Việt Nam';
        payload.latitude = customLat;
        payload.longitude = customLng;
      }

      const res = await tripAPI.addPlace(selectedTrip.id, dayId, payload);
      const newTripPlace = res.data.data;

      setSelectedTrip(prev => ({
        ...prev,
        days: prev.days.map(d =>
          d.id === dayId ? { ...d, places: [...(d.places || []), newTripPlace] } : d
        )
      }));

      // Reset form
      setAddingPlaceDay(null);
      setSelectedPlace('');
      setPlaceNote('');
      setCustomPlaceName('');
      setCustomProvince('');
      setCustomLat(null);
      setCustomLng(null);
      setMapSearchQuery('');
      toast.success('Đã thêm địa điểm!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm địa điểm');
    }
  }

  // Remove place from day
  async function handleRemovePlace(dayId, placeId, tripPlaceId) {
    try {
      await tripAPI.removePlace(selectedTrip.id, dayId, placeId);
      setSelectedTrip(prev => ({
        ...prev,
        days: prev.days.map(d =>
          d.id === dayId ? { ...d, places: d.places.filter(p => p.id !== tripPlaceId && p.place_id !== parseInt(placeId)) } : d
        )
      }));
      toast.success('Đã xóa địa điểm khỏi ngày');
    } catch {
      toast.error('Không thể xóa địa điểm');
    }
  }

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 pt-8">

        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8 animate-in">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              📅 Lập kế hoạch du lịch
            </h1>
            <p className="text-slate-500 mt-1 text-sm">Tạo và quản lý lịch trình du lịch cá nhân của bạn</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white border-none cursor-pointer hover:scale-105 active:scale-95 transition-all"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', boxShadow: '0 4px 14px rgba(139,92,246,0.35)' }}
              onClick={() => navigate('/trips/ai')}
            >
              <FiZap size={15} />
              ✨ AI Tạo Lịch Trình VIP
            </button>
            <button
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/25 border-none cursor-pointer hover:scale-105 active:scale-95"
              onClick={() => setShowCreate(!showCreate)}
            >
              {showCreate ? <FiX size={16} /> : <FiPlus size={16} />}
              {showCreate ? 'Đóng' : 'Tạo lịch trình'}
            </button>
          </div>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 p-6 mb-8 animate-scale-in">
            <h3 className="text-lg font-bold mb-5 text-slate-900 flex items-center gap-2">
              ✨ Tạo lịch trình mới
              {calculatedDays && (
                <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-full ml-auto">
                  Tổng {calculatedDays} ngày
                </span>
              )}
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                  Tên lịch trình <span className="text-red-500">*</span>
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                  placeholder="Ví dụ: Du lịch Đà Nẵng - Hội An 4 ngày 3 đêm"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Mô tả ngắn</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                  placeholder="Ghi chú tổng quan về chuyến đi..."
                  rows={2}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Ngày bắt đầu</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    value={form.start_date}
                    onChange={e => setForm({ ...form, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Ngày kết thúc</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    value={form.end_date}
                    onChange={e => setForm({ ...form, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_public: !f.is_public }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${form.is_public ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                >
                  {form.is_public ? <><FiEye size={14} /> Công khai 🌐</> : <><FiLock size={14} /> Riêng tư 🔒</>}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-60 border-none cursor-pointer flex items-center gap-2"
                >
                  {creating ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang tạo...</> : 'Tạo lịch trình'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Edit Trip Modal */}
        {showEditTrip && selectedTrip && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-scale-in">
              <div className="flex justify-between items-center mb-5 border-b pb-3">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FiEdit2 className="text-sky-600" /> Chỉnh sửa lịch trình
                </h3>
                <button onClick={() => setShowEditTrip(false)} className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer">
                  <FiX size={18} />
                </button>
              </div>
              <form onSubmit={handleSaveTripEdit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Tên lịch trình</label>
                  <input
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none text-sm font-medium"
                    value={editForm.title}
                    onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Mô tả ngắn</label>
                  <textarea
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 outline-none resize-none text-sm"
                    rows={2}
                    value={editForm.description}
                    onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Ngày bắt đầu</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 text-sm"
                      value={editForm.start_date}
                      onChange={e => setEditForm({ ...editForm, start_date: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">Ngày kết thúc</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-sky-500 text-sm"
                      value={editForm.end_date}
                      onChange={e => setEditForm({ ...editForm, end_date: e.target.value })}
                    />
                  </div>
                </div>
                {calculatedEditDays && (
                  <p className="text-xs text-sky-600 font-bold bg-sky-50 p-2 rounded-lg text-center">
                    Cập nhật thời gian sẽ cho phép sinh tối đa {calculatedEditDays} ngày!
                  </p>
                )}
                <div className="flex items-center justify-between pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setEditForm(f => ({ ...f, is_public: !f.is_public }))}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${editForm.is_public ? 'bg-sky-50 border-sky-200 text-sky-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                  >
                    {editForm.is_public ? '🌐 Công khai' : '🔒 Riêng tư'}
                  </button>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowEditTrip(false)} className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer">
                      Hủy
                    </button>
                    <button type="submit" disabled={updatingTrip} className="px-5 py-2 rounded-xl text-xs font-bold bg-sky-500 text-white hover:bg-sky-600 cursor-pointer border-none shadow-md">
                      {updatingTrip ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6 items-start">

            {/* ── Trip List ───────────────────────────────── */}
            <div className="animate-in">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                Lịch trình của bạn ({trips.length})
              </h2>
              {trips.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-white rounded-2xl border-2 border-slate-200 border-dashed animate-in">
                  <div className="text-5xl mb-3">🗓️</div>
                  <p className="font-medium">Chưa có lịch trình nào</p>
                  <p className="text-sm mt-1">Nhấn "Tạo lịch trình" để bắt đầu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {trips.map((trip, idx) => {
                    const isSelected = selectedTrip?.id === trip.id;
                    let daysCount = trip.total_days || 1;
                    if (trip.start_date && trip.end_date) {
                      const s = new Date(trip.start_date);
                      const e = new Date(trip.end_date);
                      const diff = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
                      if (diff > 0) daysCount = diff;
                    }

                    return (
                      <div
                        key={trip.id}
                        onClick={() => handleSelectTrip(trip)}
                        className={`bg-white rounded-2xl border cursor-pointer transition-all hover:shadow-md group animate-in ${isSelected ? 'border-blue-500 shadow-md shadow-blue-100 ring-2 ring-blue-100 scale-[1.01]' : 'border-slate-100 hover:border-blue-200'}`}
                        style={{ animationDelay: `${idx * 0.05}s` }}
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-900 text-base truncate group-hover:text-blue-600 transition-colors">
                                  {trip.title}
                                </h3>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${trip.is_public ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                  {trip.is_public ? 'Công khai' : 'Riêng tư'}
                                </span>
                              </div>
                              {trip.description && (
                                <p className="text-slate-500 text-xs mt-1 line-clamp-1">{trip.description}</p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400">
                                {trip.start_date && (
                                  <span className="flex items-center gap-1 font-medium text-slate-600">
                                    <FiCalendar size={12} className="text-blue-500" />
                                    {formatDateRange(trip.start_date, trip.end_date)}
                                  </span>
                                )}
                                <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                  {daysCount} ngày
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDeleteTrip(trip.id, e)}
                              className="p-2 rounded-xl text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all border-none cursor-pointer shrink-0 opacity-0 group-hover:opacity-100"
                              title="Xóa lịch trình"
                            >
                              <FiTrash2 size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Trip Details & Days Timeline ─────────────── */}
            <div>
              {selectedTrip ? (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-md shadow-slate-200/50 overflow-hidden animate-in">
                  
                  {/* Trip Header Banner — Light Sky Blue */}
                  <div className="bg-gradient-to-r from-sky-100 via-blue-50 to-sky-200/80 p-6 border-b border-sky-200/80 text-slate-900">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${selectedTrip.is_public ? 'bg-sky-200/80 text-sky-800' : 'bg-slate-200 text-slate-700'}`}>
                            {selectedTrip.is_public ? '🌐 Công khai' : '🔒 Riêng tư'}
                          </span>
                          <span className="text-xs bg-sky-200/80 text-sky-800 font-bold px-2.5 py-0.5 rounded-full">
                            {(() => {
                              if (selectedTrip.start_date && selectedTrip.end_date) {
                                const s = new Date(selectedTrip.start_date);
                                const e = new Date(selectedTrip.end_date);
                                const diff = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
                                if (diff > 0) return diff;
                              }
                              return selectedTrip.total_days || 1;
                            })()} ngày
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <h2 className="text-2xl font-extrabold text-slate-900">{selectedTrip.title}</h2>
                          {isOwner && (
                            <button
                              onClick={handleOpenEditTrip}
                              className="p-1.5 rounded-lg text-sky-700 hover:bg-sky-200/80 transition-all border-none bg-transparent cursor-pointer"
                              title="Chỉnh sửa lịch trình này"
                            >
                              <FiEdit2 size={16} />
                            </button>
                          )}
                        </div>
                        {selectedTrip.description && (
                          <p className="text-slate-600 text-sm mt-1">{selectedTrip.description}</p>
                        )}
                        {selectedTrip.start_date && (
                          <div className="flex items-center gap-1.5 text-xs text-sky-700 font-semibold mt-3">
                            <FiCalendar size={13} className="text-sky-600" />
                            {formatDateRange(selectedTrip.start_date, selectedTrip.end_date)}
                          </div>
                        )}
                      </div>

                      {/* Add Day Button (Owner only) or Read-Only Badge */}
                      {isOwner ? (
                        (() => {
                          const currentDays = selectedTrip.days?.length || 0;
                          let maxDays = selectedTrip.total_days || 1;
                          if (selectedTrip.start_date && selectedTrip.end_date) {
                            const s = new Date(selectedTrip.start_date);
                            const e = new Date(selectedTrip.end_date);
                            const diffDays = Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
                            if (diffDays > 0) maxDays = diffDays;
                          }
                          const isMax = currentDays >= maxDays;
                          return (
                            <div className="flex flex-col items-end gap-2">
                              <button
                                onClick={handleAddDay}
                                disabled={addingDay || isMax}
                                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all border-none cursor-pointer shadow-md ${
                                  isMax
                                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                    : 'bg-sky-500 hover:bg-sky-600 text-white hover:scale-105 active:scale-95 shadow-sky-500/25'
                                }`}
                                title={isMax ? `Đã đủ ${maxDays} ngày` : 'Thêm ngày tiếp theo'}
                              >
                                {addingDay ? (
                                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <FiPlus size={16} />
                                )}
                                Thêm ngày ({currentDays}/{maxDays})
                              </button>

                              <button
                                onClick={(e) => handleDeleteTrip(selectedTrip.id, e)}
                                className="inline-flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors border-none bg-transparent cursor-pointer font-medium"
                              >
                                <FiTrash2 size={13} /> Xóa lịch trình này
                              </button>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="bg-white/80 backdrop-blur-sm text-sky-800 border border-sky-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm">
                          <span>👁️ Chế độ chỉ xem</span>
                          {selectedTrip.user?.full_name && (
                            <span className="text-slate-500 font-normal">| Tác giả: <strong>{selectedTrip.user.full_name}</strong></span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Days Timeline */}
                  <div className="p-6">
                    {(!selectedTrip.days || selectedTrip.days.length === 0) ? (
                      <div className="text-center py-16 text-slate-400 animate-in">
                        <div className="text-5xl mb-3">📋</div>
                        <p className="font-medium text-slate-500">Chưa có ngày nào trong lịch trình này</p>
                        {isOwner && (
                          <>
                            <p className="text-sm mt-1 text-slate-400">Nhấn "Thêm ngày" để bắt đầu sinh ngày 1 tuần tự</p>
                            <button
                              onClick={handleAddDay}
                              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-sky-500 text-white hover:bg-sky-600 transition-all border-none cursor-pointer shadow-md hover:scale-105"
                            >
                              <FiPlus size={16} /> Thêm ngày đầu tiên (Ngày 1)
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {[...selectedTrip.days].sort((a, b) => a.day_number - b.day_number).map((day, idx) => (
                          <div key={day.id} className="relative animate-in" style={{ animationDelay: `${idx * 0.08}s` }}>
                            
                            {/* Timeline vertical line */}
                            {idx < selectedTrip.days.length - 1 && (
                              <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-transparent" />
                            )}

                            {/* Day Header */}
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                                  {day.day_number}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 text-base flex items-center gap-2">
                                    Ngày {day.day_number}
                                    {isOwner && editingDayId !== day.id && (
                                      <button
                                        onClick={() => { setEditingDayId(day.id); setDayNoteText(day.note || ''); }}
                                        className="text-slate-400 hover:text-blue-600 transition-colors p-1 border-none bg-transparent cursor-pointer"
                                        title="Sửa ghi chú ngày này"
                                      >
                                        <FiEdit2 size={13} />
                                      </button>
                                    )}
                                  </div>
                                  {day.date && (
                                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                      <FiCalendar size={11} className="text-blue-500" />
                                      {formatDate(day.date)}
                                    </div>
                                  )}

                                  {/* Inline Edit Day Note */}
                                  {editingDayId === day.id ? (
                                    <div className="flex items-center gap-2 mt-1.5 animate-in">
                                      <input
                                        type="text"
                                        value={dayNoteText}
                                        onChange={e => setDayNoteText(e.target.value)}
                                        placeholder="Ví dụ: Tham quan chợ nổi Cái Răng"
                                        className="px-2.5 py-1 text-xs border border-blue-300 rounded-lg outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                      <button onClick={() => handleSaveDayNote(day.id)} className="p-1 rounded bg-blue-600 text-white text-xs cursor-pointer border-none">
                                        <FiCheck size={13} />
                                      </button>
                                      <button onClick={() => setEditingDayId(null)} className="p-1 rounded bg-slate-200 text-slate-600 text-xs cursor-pointer border-none">
                                        <FiX size={13} />
                                      </button>
                                    </div>
                                  ) : (
                                    day.note && <div className="text-xs text-slate-500 italic mt-0.5">{day.note}</div>
                                  )}
                                </div>
                              </div>

                              {/* Delete Day Button (Owner only) */}
                              {isOwner && (
                                <button
                                  onClick={() => handleDeleteDay(day.id, day.day_number)}
                                  className="p-1.5 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all border-none cursor-pointer"
                                  title={`Xóa Ngày ${day.day_number}`}
                                >
                                  <FiTrash2 size={15} />
                                </button>
                              )}
                            </div>

                            {/* Places in Day */}
                            <div className="ml-13 pl-5 space-y-2.5">
                              {day.places?.length > 0 ? (
                                day.places.map((tp, pIdx) => (
                                  <div key={tp.id} className="flex items-start gap-3 p-3.5 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 group hover:border-blue-200 transition-all">
                                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                                      {pIdx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-semibold text-sm text-slate-800 truncate">{tp.place?.name || 'Địa điểm'}</div>
                                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                        <FiMapPin size={10} /> {tp.place?.province || ''}
                                      </div>
                                      {tp.note && <div className="text-xs text-slate-500 mt-0.5 italic">{tp.note}</div>}
                                    </div>
                                    {isOwner && (
                                      <button
                                        onClick={() => handleRemovePlace(day.id, tp.place_id || tp.place?.id, tp.id)}
                                        className="p-1.5 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 border-none cursor-pointer"
                                      >
                                        <FiX size={13} />
                                      </button>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-slate-400 py-2 pl-1 italic">Chưa có địa điểm nào trong ngày này</div>
                              )}

                              {/* Add Place Form with 2 Modes: System vs Map API Search / Custom Input */}
                              {isOwner && (
                                addingPlaceDay === day.id ? (
                                  <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 space-y-3 animate-in shadow-sm">
                                    
                                    {/* Mode selector tabs */}
                                    <div className="flex rounded-lg bg-slate-200/80 p-0.5 text-xs font-bold">
                                      <button
                                        type="button"
                                        onClick={() => setPlaceInputMode('system')}
                                        className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all border-none cursor-pointer ${placeInputMode === 'system' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 bg-transparent'}`}
                                      >
                                        <FiList size={13} /> Chọn từ hệ thống
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPlaceInputMode('custom')}
                                        className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-all border-none cursor-pointer ${placeInputMode === 'custom' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900 bg-transparent'}`}
                                      >
                                        <FiGlobe size={13} /> Tự gõ / Bản đồ Google Map
                                      </button>
                                    </div>

                                    {/* Mode 1: System Dropdown */}
                                    {placeInputMode === 'system' ? (
                                      <div>
                                        <select
                                          value={selectedPlace}
                                          onChange={e => setSelectedPlace(e.target.value)}
                                          className="w-full px-3 py-2.5 rounded-lg border border-blue-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                        >
                                          <option value="">-- Chọn địa điểm từ hệ thống --</option>
                                          {places.map(p => (
                                            <option key={p.id} value={p.id}>{p.name} ({p.province})</option>
                                          ))}
                                        </select>
                                      </div>
                                    ) : (
                                      /* Mode 2: Custom / Nominatim Live Search */
                                      <div className="space-y-2.5">
                                        <div className="relative">
                                          <div className="relative">
                                            <input
                                              type="text"
                                              value={mapSearchQuery}
                                              onChange={e => {
                                                setMapSearchQuery(e.target.value);
                                                setCustomPlaceName(e.target.value);
                                                setShowMapSuggestions(true);
                                              }}
                                              onFocus={() => setShowMapSuggestions(true)}
                                              placeholder="🔍 Gõ tên hoặc tìm kiếm trên bản đồ (VD: Bến Tre, Chợ Bến Thành...)"
                                              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-blue-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                            />
                                            <FiSearch size={14} className="absolute left-3 top-3 text-slate-400" />
                                          </div>

                                          {/* Live Suggestions Dropdown */}
                                          {showMapSuggestions && mapSuggestions.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 bg-white border border-blue-200 rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto mt-1">
                                              {mapSuggestions.map((item, idx) => (
                                                <div
                                                  key={idx}
                                                  onClick={() => handleSelectMapSuggestion(item)}
                                                  className="px-3 py-2 cursor-pointer border-b border-slate-100 hover:bg-blue-50 text-xs text-slate-700 transition-colors flex items-center gap-2"
                                                >
                                                  <FiMapPin size={12} className="text-blue-500 shrink-0" />
                                                  <span className="truncate">{item.display_name}</span>
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tên địa điểm</label>
                                            <input
                                              type="text"
                                              value={customPlaceName}
                                              onChange={e => setCustomPlaceName(e.target.value)}
                                              placeholder="Tên địa điểm..."
                                              className="w-full px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-xs outline-none"
                                            />
                                          </div>
                                          <div>
                                            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Tỉnh / Thành phố</label>
                                            <input
                                              type="text"
                                              value={customProvince}
                                              onChange={e => setCustomProvince(e.target.value)}
                                              placeholder="Tỉnh/Thành..."
                                              className="w-full px-3 py-1.5 rounded-lg border border-blue-200 bg-white text-xs outline-none"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    )}

                                    {/* Common Activity Note Input */}
                                    <input
                                      type="text"
                                      value={placeNote}
                                      onChange={e => setPlaceNote(e.target.value)}
                                      placeholder="Ghi chú hoạt động (Ví dụ: Thưởng thức kẹo dừa, Đi ghe lướt sóng...)"
                                      className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />

                                    <div className="flex gap-2 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setAddingPlaceDay(null);
                                          setSelectedPlace('');
                                          setPlaceNote('');
                                          setCustomPlaceName('');
                                          setCustomProvince('');
                                          setMapSearchQuery('');
                                        }}
                                        className="flex-1 py-2 text-xs font-semibold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                      >
                                        Huỷ
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleAddPlace(day.id)}
                                        className="flex-[2] py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all border-none cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                                      >
                                        <FiCheck size={13} /> Thêm vào ngày {day.day_number}
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setAddingPlaceDay(day.id);
                                      setSelectedPlace('');
                                      setPlaceNote('');
                                      setCustomPlaceName('');
                                      setCustomProvince('');
                                      setMapSearchQuery('');
                                    }}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition-all border border-dashed border-blue-200 w-full justify-center cursor-pointer"
                                  >
                                    <FiPlus size={13} /> Thêm địa điểm vào Ngày {day.day_number}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-slate-400 bg-white rounded-2xl border-2 border-slate-200 border-dashed">
                  <div className="text-5xl mb-3">👈</div>
                  <p className="font-medium text-slate-500">Chọn một lịch trình ở danh sách bên trái để xem chi tiết</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
