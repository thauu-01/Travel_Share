import { useState } from 'react';
import { useSelector } from 'react-redux';
import { tripAPI, paymentAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiX, FiZap, FiMapPin, FiCalendar, FiDollarSign, FiHeart, FiLock, FiStar } from 'react-icons/fi';

const PROVINCES = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hội An', 'Huế', 'Đà Lạt', 'Nha Trang',
  'Phú Quốc', 'Sapa', 'Hạ Long', 'Ninh Bình', 'Cần Thơ', 'Vũng Tàu', 'Mũi Né',
  'Quảng Bình', 'Quy Nhơn', 'Côn Đảo', 'Bắc Hà', 'Mù Cang Chải', 'Tam Cốc'
];

const STYLES = [
  { value: 'tổng hợp', label: '🌏 Tổng hợp', desc: 'Kết hợp nhiều trải nghiệm' },
  { value: 'nghỉ dưỡng', label: '🏖️ Nghỉ dưỡng', desc: 'Thư giãn, spa, resort' },
  { value: 'phượt khám phá', label: '🧗 Phượt', desc: 'Trekking, hiking, hoang dã' },
  { value: 'ẩm thực', label: '🍜 Ẩm thực', desc: 'Đặc sản địa phương' },
  { value: 'văn hóa lịch sử', label: '🏛️ Văn hóa', desc: 'Di tích, bảo tàng, lễ hội' },
  { value: 'gia đình', label: '👨‍👩‍👧 Gia đình', desc: 'Phù hợp cho cả nhà' },
];

const BUDGETS = [
  { value: 'tiết kiệm (dưới 2 triệu)', label: '💰 Tiết kiệm', desc: 'Dưới 2 triệu/người/ngày' },
  { value: 'trung bình (2-5 triệu)', label: '💳 Trung bình', desc: '2-5 triệu/người/ngày' },
  { value: 'cao cấp (trên 5 triệu)', label: '💎 Cao cấp', desc: 'Trên 5 triệu/người/ngày' },
];

