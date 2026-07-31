import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { tripAPI, placeAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiPlus, FiTrash2, FiMapPin, FiCalendar, FiEye, FiLock } from 'react-icons/fi';

export default function TripPlannerPage() {
  const { isAuthenticated } = useSelector(s => s.auth);
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '' });
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { navigate('/login'); return; }
    fetchTrips();
    placeAPI.getAll({ limit: 100 }).then(r => setPlaces(r.data.data.places || []));
  }, []);

  const fetchTrips = async () => {
    try {
      const res = await tripAPI.getAll();
      setTrips(res.data.data || []);
    } catch (err) { /* */ }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await tripAPI.create(form);
      setTrips(prev => [res.data.data, ...prev]);
      setForm({ title: '', description: '', start_date: '', end_date: '' });
      setShowCreate(false);
      toast.success('Tạo lịch trình thành công!');
    } catch (err) { toast.error('Lỗi tạo lịch trình'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Xóa lịch trình này?')) return;
    try {
      await tripAPI.delete(id);
      setTrips(prev => prev.filter(t => t.id !== id));
      if (selectedTrip?.id === id) setSelectedTrip(null);
      toast.success('Đã xóa');
    } catch (err) { toast.error('Lỗi'); }
  };

  const handleAddDay = async (tripId) => {
    try {
      const res = await tripAPI.addDay(tripId, { note: '' });
      fetchTrips();
      toast.success('Đã thêm ngày');
    } catch (err) { toast.error('Lỗi'); }
  };

  const handleAddPlace = async (tripId, dayId, placeId) => {
    try {
      await tripAPI.addPlace(tripId, dayId, { place_id: placeId });
      fetchTrips();
      toast.success('Đã thêm địa điểm');
    } catch (err) { toast.error('Lỗi'); }
  };

  return (
    <div className="pt-24 min-h-screen bg-[#f0f7ff]">
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="flex justify-between items-center mb-8 animate-in">
          <div>
            <h1 className="text-3xl font-extrabold mb-2 text-slate-900">📅 Lập kế hoạch du lịch</h1>
            <p className="text-slate-500">Tạo và quản lý lịch trình du lịch của bạn</p>
          </div>
          <button 
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition-all bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:shadow-lg hover:-translate-y-px border-none"
            onClick={() => setShowCreate(!showCreate)}
          >
            <FiPlus /> Tạo lịch trình
          </button>
        </div>

        {showCreate && (
          <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 mb-8 animate-in">
            <h3 className="text-lg font-bold mb-4 text-slate-900">Tạo lịch trình mới</h3>
            <form onSubmit={handleCreate}>
              <div className="mb-4">
                <input 
                  className="w-full px-4 py-2.5 rounded-xl border border-indigo-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                  placeholder="Tên lịch trình (VD: Du lịch miền Trung 5 ngày)"
                  value={form.title} 
                  onChange={e => setForm({...form, title: e.target.value})} 
                  required 
                />
              </div>
              <div className="mb-4">
                <textarea 
                  className="w-full px-4 py-2.5 rounded-xl border border-indigo-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none" 
                  placeholder="Mô tả" 
                  rows={2}
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngày bắt đầu</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2.5 rounded-xl border border-indigo-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                    value={form.start_date}
                    onChange={e => setForm({...form, start_date: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ngày kết thúc</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-2.5 rounded-xl border border-indigo-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                    value={form.end_date}
                    onChange={e => setForm({...form, end_date: e.target.value})} 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                className="px-6 py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition-all bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:shadow-lg border-none"
              >
                Tạo mới
              </button>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-100 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-8">
            {/* Trip List */}
            <div>
              <h3 className="text-xl font-bold mb-4 text-slate-900">Lịch trình của bạn ({trips.length})</h3>
              {trips.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-white rounded-2xl border-2 border-indigo-100 border-dashed">
                  <div className="text-4xl mb-3">🗓️</div>
                  <p>Chưa có lịch trình nào</p>
                </div>
              ) : trips.map(trip => (
                <div 
                  key={trip.id} 
                  className={`bg-white rounded-2xl shadow-sm border transition-all mb-4 cursor-pointer hover:shadow-md ${selectedTrip?.id === trip.id ? 'border-blue-500 ring-2 ring-blue-100' : 'border-indigo-100'}`}
                  onClick={() => setSelectedTrip(trip)}
                >
                  <div className="p-5 flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg text-slate-900 mb-1">{trip.title}</h3>
                      <div className="text-[0.8rem] text-slate-500 flex gap-4 items-center">
                        {trip.start_date && (
                          <span className="flex items-center gap-1.5"><FiCalendar size={12} /> {trip.start_date} &rarr; {trip.end_date}</span>
                        )}
                        <span className="flex items-center gap-1.5">
                          {trip.is_public ? <><FiEye size={12} /> Công khai</> : <><FiLock size={12} /> Riêng tư</>}
                        </span>
                      </div>
                    </div>
                    <button 
                      className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all border-none cursor-pointer" 
                      onClick={(e) => { e.stopPropagation(); handleDelete(trip.id); }}
                      title="Xóa lịch trình"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Trip Detail */}
            <div>
              {selectedTrip ? (
                <div className="bg-white rounded-2xl shadow-sm border border-indigo-100 p-6 animate-in">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-indigo-50">
                    <h3 className="text-xl font-bold text-slate-900">{selectedTrip.title}</h3>
                    <button 
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all border-none cursor-pointer" 
                      onClick={() => handleAddDay(selectedTrip.id)}
                    >
                      <FiPlus /> Thêm ngày
                    </button>
                  </div>
                  <div className="trip-timeline pl-2">
                    {selectedTrip.days?.map(day => (
                      <div key={day.id} className="trip-day relative mb-8">
                        <div className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                          Ngày {day.day_number} {day.date ? <span className="text-slate-500 font-normal text-sm">({day.date})</span> : ''}
                        </div>
                        {day.places?.map(tp => (
                          <div key={tp.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl mb-2 border border-gray-100">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                              <FiMapPin size={14} />
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-slate-900">{tp.place?.name}</div>
                              <div className="text-xs text-slate-500">{tp.place?.province}</div>
                            </div>
                          </div>
                        ))}
                        <select 
                          className="w-full mt-2 px-4 py-2.5 rounded-xl border border-indigo-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm cursor-pointer" 
                          onChange={e => { if (e.target.value) handleAddPlace(selectedTrip.id, day.id, e.target.value); e.target.value = ''; }}
                        >
                          <option value="">+ Thêm địa điểm vào ngày này...</option>
                          {places.map(p => <option key={p.id} value={p.id}>{p.name} - {p.province}</option>)}
                        </select>
                      </div>
                    ))}
                    {(!selectedTrip.days || selectedTrip.days.length === 0) && (
                      <div className="text-center p-8 text-slate-400 bg-gray-50 rounded-xl border border-indigo-50">
                        Chưa có ngày nào trong lịch trình. Nhấn "Thêm ngày" để bắt đầu.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-12 text-slate-400 bg-white rounded-2xl border-2 border-indigo-100 border-dashed mt-4 lg:mt-0">
                  <div className="text-4xl mb-3">👈</div>
                  <p>Chọn một lịch trình bên trái để xem chi tiết</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
