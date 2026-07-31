import { useState } from 'react';
import { adminAPI } from '../../../services/api';
import toast from 'react-hot-toast';
import { FiSend, FiBell } from 'react-icons/fi';

export default function AdminNotifications() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      return toast.error('Vui lòng điền đủ tiêu đề và nội dung thông báo');
    }

    if (!confirm('Bạn có chắc chắn muốn phát sóng (broadcast) thông báo này tới toàn bộ thành viên đang hoạt động trên hệ thống? Thao tác này sẽ gửi thông báo real-time ngay lập tức.')) return;

    setSending(true);
    try {
      await adminAPI.broadcastNotification({
        title: title.trim(),
        message: message.trim()
      });
      toast.success('Đã phát sóng thông báo thành công!');
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

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tiêu đề thông báo</label>
            <input
              type="text"
              placeholder="Ví dụ: Bảo trì hệ thống hoặc Sự kiện mới..."
              className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nội dung thông báo chi tiết</label>
            <textarea
              className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-bold shadow-sm shadow-indigo-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <FiSend size={18} /> {sending ? 'Đang phát sóng...' : 'Gửi thông báo tới toàn bộ hệ thống'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