export default function AITripGeneratorModal({ onClose, onTripCreated }) {
  const { user } = useSelector(s => s.auth);
  const aiCredits = user?.ai_credits ?? 0;
  const isVIP = user?.is_vip ?? false;
  const hasCredits = isVIP || aiCredits > 0;

  const [form, setForm] = useState({
    province: '',
    total_days: 3,
    budget: 'trung bình (2-5 triệu)',
    style: 'tổng hợp'
  });
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const handleGenerate = async () => {
    if (!form.province) return toast.error('Vui lòng chọn địa điểm');
    setLoading(true);
    try {
      const res = await tripAPI.generateAI(form);
      toast.success(res.data.message || 'Tạo lịch trình thành công!');
      onTripCreated?.(res.data.data, res.data.ai_credits_remaining);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra';
      if (err.response?.data?.need_purchase) {
        toast.error('Hết lượt AI. Vui lòng mua thêm gói VIP.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    setPurchaseLoading(true);
    try {
      const res = await paymentAPI.createPaymentUrl('ai_5credits');
      const { paymentUrl } = res.data.data;
      window.location.href = paymentUrl; // Redirect sang VNPay
    } catch (err) {
      toast.error('Không thể tạo link thanh toán');
      setPurchaseLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
          border: '1px solid rgba(255,255,255,0.12)'
        }}
      >
        {/* Header */}
        <div className="relative px-6 pt-7 pb-5"
          style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(59,130,246,0.2))' }}
        >
          <button onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all border-none bg-transparent cursor-pointer"
          >
            <FiX size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)' }}
            >
              <FiZap size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">✨ AI Tạo Lịch Trình VIP</h2>
              <p className="text-white/60 text-xs mt-0.5">Groq Compound Mini · Địa điểm thực tế</p>
            </div>
          </div>

          {/* Credit Badge */}
          <div className="mt-4 flex items-center gap-2">
            {isVIP ? (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: 'white' }}
              >
                <FiStar size={11} /> VIP Không giới hạn
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: aiCredits > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                  color: aiCredits > 0 ? '#10b981' : '#ef4444',
                  border: `1px solid ${aiCredits > 0 ? 'rgba(16,185,129,0.4)' : 'rgba(239,68,68,0.4)'}`
                }}
              >
                <FiZap size={11} /> {aiCredits} lượt còn lại
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">

          {/* Province */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">
              <FiMapPin size={11} /> Địa điểm
            </label>
            <div className="relative">
              <select
                value={form.province}
                onChange={e => setForm(f => ({ ...f, province: e.target.value }))}
                className="w-full appearance-none px-4 py-3 rounded-xl text-sm font-semibold border-none outline-none cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}
              >
                <option value="" style={{ background: '#1a1a2e' }}>-- Chọn tỉnh thành --</option>
                {PROVINCES.map(p => (
                  <option key={p} value={p} style={{ background: '#1a1a2e' }}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Days */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">
              <FiCalendar size={11} /> Số ngày: <span className="text-violet-400 ml-1">{form.total_days} ngày</span>
            </label>
            <input
              type="range" min={1} max={7}
              value={form.total_days}
              onChange={e => setForm(f => ({ ...f, total_days: parseInt(e.target.value) }))}
              className="w-full cursor-pointer accent-violet-500"
            />
            <div className="flex justify-between text-xs text-white/30 mt-1">
              <span>1 ngày</span><span>7 ngày</span>
            </div>
          </div>

          {/* Style */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">
              <FiHeart size={11} /> Phong cách
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STYLES.map(s => (
                <button
                  key={s.value}
                  onClick={() => setForm(f => ({ ...f, style: s.value }))}
                  className="px-3 py-2.5 rounded-xl text-left transition-all border cursor-pointer"
                  style={{
                    background: form.style === s.value ? 'rgba(139,92,246,0.3)' : 'rgba(255,255,255,0.05)',
                    borderColor: form.style === s.value ? 'rgba(139,92,246,0.6)' : 'rgba(255,255,255,0.1)',
                    color: 'white'
                  }}
                >
                  <div className="text-xs font-semibold">{s.label}</div>
                  <div className="text-xs text-white/40 mt-0.5">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-white/70 mb-2 uppercase tracking-wide">
              <FiDollarSign size={11} /> Ngân sách
            </label>
            <div className="flex gap-2 flex-wrap">
              {BUDGETS.map(b => (
                <button
                  key={b.value}
                  onClick={() => setForm(f => ({ ...f, budget: b.value }))}
                  className="px-3 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer"
                  style={{
                    background: form.budget === b.value ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.05)',
                    borderColor: form.budget === b.value ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.1)',
                    color: 'white'
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 space-y-3">
          {hasCredits ? (
            <button
              onClick={handleGenerate}
              disabled={loading || !form.province}
              className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{
                background: loading ? 'rgba(139,92,246,0.5)' : 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                color: 'white',
                boxShadow: '0 0 20px rgba(139,92,246,0.4)'
              }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  AI đang tạo lịch trình...
                </>
              ) : (
                <>
                  <FiZap size={15} />
                  ✨ Tạo Lịch Trình AI {!isVIP && `(Còn ${aiCredits} lượt)`}
                </>
              )}
            </button>
          ) : (
            <>
              <div className="rounded-2xl p-4 text-center"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                <div className="text-2xl mb-1">😢</div>
                <p className="text-sm font-semibold text-red-400">Bạn đã hết lượt AI Credits</p>
                <p className="text-xs text-white/40 mt-1">Mua thêm để tiếp tục tạo lịch trình tự động</p>
              </div>
              <button
                onClick={handlePurchase}
                disabled={purchaseLoading}
                className="w-full py-3.5 rounded-2xl font-bold text-sm transition-all border-none cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #ef4444)',
                  color: 'white',
                  boxShadow: '0 0 20px rgba(245,158,11,0.3)'
                }}
              >
                {purchaseLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiLock size={14} />
                    💳 Mở khóa 5 lượt VIP — 50.000 VNĐ
                  </>
                )}
              </button>
              <p className="text-center text-xs text-white/30">
                Thanh toán qua VNPay · ATM / QR Code / Internet Banking
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
