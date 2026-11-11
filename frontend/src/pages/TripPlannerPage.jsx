import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { tripAPI, placeAPI } from '../services/api';
import toast from 'react-hot-toast';

import { TripSidebar } from '../components/trip/TripSidebar';
import { TripHeader } from '../components/trip/TripHeader';
import { TripDayCard } from '../components/trip/TripDayCard';
import { CreateTripModal } from '../components/trip/CreateTripModal';
import { EditTripModal } from '../components/trip/EditTripModal';
import { AddPlaceModal } from '../components/trip/AddPlaceModal';
import { EditActivityModal } from '../components/trip/EditActivityModal';

export default function TripPlannerPage() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const targetTripId = searchParams.get('id');

  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [updatingTrip, setUpdatingTrip] = useState(false);

  const [activeDayForAdd, setActiveDayForAdd] = useState(null);
  const [addingPlace, setAddingPlace] = useState(false);

  const [activeActivityForEdit, setActiveActivityForEdit] = useState(null);
  const [activeDayIdForActivityEdit, setActiveDayIdForActivityEdit] = useState(null);
  const [savingActivity, setSavingActivity] = useState(false);

  const [addingDay, setAddingDay] = useState(false);

  const isOwner = selectedTrip ? String(selectedTrip.user_id) === String(user?.id) : true;

  // Load places for dropdown
  useEffect(() => {
    if (isAuthenticated) {
      placeAPI.getAll({ limit: 200 })
        .then(r => setPlaces(r.data.data?.places || []))
        .catch(() => {});
    }
  }, [isAuthenticated]);

  // Fetch Trips
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

  // Select trip
  const handleSelectTrip = async (trip) => {
    if (!trip) return;
    try {
      const res = await tripAPI.getById(trip.id);
      setSelectedTrip(res.data.data);
    } catch (err) {
      if (err.response?.status === 403) {
        toast.error('Bạn chỉ có thể xem lịch trình của chính mình hoặc công khai');
      } else {
        setSelectedTrip(trip);
      }
    }
  };

  // Create Trip
  const handleCreateTrip = async (formData, resetCallback) => {
    if (!formData.title.trim()) return toast.error('Vui lòng nhập tên lịch trình');
    setCreating(true);
    try {
      const res = await tripAPI.create({
        ...formData,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined
      });
      const newTrip = res.data.data;
      setTrips(prev => [newTrip, ...prev]);
      setSelectedTrip(newTrip);
      setShowCreateModal(false);
      resetCallback();
      toast.success('🎉 Tạo lịch trình thành công!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi tạo lịch trình');
    } finally {
      setCreating(false);
    }
  };

  // Update Trip
  const handleUpdateTrip = async (editForm) => {
    if (!selectedTrip || !editForm.title.trim()) return;
    setUpdatingTrip(true);
    try {
      await tripAPI.update(selectedTrip.id, editForm);
      toast.success('Cập nhật lịch trình thành công!');
      setShowEditModal(false);
      const res = await tripAPI.getById(selectedTrip.id);
      setSelectedTrip(res.data.data);
      setTrips(prev => prev.map(t => t.id === selectedTrip.id ? res.data.data : t));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật');
    } finally {
      setUpdatingTrip(false);
    }
  };

  // Delete Trip
  const handleDeleteTrip = async () => {
    if (!selectedTrip) return;
    if (!confirm('Bạn có chắc chắn muốn xóa lịch trình này?')) return;
    try {
      await tripAPI.delete(selectedTrip.id);
      setTrips(prev => prev.filter(t => t.id !== selectedTrip.id));
      setSelectedTrip(null);
      toast.success('Đã xóa lịch trình');
    } catch {
      toast.error('Không thể xóa lịch trình');
    }
  };

  // Add Day
  const handleAddDay = async () => {
    if (!selectedTrip) return;
    const currentDays = selectedTrip.days?.length || 0;
    setAddingDay(true);
    try {
      await tripAPI.addDay(selectedTrip.id, {});
      toast.success(`🎉 Đã thêm Ngày ${currentDays + 1}!`);
      const refreshed = await tripAPI.getById(selectedTrip.id);
      setSelectedTrip(refreshed.data.data);
      setTrips(prev => prev.map(t => t.id === selectedTrip.id ? refreshed.data.data : t));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm ngày');
    } finally {
      setAddingDay(false);
    }
  };

  // Delete Day
  const handleDeleteDay = async (dayId, dayNumber) => {
    if (!confirm(`Xóa Ngày ${dayNumber} sẽ dịch chuyển các ngày phía sau. Bạn chắc chắn chứ?`)) return;
    try {
      await tripAPI.deleteDay(selectedTrip.id, dayId);
      toast.success(`Đã xóa Ngày ${dayNumber}!`);
      const refreshed = await tripAPI.getById(selectedTrip.id);
      setSelectedTrip(refreshed.data.data);
      setTrips(prev => prev.map(t => t.id === selectedTrip.id ? refreshed.data.data : t));
    } catch {
      toast.error('Không thể xóa ngày');
    }
  };

  // Update Day Note
  const handleUpdateDayNote = async (dayId, note) => {
    try {
      await tripAPI.updateDay(selectedTrip.id, dayId, { note });
      toast.success('Đã cập nhật ghi chú ngày!');
      const refreshed = await tripAPI.getById(selectedTrip.id);
      setSelectedTrip(refreshed.data.data);
    } catch {
      toast.error('Không thể cập nhật ngày');
    }
  };

  // Add Place to Day
  const handleAddPlace = async (payload, resetCallback) => {
    if (!activeDayForAdd) return;
    setAddingPlace(true);
    try {
      const res = await tripAPI.addPlace(selectedTrip.id, activeDayForAdd.id, payload);
      const newPlace = res.data.data;
      setSelectedTrip(prev => ({
        ...prev,
        days: prev.days.map(d =>
          d.id === activeDayForAdd.id
            ? { ...d, places: [...(d.places || []), newPlace] }
            : d
        )
      }));
      toast.success('Đã thêm địa điểm vào ngày!');
      setActiveDayForAdd(null);
      resetCallback();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm địa điểm');
    } finally {
      setAddingPlace(false);
    }
  };

  // Start Edit Activity
  const handleOpenEditActivity = (dayId, activity) => {
    setActiveDayIdForActivityEdit(dayId);
    setActiveActivityForEdit(activity);
  };

  // Save Edit Activity
  const handleSaveActivity = async (payload) => {
    if (!selectedTrip || !activeDayIdForActivityEdit || !activeActivityForEdit) return;
    setSavingActivity(true);
    try {
      await tripAPI.updatePlace(selectedTrip.id, activeDayIdForActivityEdit, activeActivityForEdit.id, payload);
      setSelectedTrip(prev => ({
        ...prev,
        days: prev.days.map(d =>
          d.id === activeDayIdForActivityEdit
            ? {
                ...d,
                places: d.places.map(p =>
                  p.id === activeActivityForEdit.id ? { ...p, ...payload } : p
                )
              }
            : d
        )
      }));
      toast.success('Đã cập nhật hoạt động!');
      setActiveActivityForEdit(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật');
    } finally {
      setSavingActivity(false);
    }
  };

  // Delete Activity
  const handleDeleteActivity = async (dayId, activityId) => {
    if (!confirm('Xóa địa điểm này khỏi lịch trình?')) return;
    try {
      await tripAPI.deletePlace(selectedTrip.id, dayId, activityId);
      setSelectedTrip(prev => ({
        ...prev,
        days: prev.days.map(d =>
          d.id === dayId
            ? { ...d, places: d.places.filter(p => p.id !== activityId) }
            : d
        )
      }));
      toast.success('Đã xóa địa điểm!');
    } catch {
      toast.error('Không thể xóa địa điểm');
    }
  };

  if (loading) {
    return (
      <div className="pt-28 min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="pt-24 min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <TripSidebar
              trips={trips}
              selectedTripId={selectedTrip?.id}
              onSelectTrip={handleSelectTrip}
              onOpenCreate={() => setShowCreateModal(true)}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            <TripHeader
              trip={selectedTrip}
              isOwner={isOwner}
              onOpenEdit={() => setShowEditModal(true)}
              onDeleteTrip={handleDeleteTrip}
              onAddDay={handleAddDay}
              addingDay={addingDay}
              onOpenCreate={() => setShowCreateModal(true)}
            />

            {/* Days list */}
            {selectedTrip && (
              <div className="space-y-4">
                {(selectedTrip.days || []).map((day) => (
                  <TripDayCard
                    key={day.id}
                    day={day}
                    isOwner={isOwner}
                    onOpenAddPlace={(d) => setActiveDayForAdd(d)}
                    onUpdateDayNote={handleUpdateDayNote}
                    onDeleteDay={handleDeleteDay}
                    onEditActivity={(act) => handleOpenEditActivity(day.id, act)}
                    onDeleteActivity={handleDeleteActivity}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateTripModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTrip}
        loading={creating}
      />

      <EditTripModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        trip={selectedTrip}
        onSubmit={handleUpdateTrip}
        loading={updatingTrip}
      />

      <AddPlaceModal
        isOpen={!!activeDayForAdd}
        onClose={() => setActiveDayForAdd(null)}
        dayNumber={activeDayForAdd?.day_number}
        places={places}
        onAdd={handleAddPlace}
        loading={addingPlace}
      />

      <EditActivityModal
        isOpen={!!activeActivityForEdit}
        onClose={() => setActiveActivityForEdit(null)}
        activity={activeActivityForEdit}
        onSave={handleSaveActivity}
        loading={savingActivity}
      />
    </div>
  );
}
