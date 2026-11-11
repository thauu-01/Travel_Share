import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiCheck, FiX, FiCalendar } from 'react-icons/fi';
import { TripActivityItem } from './TripActivityItem';
import { Button } from '../common/Button';

export function TripDayCard({
  day,
  isOwner,
  onOpenAddPlace,
  onUpdateDayNote,
  onDeleteDay,
  onEditActivity,
  onDeleteActivity
}) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(day.note || '');

  const handleSaveNote = () => {
    onUpdateDayNote(day.id, noteText);
    setIsEditingNote(false);
  };

  const handleCancelNote = () => {
    setNoteText(day.note || '');
    setIsEditingNote(false);
  };

  const places = day.places || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
      {/* Day Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1 rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-sm shadow-blue-500/20">
            Ngày {day.day_number}
          </div>
          {day.date && (
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
              <FiCalendar size={13} className="text-slate-400" />
              {new Date(day.date).toLocaleDateString('vi-VN')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => onOpenAddPlace(day)}
                className="px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <FiPlus size={14} /> Thêm điểm đến
              </button>
              <button
                type="button"
                onClick={() => onDeleteDay(day.id, day.day_number)}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                title={`Xóa Ngày ${day.day_number}`}
              >
                <FiTrash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Day Note / Mood */}
      <div>
        {isEditingNote ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Chủ đề / Ghi chú ngày (vd: Khám phá phố cổ, tắm biển)..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-blue-300 text-xs bg-white outline-none focus:ring-1 focus:ring-blue-500"
              autoFocus
            />
            <button
              type="button"
              onClick={handleSaveNote}
              className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
              title="Lưu ghi chú"
            >
              <FiCheck size={14} />
            </button>
            <button
              type="button"
              onClick={handleCancelNote}
              className="p-1.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 cursor-pointer"
              title="Hủy"
            >
              <FiX size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50/70 px-3 py-2 rounded-xl border border-slate-100">
            <span className="italic">
              {day.note ? `💡 ${day.note}` : 'Chưa có ghi chú cho ngày này.'}
            </span>
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsEditingNote(true)}
                className="text-slate-400 hover:text-blue-600 ml-2 cursor-pointer"
                title="Sửa ghi chú ngày"
              >
                <FiEdit2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Activities / Places list */}
      <div className="space-y-2.5">
        {places.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/40">
            <p className="text-xs text-slate-400">Chưa có địa điểm nào trong ngày này</p>
            {isOwner && (
              <button
                type="button"
                onClick={() => onOpenAddPlace(day)}
                className="mt-2 text-xs font-semibold text-blue-600 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <FiPlus size={13} /> Thêm điểm đến đầu tiên
              </button>
            )}
          </div>
        ) : (
          places.map((placeItem, idx) => (
            <TripActivityItem
              key={placeItem.id}
              item={placeItem}
              index={idx}
              isOwner={isOwner}
              onEdit={onEditActivity}
              onDelete={(activityId) => onDeleteActivity(day.id, activityId)}
            />
          ))
        )}
      </div>
    </div>
  );
}
