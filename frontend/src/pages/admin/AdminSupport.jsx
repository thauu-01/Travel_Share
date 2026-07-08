import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { FiSend, FiMessageSquare, FiCpu, FiUser } from 'react-icons/fi';

export default function AdminSupport() {
  const [conversations, setConversations] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const chatBottomRef = useRef(null);

  useEffect(() => {
    fetchConversations();
    // Auto refresh conversation list every 15 seconds
    const interval = setInterval(fetchConversations, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedUserId) {
      fetchChatHistory(selectedUserId);
    }
  }, [selectedUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const res = await adminAPI.getSupportChats();
      setConversations(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchChatHistory = async (userId) => {
    setLoadingHistory(true);
    try {
      const res = await adminAPI.getChatHistory(userId);
      setMessages(res.data.data);
      // Refresh conversations list to update unread badge counts
      fetchConversations();
    } catch (err) {
      toast.error('Lỗi tải lịch sử chat');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId) return;

    const textToSend = newMessage.trim();
    setNewMessage('');

    try {
      const res = await adminAPI.sendAdminMessage(selectedUserId, { message: textToSend });
      setMessages(prev => [...prev, res.data.data]);
    } catch (err) {
      toast.error('Gửi tin nhắn thất bại');
    }
  };

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getSelectedUser = () => {
    return conversations.find(c => c.user?.id === selectedUserId)?.user;
  };

  return (
    <div className="animate-in" style={{
      background: 'white',
      borderRadius: 12,
      border: '1px solid #e2e8f0',
      display: 'flex',
      height: 'calc(100vh - 140px)',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      overflow: 'hidden'
    }}>
      {/* Conversations List Left Column */}
      <div style={{
        width: '300px',
        borderRight: '1px solid #e2e8f0',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 8, color: '#0f172a' }}>
          <FiMessageSquare />
          <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Hộp thư hỗ trợ</h3>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
              Chưa có cuộc hội thoại nào
            </div>
          ) : conversations.map(c => {
            const active = c.user?.id === selectedUserId;
            return (
              <div
                key={c.user?.id}
                onClick={() => setSelectedUserId(c.user?.id)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  backgroundColor: active ? '#e0e7ff' : 'transparent',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12
                }}
              >
                <div className="avatar" style={{ width: 36, height: 36, flexShrink: 0 }}>
                  {c.user?.avatar_url ? <img src={c.user.avatar_url} alt="" /> : c.user?.full_name?.[0].toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.user?.full_name}
                    </div>
                    {c.unreadCount > 0 && (
                      <span style={{ backgroundColor: '#dc2626', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: 10, fontWeight: 'bold' }}>
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                    {c.lastMessage?.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Support Chat Screen Right Column */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' }}>
        {selectedUserId ? (
          <>
            {/* Header info */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="avatar" style={{ width: 32, height: 32 }}>
                {getSelectedUser()?.avatar_url ? <img src={getSelectedUser()?.avatar_url} alt="" /> : getSelectedUser()?.full_name?.[0].toUpperCase()}
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>{getSelectedUser()?.full_name}</strong>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{getSelectedUser()?.email}</div>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loadingHistory ? (
                <div style={{ textAlign: 'center', color: '#64748b', padding: 20 }}>Đang tải lịch sử...</div>
              ) : (
                messages.map(m => {
                  const isAdmin = m.sender_type === 'admin';
                  const isAI = m.sender_type === 'ai';
                  return (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        justifyContent: isAdmin ? 'flex-end' : 'flex-start',
                        width: '100%'
                      }}
                    >
                      <div style={{
                        maxWidth: '70%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        lineHeight: 1.4,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        backgroundColor: isAdmin ? '#6366f1' : isAI ? '#ecfdf5' : '#ffffff',
                        color: isAdmin ? '#ffffff' : '#1e293b',
                        border: isAdmin ? 'none' : isAI ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                        position: 'relative'
                      }}>
                        {/* Header badge tag for AI and Admin */}
                        {isAI && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: '0.65rem', fontWeight: 'bold', color: '#059669', marginBottom: 4 }}>
                            <FiCpu /> Hỗ trợ AI tự động
                          </div>
                        )}
                        {isAdmin && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: '0.65rem', fontWeight: 'bold', color: '#e0e7ff', marginBottom: 4 }}>
                            <FiUser /> Admin trả lời
                          </div>
                        )}
                        <div>{m.message}</div>
                        <div style={{ fontSize: '0.65rem', color: isAdmin ? '#c7d2fe' : '#94a3b8', textAlign: 'right', marginTop: 4 }}>
                          {new Date(m.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Support Message form footer */}
            <form onSubmit={handleSend} style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
              <input
                type="text"
                className="form-input"
                placeholder="Nhập nội dung phản hồi tới khách hàng..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                style={{ flex: 1, marginBottom: 0 }}
              />
              <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 16px' }}>
                <FiSend />
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <FiMessageSquare size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
            Chọn một cuộc hội thoại từ danh sách để bắt đầu tư vấn hỗ trợ
          </div>
        )}
      </div>
    </div>
  );
}
