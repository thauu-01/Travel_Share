import React, { useState, useEffect, useRef } from 'react';
import { FiHeadphones, FiSend, FiX } from 'react-icons/fi';
import { io } from 'socket.io-client';
import { useAuthStore } from '../../store/useAuthStore';
import { chatAPI } from '../../services/api';

export function SupportChatWidget() {
  const { user, isAuthenticated } = useAuthStore();
  const showSupportButton = isAuthenticated && user?.role !== 'admin';

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, sender: 'admin', text: 'Xin chào! Mình là trợ lý AI TravelShare ✈️. Mình có thể hỗ trợ gì cho bạn?' }
  ]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [adminOnline, setAdminOnline] = useState(false);

  const chatEndRef = useRef(null);
  const chatSocketRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, isChatOpen, isLoading]);

  useEffect(() => {
    if (!isAuthenticated || !user || user.role === 'admin') return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    chatSocketRef.current = io(socketUrl);
    chatSocketRef.current.emit('join', user.id);

    chatSocketRef.current.on('new_admin_message', (msg) => {
      setMessages(prev => [...prev, {
        id: msg._id || msg.id || Date.now(),
        sender: 'admin',
        text: msg.message
      }]);
      setAdminOnline(true);
    });

    return () => {
      if (chatSocketRef.current) {
        chatSocketRef.current.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isChatOpen || !showSupportButton || !isAuthenticated) return;

    const fetchHistory = async () => {
      try {
        const res = await chatAPI.getHistory();
        const history = res?.data?.data || [];
        if (history.length > 0) {
          const mapped = history.map(item => ({
            id: item._id || `${item.sender_type}-${item.created_at}`,
            sender: item.sender_type === 'user' ? 'user' : 'admin',
            text: item.message
          }));
          setMessages(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch chat history', error);
      }
    };

    fetchHistory();
  }, [isChatOpen, showSupportButton, isAuthenticated]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isLoading) return;

    setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text }]);
    setDraft('');
    setIsLoading(true);

    try {
      const res = await chatAPI.sendMessage({ message: text });
      const aiMessage = res?.data?.data?.aiMessage;
      if (aiMessage) {
        setMessages(prev => [...prev, {
          id: aiMessage._id || `${aiMessage.sender_type}-${aiMessage.created_at}`,
          sender: 'admin',
          text: aiMessage.message
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'admin',
        text: 'Xin lỗi, hệ thống hỗ trợ đang gặp sự cố. Vui lòng thử lại sau.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!showSupportButton) return null;

  return (
    <>
      {isChatOpen && (
        <div className="fixed right-5 bottom-20 w-[360px] h-[480px] bg-white rounded-2xl shadow-2xl flex flex-col z-[1000] overflow-hidden border border-slate-200 animate-scale-up">
          <div className="px-4 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 text-white flex items-center justify-between">
            <div>
              <div className="font-bold">Hỗ trợ TravelShare</div>
              <div className="text-xs opacity-90 flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${adminOnline ? 'bg-green-400' : 'bg-white/40'}`}></span>
                {adminOnline ? 'Admin đang online 🟢' : 'Trợ lý AI sẵn sàng hỗ trợ bạn'}
              </div>
            </div>
            <button
              onClick={() => setIsChatOpen(false)}
              aria-label="Đóng chat"
              className="bg-white/20 border-none text-white rounded-full w-8 h-8 cursor-pointer flex items-center justify-center hover:bg-white/30 transition-colors"
            >
              <FiX size={16} />
            </button>
          </div>

          <div className="flex-1 p-3.5 overflow-y-auto bg-slate-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex mb-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] px-3 py-2.5 rounded-xl text-sm shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-900 border border-slate-200'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="px-2.5 py-2.5 border-t border-slate-200 flex gap-2 bg-white">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Nhập tin nhắn..."
              className="flex-1 border border-slate-300 rounded-full px-3.5 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={isLoading}
              aria-label="Gửi tin nhắn"
              className={`${isLoading ? 'bg-slate-400' : 'bg-gradient-to-br from-blue-600 to-violet-600'} text-white border-none rounded-full w-10 h-10 cursor-pointer flex items-center justify-center transition-all hover:shadow-lg`}
            >
              <FiSend size={16} />
            </button>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsChatOpen(prev => !prev)}
        aria-label={isChatOpen ? 'Đóng chat hỗ trợ' : 'Mở chat hỗ trợ'}
        title={isChatOpen ? 'Đóng chat hỗ trợ' : 'Yêu cầu hỗ trợ từ admin'}
        className="fixed right-5 bottom-5 w-[54px] h-[54px] rounded-full border-none bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-[0_12px_28px_rgba(37,99,235,0.35)] cursor-pointer z-[1000] flex items-center justify-center hover:scale-105 transition-transform"
      >
        {isChatOpen ? <FiX size={22} /> : <FiHeadphones size={22} />}
      </button>
    </>
  );
}

export default SupportChatWidget;
