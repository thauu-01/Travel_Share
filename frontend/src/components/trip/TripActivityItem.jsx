import React from 'react';
import { FiMapPin, FiEdit2, FiTrash2 } from 'react-icons/fi';

export function TripActivityItem({ item, index, isOwner, onEdit, onDelete }) {
  const placeName = item.custom_place_name || item.place?.name || 'Điểm đến không tên';
  const province = item.custom_province || item.place?.province || item.place?.address || '';
  const imageUrl = item.place?.images?.[0] || item.place?.cover_image || null;

  return (
    <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-100 hover:border-blue-200 bg-white hover:shadow-sm transition-all group">
      {/* Index indicator / Marker */}
      <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100 mt-0.5">
        {index + 1}
      </div>

      {/* Place thumbnail if available */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt={placeName}
          className="w-14 h-14 rounded-lg object-cover shrink-0 border border-slate-100"
        />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-slate-800 text-sm truncate">{placeName}</h4>
          {item.place && (
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
              Hệ thống
            </span>
          )}
        </div>

        {province && (
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
            <FiMapPin size={12} className="text-blue-500 shrink-0" />
            <span className="truncate">{province}</span>
          </p>
        )}

        {item.note && (
          <p className="text-xs text-slate-600 mt-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100/80">
            {item.note}
          </p>
        )}
      </div>

      {/* Owner controls */}
      {isOwner && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            title="Chỉnh sửa hoạt động"
          >
            <FiEdit2 size={13} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(item.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Xóa khỏi lịch trình"
          >
            <FiTrash2 size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
