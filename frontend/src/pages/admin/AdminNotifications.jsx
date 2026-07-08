import { useState } from 'react';
import { adminAPI } from '../../services/api';
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
    <div className="animate-in" style={{ maxWidth: '640px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>📢 Thông báo hệ thống (Broadcast)</h1>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>Gửi thông báo real-time và lưu trữ trong hộp thư của toàn bộ thành viên</p>
      </div>

      <div style={{ background: 'white', borderRadius: 12, padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, color: '#4f46e5' }}>
          <FiBell size={22} />
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Soạn thông báo phát sóng</h3>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Tiêu đề thông báo</label>
            <input
              type="text"
              placeholder="Ví dụ: Bảo trì hệ thống hoặc Sự kiện mới..."
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Message Content */}
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Nội dung thông báo chi tiết</label>
            <textarea
              className="form-textarea"
              rows={5}
              placeholder="Nhập nội dung thông báo gửi tới người dùng..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              required
            />
          </div>

          <div style={{ marginTop: '20px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={sending}
              style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <FiSend /> {sending ? 'Đang phát sóng...' : 'Gửi thông báo tới toàn bộ hệ thống'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
