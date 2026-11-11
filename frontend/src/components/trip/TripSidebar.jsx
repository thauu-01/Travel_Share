import React from 'react';
import { FiCalendar, FiMapPin, FiPlus, FiLock, FiEye } from 'react-icons/fi';

export function TripSidebar({
  trips = [],
  selectedTripId,
  onSelectTrip,
  onOpenCreate
}) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-slate-900 text-sm">Lịch trình của tôi</h3>
          <p className="text-[11px] text-slate-500">{trips.length} chuyến đi đã lưu</p>
        </div>
        <button
          type="button"
          onClick={onOpenCreate}
          className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors cursor-pointer"
          title="Tạo lịch trình mới"
        >
          <FiPlus size={16} />
        </button>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
        {trips.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Chưa có lịch trình nào. Bấm (+) để bắt đầu lên kế hoạch!
          </div>
        ) : (
          trips.map((t) => {
            const isSelected = String(t.id) === String(selectedTripId);
            return (
              <div
                key={t.id}
                onClick={() => onSelectTrip(t)}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-300 shadow-sm'
                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                    {t.title}
                  </h4>
                  {t.is_public ? (
                    <FiEye size={12} className="text-slate-400 shrink-0 mt-0.5" title="Công khai" />
                  ) : (
                    <FiLock size={12} className="text-amber-500 shrink-0 mt-0.5" title="Riêng tư" />
                  )}
                </div>

                <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <FiCalendar size={11} className="text-slate-400" />
                    {t.days?.length || t.total_days || 1} ngày
                  </span>
                  {t.start_date && (
                    <span>• {new Date(t.start_date).toLocaleDateString('vi-VN')}</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
