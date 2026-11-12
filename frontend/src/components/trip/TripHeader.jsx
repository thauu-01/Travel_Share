import React from 'react';
import { FiCalendar, FiEdit2, FiTrash2, FiPlus, FiZap, FiEye, FiLock } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export function TripHeader({
  trip,
  isOwner,
  onOpenEdit,
  onDeleteTrip,
  onAddDay,
  addingDay,
  onOpenCreate
}) {
  const navigate = useNavigate();

  if (!trip) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-sm text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Chưa chọn lịch trình nào</h2>
        <p className="text-slate-500 text-sm mb-4">Hãy tạo một kế hoạch du lịch mới hoặc chọn lịch trình từ danh sách</p>
        <Button variant="primary" onClick={onOpenCreate} icon={FiPlus}>
          Tạo lịch trình ngay
        </Button>
      </div>
    );
  }

  const startDateFormatted = trip.start_date ? new Date(trip.start_date).toLocaleDateString('vi-VN') : null;
  const endDateFormatted = trip.end_date ? new Date(trip.end_date).toLocaleDateString('vi-VN') : null;
  const dateRange = startDateFormatted ? (endDateFormatted ? `${startDateFormatted} → ${endDateFormatted}` : startDateFormatted) : 'Chưa định ngày';

  return (
    <div className="bg-gradient-to-br from-white to-blue-50/40 rounded-3xl p-6 sm:p-8 border border-blue-100/80 shadow-sm space-y-4">
      {/* Top action row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge variant={trip.is_public ? 'success' : 'neutral'}>
            {trip.is_public ? <><FiEye size={12} className="mr-1 inline" /> Công khai</> : <><FiLock size={12} className="mr-1 inline" /> Riêng tư</>}
          </Badge>
          <span className="text-xs font-bold text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-full">
            {trip.days?.length || 0} / {trip.total_days || trip.days?.length || 1} ngày
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/trips/ai')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm hover:from-amber-600 hover:to-orange-600 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FiZap size={14} /> AI Gợi ý lịch trình
          </button>

          {isOwner && (
            <>
              <button
                type="button"
                onClick={onOpenEdit}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <FiEdit2 size={13} /> Sửa
              </button>
              <button
                type="button"
                onClick={onDeleteTrip}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-red-200 text-red-600 hover:bg-red-50 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <FiTrash2 size={13} /> Xóa
              </button>
            </>
          )}

          <Button
            size="sm"
            variant="primary"
            onClick={onOpenCreate}
            icon={FiPlus}
          >
            Tạo mới
          </Button>
        </div>
      </div>

      {/* Title & Info */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
          {trip.title}
        </h1>
        {trip.description && (
          <p className="text-sm text-slate-600 mt-2 line-clamp-3">
            {trip.description}
          </p>
        )}
      </div>

      {/* Date & Add day action */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/60">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <FiCalendar className="text-blue-500" size={15} />
          <span>Thời gian: <strong className="text-slate-800">{dateRange}</strong></span>
        </div>

        {isOwner && (
          <Button
            size="sm"
            variant="outline"
            loading={addingDay}
            onClick={onAddDay}
            icon={FiPlus}
          >
            Thêm ngày tiếp theo
          </Button>
        )}
      </div>
    </div>
  );
}
