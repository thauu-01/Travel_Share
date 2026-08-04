import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { tripAPI, placeAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  FiPlus, FiTrash2, FiMapPin, FiCalendar, FiEye, FiLock,
  FiChevronRight, FiEdit2, FiX, FiCheck, FiClock, FiStar
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

function countDays(start, end) {
  if (!start || !end) return null;
  const diff = new Date(end) - new Date(start);
  return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
}

// ─── AddDayModal ─────────────────────────────────────────────────────────────
function AddDayModal({ trip, onClose, onAdded }) {
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await tripAPI.addDay(trip.id, { date: date || undefined, note });
      toast.success('Đã thêm ngày!');
      onAdded(res.data.data);
      onClose();
    } catch {
      toast.error('Không thể thêm ngày');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-bold text-slate-900">Thêm ngày mới</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors border-none cursor-pointer text-slate-500">
            <FiX size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngày (tuỳ chọn)</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ghi chú</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="VD: Di chuyển từ Hà Nội, check-in khách sạn..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
              Huỷ
            </button>
            <button type="submit" disabled={loading}
              className="flex-[2] py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2 border-none">
              {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang thêm...</> : <><FiCheck size={15} /> Thêm ngày</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TripPlannerPage() {
  const { isAuthenticated } = useSelector(s => s.auth);
  const navigate = useNavigate();

  const [trips, setTrips] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '', is_public: true });
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showAddDay, setShowAddDay] = useState(false);
  const [addingPlaceDay, setAddingPlaceDay] = useState(null); // dayId being added to
  const [selectedPlace, setSelectedPlace] = useState('');
  const [placeNote, setPlaceNote] = useState('');

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchTrips();
    placeAPI.getAll({ limit: 200 }).then(r => setPlaces(r.data.data?.places || []));
  }, []);

  const fetchTrips = useCallback(async () => {
    try {
      const res = await tripAPI.getAll();
      const data = res.data.data || [];
      setTrips(data);
      // Keep selectedTrip in sync
      setSelectedTrip(prev => {
        if (!prev) return null;
        return data.find(t => t.id === prev.id) || null;
      });
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  // Select a trip (fetch fresh detail)
  async function handleSelectTrip(trip) {
    try {
      const res = await tripAPI.getById(trip.id);
      setSelectedTrip(res.data.data);
    } catch {
      setSelectedTrip(trip);
    }
  }

  // Create trip
  async function handleCreate(e) {
    e.preventDefault();
    if (!form.title.trim()) return toast.error('Vui lòng nhập tên lịch trình');
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
    } catch {
      toast.error('Lỗi tạo lịch trình');
    } finally {
      setCreating(false);
    }
  }

  // Delete trip
  async function handleDelete(id, e) {
    e?.stopPropagation();
    if (!confirm('Xóa lịch trình này?')) return;
    try {
      await tripAPI.delete(id);
      setTrips(prev => prev.filter(t => t.id !== id));
      if (selectedTrip?.id === id) setSelectedTrip(null);
      toast.success('Đã xóa lịch trình');
    } catch {
      toast.error('Không thể xóa');
    }
  }

  // After adding a day: append to selectedTrip.days immediately
  function handleDayAdded(newDay) {
    setSelectedTrip(prev => {
      if (!prev) return prev;
      return { ...prev, days: [...(prev.days || []), { ...newDay, places: [] }] };
    });
    setTrips(prevTrips => prevTrips.map(t =>
      t.id === selectedTrip?.id
        ? { ...t, days: [...(t.days || []), { ...newDay, places: [] }] }
        : t
    ));
  }

  // Add place to day
  async function handleAddPlace(dayId) {
    if (!selectedPlace) return toast.error('Chọn địa điểm');
    try {
      const res = await tripAPI.addPlace(selectedTrip.id, dayId, {
        place_id: selectedPlace,
        note: placeNote
      });
      const newTripPlace = res.data.data;
      // Update locally
      setSelectedTrip(prev => ({
        ...prev,
        days: prev.days.map(d =>
          d.id === dayId ? { ...d, places: [...(d.places || []), newTripPlace] } : d
        )
      }));
      setAddingPlaceDay(null);
      setSelectedPlace('');
      setPlaceNote('');
      toast.success('Đã thêm địa điểm!');
    } catch {
      toast.error('Không thể thêm địa điểm');
    }
  }

  // Remove place from day
  async function handleRemovePlace(dayId, tripPlaceId) {
    // Optimistic remove
    setSelectedTrip(prev => ({
      ...prev,
      days: prev.days.map(d =>
        d.id === dayId ? { ...d, places: d.places.filter(p => p.id !== tripPlaceId) } : d
      )
    }));
    toast.success('Đã xóa địa điểm');
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
            <p className="text-slate-500 mt-1 text-sm">Tạo và quản lý lịch trình du lịch của bạn</p>
          </div>
          <button
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/25 border-none cursor-pointer hover:scale-105 active:scale-95"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? <FiX size={16} /> : <FiPlus size={16} />}
            {showCreate ? 'Đóng' : 'Tạo lịch trình'}
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 p-6 mb-8 animate-scale-in">
            <h3 className="text-lg font-bold mb-5 text-slate-900">✨ Tạo lịch trình mới</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                placeholder="Tên lịch trình (VD: Du lịch Đà Nẵng 5 ngày 4 đêm)"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                required
              />
              <textarea
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                placeholder="Mô tả lịch trình..."
                rows={2}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
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
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, is_public: !f.is_public }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all cursor-pointer ${form.is_public ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'}`}
                >
                  {form.is_public ? <><FiEye size={14} /> Công khai</> : <><FiLock size={14} /> Riêng tư</>}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="ml-auto px-6 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md disabled:opacity-60 border-none cursor-pointer flex items-center gap-2"
                >
                  {creating ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />Đang tạo...</> : 'Tạo lịch trình'}
                </button>
              </div>
            </form>
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
                    const days = countDays(trip.start_date, trip.end_date);
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
                              <h3 className="font-bold text-slate-900 truncate">{trip.title}</h3>
                              {trip.description && (
                                <p className="text-xs text-slate-400 mt-0.5 truncate">{trip.description}</p>
                              )}
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
                                {formatDateRange(trip.start_date, trip.end_date) && (
                                  <span className="flex items-center gap-1">
                                    <FiCalendar size={11} />
                                    {formatDateRange(trip.start_date, trip.end_date)}
                                  </span>
                                )}
                                {days && (
                                  <span className="flex items-center gap-1">
                                    <FiClock size={11} />
                                    {days} ngày
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  {trip.is_public ? <><FiEye size={11} />Công khai</> : <><FiLock size={11} />Riêng tư</>}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isSelected && <FiChevronRight size={16} className="text-blue-500" />}
                              <button
                                onClick={e => handleDelete(trip.id, e)}
                                className="p-2 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition-all border-none cursor-pointer opacity-0 group-hover:opacity-100"
                                title="Xóa"
                              >
                                <FiTrash2 size={14} />
                              </button>
                            </div>
                          </div>
                          {(trip.days?.length > 0) && (
                            <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-1.5 text-xs text-slate-400">
                              <FiMapPin size={11} />
                              {trip.days.length} ngày
                              {' · '}
                              {trip.days.reduce((acc, d) => acc + (d.places?.length || 0), 0)} địa điểm
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Trip Detail ─────────────────────────────── */}
            <div className="animate-in delay-1">
              {selectedTrip ? (
                <div key={selectedTrip.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 animate-in">
                  {/* Detail header */}
                  <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-start gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">{selectedTrip.title}</h2>
                      {selectedTrip.description && (
                        <p className="text-sm text-slate-400 mt-0.5">{selectedTrip.description}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-slate-500">
                        {formatDateRange(selectedTrip.start_date, selectedTrip.end_date) && (
                          <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg font-semibold">
                            <FiCalendar size={11} />
                            {formatDateRange(selectedTrip.start_date, selectedTrip.end_date)}
                            {countDays(selectedTrip.start_date, selectedTrip.end_date) && (
                              <> · {countDays(selectedTrip.start_date, selectedTrip.end_date)} ngày</>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowAddDay(true)}
                      className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md border-none cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <FiPlus size={15} /> Thêm ngày
                    </button>
                  </div>

                  {/* Days */}
                  <div className="p-6">
                    {(!selectedTrip.days || selectedTrip.days.length === 0) ? (
                      <div className="text-center py-16 text-slate-400 animate-in">
                        <div className="text-5xl mb-3">📋</div>
                        <p className="font-medium text-slate-500">Chưa có ngày nào</p>
                        <p className="text-sm mt-1">Nhấn "Thêm ngày" để bắt đầu lập kế hoạch</p>
                        <button
                          onClick={() => setShowAddDay(true)}
                          className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all border-none cursor-pointer hover:scale-105 active:scale-95"
                        >
                          <FiPlus size={15} /> Thêm ngày đầu tiên
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {[...selectedTrip.days].sort((a, b) => a.day_number - b.day_number).map((day, idx) => (
                          <div key={day.id} className="relative animate-in" style={{ animationDelay: `${idx * 0.08}s` }}>
                            {/* Timeline line */}
                            {idx < selectedTrip.days.length - 1 && (
                              <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-transparent" />
                            )}

                            {/* Day header */}
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
                                {day.day_number}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">Ngày {day.day_number}</div>
                                {day.date && (
                                  <div className="text-xs text-slate-400 flex items-center gap-1">
                                    <FiCalendar size={10} />
                                    {formatDate(day.date)}
                                  </div>
                                )}
                                {day.note && (
                                  <div className="text-xs text-slate-400 mt-0.5 italic">{day.note}</div>
                                )}
                              </div>
                            </div>

                            {/* Places */}
                            <div className="ml-13 pl-5 space-y-2">
                              {day.places?.length > 0 ? day.places.map((tp, pIdx) => (
                                <div key={tp.id} className="flex items-start gap-3 p-3.5 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-100 group hover:border-blue-200 transition-all">
                                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                                    {pIdx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-sm text-slate-800 truncate">{tp.place?.name || 'Địa điểm'}</div>
                                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                      <FiMapPin size={10} /> {tp.place?.province || ''}
                                    </div>
                                    {tp.note && <div className="text-xs text-slate-400 mt-0.5 italic">{tp.note}</div>}
                                  </div>
                                  <button
                                    onClick={() => handleRemovePlace(day.id, tp.id)}
                                    className="p-1.5 rounded-lg text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100 border-none cursor-pointer"
                                  >
                                    <FiX size={13} />
                                  </button>
                                </div>
                              )) : (
                                <div className="text-xs text-slate-400 py-2 pl-1">Chưa có địa điểm nào trong ngày này</div>
                              )}

                              {/* Add place inline */}
                              {addingPlaceDay === day.id ? (
                                <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200 space-y-2.5">
                                  <select
                                    value={selectedPlace}
                                    onChange={e => setSelectedPlace(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-lg border border-blue-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                  >
                                    <option value="">-- Chọn địa điểm --</option>
                                    {places.map(p => (
                                      <option key={p.id} value={p.id}>{p.name} — {p.province}</option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    value={placeNote}
                                    onChange={e => setPlaceNote(e.target.value)}
                                    placeholder="Ghi chú (tuỳ chọn)"
                                    className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => { setAddingPlaceDay(null); setSelectedPlace(''); setPlaceNote(''); }}
                                      className="flex-1 py-2 text-xs font-semibold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                                    >
                                      Huỷ
                                    </button>
                                    <button
                                      onClick={() => handleAddPlace(day.id)}
                                      className="flex-[2] py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all border-none cursor-pointer flex items-center justify-center gap-1"
                                    >
                                      <FiCheck size={13} /> Thêm địa điểm
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { setAddingPlaceDay(day.id); setSelectedPlace(''); setPlaceNote(''); }}
                                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-50 transition-all border border-dashed border-blue-200 w-full justify-center cursor-pointer"
                                >
                                  <FiPlus size={13} /> Thêm địa điểm vào ngày này
                                </button>
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
                  <p className="font-medium text-slate-500">Chọn một lịch trình để xem chi tiết</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Day Modal */}
      {showAddDay && selectedTrip && (
        <AddDayModal
          trip={selectedTrip}
          onClose={() => setShowAddDay(false)}
          onAdded={handleDayAdded}
        />
      )}
    </div>
  );
}
