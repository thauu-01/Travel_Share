import { useState, useEffect, useRef } from 'react';
import { adminAPI } from '../../../services/api';
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
    <div className="animate-in bg-white rounded-2xl border border-indigo-100 flex shadow-sm overflow-hidden h-[calc(100vh-140px)]">
      {/* Conversations List Left Column */}
      <div className="w-[300px] border-r border-indigo-100 flex flex-col bg-slate-50 shrink-0">
        <div className="p-4 border-b border-indigo-50 flex items-center gap-2 text-slate-800 bg-white">
          <FiMessageSquare className="text-indigo-600" />
          <h3 className="m-0 text-sm font-bold">Hộp thư hỗ trợ</h3>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              Chưa có cuộc hội thoại nào
            </div>
          ) : conversations.map(c => {
            const active = c.user?.id === selectedUserId;
            return (
              <div
                key={c.user?.id}
                onClick={() => setSelectedUserId(c.user?.id)}
                className={`p-3 border-b border-white cursor-pointer flex items-center gap-3 transition-all ${
                  active ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'hover:bg-slate-100 border-l-4 border-l-transparent'
                }`}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 border border-white shadow-sm">
                  {c.user?.avatar_url ? <img src={c.user.avatar_url} alt="" className="w-full h-full object-cover" /> : c.user?.full_name?.[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <div className="font-semibold text-sm text-slate-900 truncate">
                      {c.user?.full_name}
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-2">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">
                    {c.lastMessage?.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Support Chat Screen Right Column */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        {selectedUserId ? (
          <>
            {/* Header info */}
            <div className="px-5 py-3 border-b border-indigo-50 flex items-center gap-3 bg-white">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm border border-white">
                {getSelectedUser()?.avatar_url ? <img src={getSelectedUser()?.avatar_url} alt="" className="w-full h-full object-cover" /> : getSelectedUser()?.full_name?.[0].toUpperCase()}
              </div>
              <div className="min-w-0">
                <strong className="text-sm text-slate-900 block truncate">{getSelectedUser()?.full_name}</strong>
                <div className="text-xs text-slate-500 truncate">{getSelectedUser()?.email}</div>
              </div>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-1 p-5 overflow-y-auto bg-slate-50 flex flex-col gap-3">
              {loadingHistory ? (
                <div className="text-center text-slate-500 p-5 text-sm">Đang tải lịch sử...</div>
              ) : (
                messages.map(m => {
                  const isAdmin = m.sender_type === 'admin';
                  const isAI = m.sender_type === 'ai';
                  return (
                    <div
                      key={m.id}
                      className={`flex w-full ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        isAdmin 
                          ? 'bg-blue-600 text-white rounded-br-sm' 
                          : isAI 
                            ? 'bg-emerald-50 text-slate-800 border border-emerald-100 rounded-bl-sm' 
                            : 'bg-white text-slate-800 border border-slate-100 rounded-bl-sm'
                      }`}>
                        {/* Header badge tag for AI and Admin */}
                        {isAI && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mb-1">
                            <FiCpu size={12} /> Hỗ trợ AI tự động
                          </div>
                        )}
                        {isAdmin && (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-200 mb-1">
                            <FiUser size={12} /> Admin trả lời
                          </div>
                        )}
                        <div className="whitespace-pre-wrap">{m.message}</div>
                        <div className={`text-[10px] text-right mt-1 ${isAdmin ? 'text-blue-200' : 'text-slate-400'}`}>
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
            <form onSubmit={handleSend} className="p-4 border-t border-indigo-50 flex gap-3 bg-white">
              <input
                type="text"
                className="flex-1 px-4 py-2 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Nhập nội dung phản hồi tới khách hàng..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
              />
              <button type="submit" className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-sm shadow-blue-600/20">
                <FiSend size={18} />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <FiMessageSquare size={48} className="opacity-30 mb-3" />
            <span className="text-sm">Chọn một cuộc hội thoại từ danh sách để bắt đầu tư vấn</span>
          </div>
        )}
      </div>
    </div>
  );
}
