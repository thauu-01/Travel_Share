import React, { useState, useEffect } from 'react';
import { FiEdit3 } from 'react-icons/fi';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export function EditActivityModal({ isOpen, onClose, activity, onSave, loading }) {
  const [name, setName] = useState('');
  const [province, setProvince] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (activity) {
      setName(activity.custom_place_name || activity.place?.name || '');
      setProvince(activity.custom_province || activity.place?.province || activity.place?.address || '');
      setNote(activity.note || '');
    }
  }, [activity]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      custom_place_name: !activity.place ? name : undefined,
      custom_province: province,
      note
    });
  };

  if (!activity) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <FiEdit3 className="text-blue-600" /> Sửa thông tin hoạt động
        </div>
      }
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!activity.place && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Tên địa điểm</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Khu vực / Tỉnh thành</label>
          <input
            type="text"
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Ghi chú chi tiết</label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú chi phí, hoạt động, thời gian..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-xs resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
}
