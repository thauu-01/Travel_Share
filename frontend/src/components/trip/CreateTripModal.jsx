import React, { useState } from 'react';
import { FiEye, FiLock } from 'react-icons/fi';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

export function CreateTripModal({ isOpen, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    is_public: true
  });

  const calculatedDays = (() => {
    if (!form.start_date || !form.end_date) return null;
    const s = new Date(form.start_date);
    const e = new Date(form.end_date);
    if (e < s) return null;
    return Math.floor((e - s) / (1000 * 60 * 60 * 24)) + 1;
  })();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form, () => {
      setForm({ title: '', description: '', start_date: '', end_date: '', is_public: true });
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="✨ Tạo lịch trình mới"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {calculatedDays && (
          <div className="text-xs bg-blue-50 text-blue-700 font-bold px-3 py-1.5 rounded-xl text-center border border-blue-100">
            Dự kiến chuyến đi kéo dài {calculatedDays} ngày
          </div>
        )}

        <Input
          label="Tên lịch trình *"
          placeholder="Ví dụ: Du lịch Đà Nẵng - Hội An 4 ngày 3 đêm"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
            Mô tả ngắn
          </label>
          <textarea
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm resize-none"
            rows={2}
            placeholder="Ghi chú tổng quan về chuyến đi..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Ngày bắt đầu
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
              Ngày kết thúc
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 text-sm"
              value={form.end_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, is_public: !f.is_public }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              form.is_public ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            {form.is_public ? <><FiEye size={14} /> Công khai 🌐</> : <><FiLock size={14} /> Riêng tư 🔒</>}
          </button>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" variant="primary" size="sm" loading={loading}>
              Tạo lịch trình
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
