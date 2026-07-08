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
    <div className="page">
      <div className="container">
        <div className="page-header animate-in" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="page-title">📅 Lập kế hoạch du lịch</h1>
            <p className="page-subtitle">Tạo và quản lý lịch trình du lịch của bạn</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
            <FiPlus /> Tạo lịch trình
          </button>
        </div>

        {showCreate && (
          <div className="card animate-in" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Tạo lịch trình mới</h3>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <input className="form-input" placeholder="Tên lịch trình (VD: Du lịch miền Trung 5 ngày)"
                  value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
              </div>
              <div className="form-group">
                <textarea className="form-textarea" placeholder="Mô tả" rows={2}
                  value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
              </div>
              <div className="grid grid-2">
                <div className="form-group">
                  <label className="form-label">Ngày bắt đầu</label>
                  <input type="date" className="form-input" value={form.start_date}
                    onChange={e => setForm({...form, start_date: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Ngày kết thúc</label>
                  <input type="date" className="form-input" value={form.end_date}
                    onChange={e => setForm({...form, end_date: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary">Tạo</button>
            </form>
          </div>
        )}

        {loading ? <div className="loading"><div className="spinner"></div></div> : (
          <div className="grid grid-2">
            {/* Trip List */}
            <div>
              <h3 style={{ marginBottom: '1rem' }}>Lịch trình của bạn ({trips.length})</h3>
              {trips.length === 0 ? (
                <div className="empty-state"><div className="icon">🗓️</div>Chưa có lịch trình nào</div>
              ) : trips.map(trip => (
                <div key={trip.id} className="card" style={{ marginBottom: '1rem', cursor: 'pointer', border: selectedTrip?.id === trip.id ? '1px solid var(--accent)' : undefined }}
                  onClick={() => setSelectedTrip(trip)}>
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 className="card-title">{trip.title}</h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                          {trip.start_date && <span><FiCalendar size={12} /> {trip.start_date} → {trip.end_date}</span>}
                          <span>{trip.is_public ? <><FiEye size={12} /> Công khai</> : <><FiLock size={12} /> Riêng tư</>}</span>
                        </div>
                      </div>
                      <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(trip.id); }}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Trip Detail */}
            <div>
              {selectedTrip ? (
                <div className="animate-in">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>{selectedTrip.title}</h3>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleAddDay(selectedTrip.id)}>
                      <FiPlus /> Thêm ngày
                    </button>
                  </div>
                  <div className="trip-timeline">
                    {selectedTrip.days?.map(day => (
                      <div key={day.id} className="trip-day">
                        <div className="trip-day-header">Ngày {day.day_number} {day.date ? `(${day.date})` : ''}</div>
                        {day.places?.map(tp => (
                          <div key={tp.id} className="trip-place-item">
                            <FiMapPin style={{ color: 'var(--accent)' }} />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{tp.place?.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tp.place?.province}</div>
                            </div>
                          </div>
                        ))}
                        <select className="form-select" style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}
                          onChange={e => { if (e.target.value) handleAddPlace(selectedTrip.id, day.id, e.target.value); e.target.value = ''; }}>
                          <option value="">+ Thêm địa điểm...</option>
                          {places.map(p => <option key={p.id} value={p.id}>{p.name} - {p.province}</option>)}
                        </select>
                      </div>
                    ))}
                    {(!selectedTrip.days || selectedTrip.days.length === 0) && (
                      <div className="empty-state">Chưa có ngày nào. Nhấn "Thêm ngày" để bắt đầu.</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="empty-state" style={{ marginTop: '3rem' }}>
                  <div className="icon">👈</div>Chọn một lịch trình để xem chi tiết
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
