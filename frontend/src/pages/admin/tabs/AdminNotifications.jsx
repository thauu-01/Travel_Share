import { useState } from 'react';
import { createPortal } from 'react-dom';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { FiSend, FiBell, FiAlertCircle, FiX } from 'react-icons/fi';

export default function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      return toast.error('Vui lòng điền đủ tiêu đề và nội dung thông báo');
    }
    setShowConfirmModal(true);
  };

  const handleConfirmBroadcast = async () => {
    setShowConfirmModal(false);
    setSending(true);
    try {
      await adminAPI.broadcastNotification({
        title: title.trim(),
        message: message.trim()
      });
      toast.success('🎉 Đã phát sóng thông báo thành công!');
      setTitle('');
      setMessage('');
    } catch (err) {
      toast.error('Lỗi phát sóng thông báo hệ thống');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-in" style={{ width: '100%' }}>
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6 text-indigo-600">
          <FiBell size={24} />
          <h3 className="m-0 text-lg font-bold text-slate-800">Soạn thông báo phát sóng</h3>
        </div>

        <form onSubmit={handleOpenConfirm} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tiêu đề thông báo</label>
            <input
              type="text"
              placeholder="Ví dụ: Bảo trì hệ thống hoặc Sự kiện mới..."
              className="w-full px-4 py-3 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nội dung thông báo chi tiết</label>
            <textarea
              className="w-full px-4 py-3 text-sm font-medium text-slate-900 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              rows={5}
              placeholder="Nhập nội dung thông báo gửi tới người dùng..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-sm shadow-indigo-600/20 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              <FiSend size={18} /> {sending ? 'Đang phát sóng...' : 'Gửi thông báo tới toàn bộ hệ thống'}
            </button>
          </div>
        </form>
      </div>

      {/* Custom Modern Confirm Modal — Rendered via Portal to document.body */}
      {showConfirmModal && createPortal(
        <div className="fixed inset-0 bg-slate-900/60 z-[9999] flex items-center justify-center p-4 animate-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-scale-in">
            <div className="flex justify-between items-center mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg font-bold">
                📢
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
              >
                <FiX size={18} />
              </button>
            </div>

            <h3 className="text-xl font-extrabold text-slate-900 mb-2">
              Xác nhận phát sóng thông báo
            </h3>
            <p className="text-slate-600 text-sm mb-5 leading-relaxed">
              Bạn có chắc chắn muốn phát sóng (broadcast) thông báo này tới toàn bộ thành viên đang hoạt động trên hệ thống? Thao tác này sẽ gửi thông báo real-time ngay lập tức.
            </p>

            {/* Preview Box */}
            <div className="bg-indigo-50/60 rounded-2xl p-4 mb-6 border border-indigo-100 text-left">
              <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">
                📌 Tiêu đề: {title}
              </div>
              <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap line-clamp-3">
                {message}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-colors cursor-pointer bg-white"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmBroadcast}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-500/25 border-none cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FiSend size={15} /> Đồng ý gửi
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
