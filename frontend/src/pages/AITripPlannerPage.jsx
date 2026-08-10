import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { tripAPI, paymentAPI, authAPI } from '../services/api';
import { updateUser } from '../store/authSlice';
import toast from 'react-hot-toast';
import {
  FiZap, FiMapPin, FiCalendar, FiDollarSign, FiHeart, FiLock,
  FiStar, FiArrowLeft, FiCheck, FiMessageSquare, FiShield
} from 'react-icons/fi';

const POPULAR_DESTINATIONS = [
  { name: 'Đà Nẵng', image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=500&auto=format&fit=crop&q=80', desc: 'Thành phố đáng sống, bãi biển Mỹ Khê' },
  { name: 'Hội An', image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=500&auto=format&fit=crop&q=80', desc: 'Phố cổ đèn lồng, văn hóa ẩm thực' },
  { name: 'Đà Lạt', image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=80', desc: 'Thành phố ngàn hoa, không khí se lạnh' },
  { name: 'Phú Quốc', image: 'https://images.unsplash.com/photo-1540206395-68808572332f?w=500&auto=format&fit=crop&q=80', desc: 'Đảo ngọc, bãi Sao, ngắm hoàng hôn' },
  { name: 'Hạ Long', image: 'https://images.unsplash.com/photo-1528127269322-539801943592?w=500&auto=format&fit=crop&q=80', desc: 'Kỳ quan thiên nhiên thế giới' },
  { name: 'Sapa', image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=500&auto=format&fit=crop&q=80', desc: 'Ruộng bậc thang, đỉnh Fansipan' },
  { name: 'Nha Trang', image: 'https://images.unsplash.com/photo-1579621970795-87facc2f976d?w=500&auto=format&fit=crop&q=80', desc: 'Vịnh biển xanh, hòn Mun, VinWonders' },
  { name: 'Huế', image: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=500&auto=format&fit=crop&q=80', desc: 'Cố đô cổ kính, sông Hương núi Ngự' }
];

const ALL_PROVINCES = [
  'Hà Nội', 'Hồ Chí Minh', 'Đà Nẵng', 'Hội An', 'Huế', 'Đà Lạt', 'Nha Trang',
  'Phú Quốc', 'Sapa', 'Hạ Long', 'Ninh Bình', 'Cần Thơ', 'Vũng Tàu', 'Mũi Né',
  'Quảng Bình', 'Quy Nhơn', 'Côn Đảo', 'Bắc Hà', 'Mù Cang Chải', 'Tam Cốc'
];

const STYLES = [
  { value: 'tổng hợp', label: '🌏 Tổng hợp', desc: 'Kết hợp tham quan, ẩm thực & giải trí' },
  { value: 'nghỉ dưỡng', label: '🏖️ Nghỉ dưỡng', desc: 'Thư giãn, resort, spa & biển' },
  { value: 'phượt khám phá', label: '🧗 Phượt & Trekking', desc: 'Khám phá thiên nhiên, mạo hiểm' },
  { value: 'ẩm thực', label: '🍜 Ẩm thực & Cafe', desc: 'Săn món ngon, food tour địa phương' },
  { value: 'văn hóa lịch sử', label: '🏛️ Văn hóa & Di sản', desc: 'Bảo tàng, di tích, di sản thế giới' },
  { value: 'gia đình', label: '👨‍👩‍👧 Gia đình & Trẻ em', desc: 'Lịch trình nhẹ nhàng, phù hợp cả nhà' },
];

const BUDGETS = [
  { value: 'tiết kiệm (dưới 2 triệu)', label: '💰 Tiết kiệm', desc: 'Dưới 2.000.000 VNĐ / ngày' },
  { value: 'trung bình (2-5 triệu)', label: '💳 Trung bình', desc: '2.000.000 - 5.000.000 VNĐ / ngày' },
  { value: 'cao cấp (trên 5 triệu)', label: '💎 Cao cấp VIP', desc: 'Trên 5.000.000 VNĐ / ngày' },
];

export default function AITripPlannerPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(s => s.auth);

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để sử dụng tính năng AI');
      navigate('/login');
      return;
    }
    // Tự động đồng bộ thông tin mới nhất (Credits & VIP status) từ server
    authAPI.getMe()
      .then(res => {
        if (res.data?.data) {
          dispatch(updateUser(res.data.data));
        }
      })
      .catch(() => {});
  }, [isAuthenticated, navigate, dispatch]);

  const aiCredits = user?.ai_credits ?? 0;
  const isVIP = user?.is_vip ?? false;
  const hasCredits = isVIP || aiCredits > 0;

  const [form, setForm] = useState({
    province: '',
    total_days: 3,
    budget: 'trung bình (2-5 triệu)',
    style: 'tổng hợp',
    note: ''
  });
  const [loading, setLoading] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const handleSelectProvince = (pName) => {
    setForm(f => ({ ...f, province: pName }));
  };

  const handleGenerate = async () => {
    if (!form.province) return toast.error('Vui lòng chọn địa điểm du lịch');
    setLoading(true);
    try {
      const res = await tripAPI.generateAI(form);
      toast.success(res.data.message || '🎉 AI đã tạo lịch trình thành công!');
      const newTrip = res.data.data;
      navigate(`/trips?id=${newTrip._id || newTrip.id}`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi gọi AI';
      if (err.response?.data?.need_purchase) {
        toast.error('Bạn đã hết lượt AI. Vui lòng nâng cấp VIP.');
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
      window.location.href = paymentUrl;
    } catch (err) {
      toast.error('Không thể tạo liên kết thanh toán VNPay');
      setPurchaseLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 bg-gradient-to-br from-slate-50 via-sky-50/50 to-blue-50/40 text-slate-800">

      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/trips"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors no-underline"
          >
            <FiArrowLeft size={16} /> Quay lại danh sách lịch trình
          </Link>
        </div>

        {/* Hero Header Card matching SearchPage style */}
        <div className="relative rounded-3xl p-8 sm:p-12 overflow-hidden mb-8 bg-slate-900 shadow-2xl shadow-slate-900/30">
          {/* Nature background image like SearchPage */}
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000"
            style={{ backgroundImage: "url('/images/hero-nature-bg.jpg')" }}
          />
          {/* Dark gradient overlay like SearchPage for perfect readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/75 via-slate-900/65 to-slate-950/85 backdrop-blur-[2px]" />

          <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs font-bold mb-3 backdrop-blur-md shadow-sm">
                <FiZap size={13} className="text-amber-300" /> Sức Mạnh Groq AI Llama 3.3 70B
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight drop-shadow-md">
                ✨ Trợ Lý AI Tạo Lịch Trình Du Lịch
              </h1>
              <p className="text-slate-200 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed drop-shadow font-medium">
                Tự động lên kế hoạch du lịch thông minh từng ngày, phân bổ thời gian sáng/chiều/tối, gợi ý địa điểm thực tế phù hợp với kinh phí & phong cách của bạn.
              </p>
            </div>

            {/* Credit Badge */}
            <div className="flex-shrink-0">
              {isVIP ? (
                <div className="px-5 py-3 rounded-2xl bg-amber-400 text-slate-900 font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/30">
                  <FiStar size={16} /> Thành Viên VIP Un-limited
                </div>
              ) : (
                <div className="px-5 py-3 rounded-2xl bg-white/20 border border-white/30 text-white font-semibold text-sm flex items-center gap-2.5 backdrop-blur-md shadow-md">
                  <FiZap size={16} className="text-amber-300" />
                  <span>
                    Còn <strong className="text-base font-extrabold text-amber-300">{aiCredits}</strong> lượt sử dụng
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Form Container */}
        <div className="space-y-8">

          {/* STEP 1: DESTINATION */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md shadow-slate-200/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-extrabold text-sm">
                1
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FiMapPin className="text-blue-600" /> Chọn Địa Điểm Chuyến Đi
                </h3>
                <p className="text-xs text-slate-500">Chọn từ danh sách địa điểm nổi tiếng hoặc chọn tỉnh thành</p>
              </div>
            </div>

            {/* Grid of Popular Destinations */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-5">
              {POPULAR_DESTINATIONS.map(d => (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => handleSelectProvince(d.name)}
                  className={`relative rounded-2xl overflow-hidden h-36 border text-left transition-all cursor-pointer group ${form.province === d.name
                      ? 'border-blue-600 ring-4 ring-blue-500/20 scale-[1.02] shadow-lg shadow-blue-500/15'
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                >
                  <img
                    src={d.image}
                    alt={d.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

                  {form.province === d.name && (
                    <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg">
                      <FiCheck size={14} />
                    </div>
                  )}

                  <div className="absolute bottom-3 left-3 right-3">
                    <div className="font-bold text-white text-sm">{d.name}</div>
                    <div className="text-[11px] text-slate-200 line-clamp-1 mt-0.5 opacity-90">{d.desc}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Dropdown */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-semibold">Hoặc chọn tỉnh / thành phố khác:</span>
              <select
                value={form.province}
                onChange={e => handleSelectProvince(e.target.value)}
                className="w-full sm:w-64 px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold text-sm border border-slate-200 outline-none focus:border-blue-600 focus:bg-white transition-all cursor-pointer"
              >
                <option value="">-- Chọn tỉnh thành --</option>
                {ALL_PROVINCES.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* STEP 2: DURATION */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md shadow-slate-200/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-extrabold text-sm">
                2
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FiCalendar className="text-indigo-600" /> Thời Gian Chuyến Đi: <span className="text-blue-600 font-extrabold ml-1">{form.total_days} Ngày</span>
                </h3>
                <p className="text-xs text-slate-500">AI sẽ tự động phân bổ hoạt động chi tiết từ 1 đến 7 ngày</p>
              </div>
            </div>

            {/* Slider */}
            <div className="px-2">
              <input
                type="range"
                min={1}
                max={7}
                value={form.total_days}
                onChange={e => setForm(f => ({ ...f, total_days: parseInt(e.target.value) }))}
                className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs font-semibold text-slate-500 mt-3">
                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, total_days: num }))}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer border-none ${form.total_days === num
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                  >
                    {num} ngày
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* STEP 3: TRAVEL STYLE */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md shadow-slate-200/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center font-extrabold text-sm">
                3
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FiHeart className="text-violet-600" /> Phong Cách Chuyến Đi
                </h3>
                <p className="text-xs text-slate-500">Chọn trải nghiệm bạn mong muốn nhất</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {STYLES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, style: s.value }))}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${form.style === s.value
                      ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 text-blue-950 font-bold shadow-sm'
                      : 'bg-slate-50/80 border-slate-200/70 hover:border-slate-300 text-slate-700'
                    }`}
                >
                  <div className="font-bold text-sm flex items-center justify-between">
                    <span>{s.label}</span>
                    {form.style === s.value && <FiCheck className="text-blue-600" />}
                  </div>
                  <div className="text-xs text-slate-500 mt-1.5 leading-relaxed">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* STEP 4: BUDGET & SPECIAL NOTES */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md shadow-slate-200/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-extrabold text-sm">
                4
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FiDollarSign className="text-emerald-600" /> Ngân Sách & Yêu Cầu Riêng
                </h3>
                <p className="text-xs text-slate-500">Kinh phí dự kiến cho mỗi ngày</p>
              </div>
            </div>

            {/* Budget options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
              {BUDGETS.map(b => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, budget: b.value }))}
                  className={`p-4 rounded-2xl text-left border transition-all cursor-pointer ${form.budget === b.value
                      ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold shadow-sm'
                      : 'bg-slate-50/80 border-slate-200/70 hover:border-slate-300 text-slate-700'
                    }`}
                >
                  <div className="font-bold text-sm flex items-center justify-between">
                    <span>{b.label}</span>
                    {form.budget === b.value && <FiCheck className="text-emerald-600" />}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{b.desc}</div>
                </button>
              ))}
            </div>

            {/* Note Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                <FiMessageSquare size={13} className="text-blue-600" /> Yêu cầu đặc biệt (không bắt buộc):
              </label>
              <textarea
                rows={2}
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                placeholder="VD: Đi cùng trẻ nhỏ, thích chụp ảnh cafe chill, không thích đi bộ quá xa..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm outline-none focus:border-blue-600 focus:bg-white transition-all resize-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* GENERATE / PURCHASE ACTION BOX */}
          <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-xl shadow-slate-200/60">
            {hasCredits ? (
              <div className="max-w-xl mx-auto space-y-4">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading || !form.province}
                  className="w-full py-4 px-8 rounded-2xl font-extrabold text-base transition-all cursor-pointer border-none flex items-center justify-center gap-3 text-white disabled:opacity-50 shadow-xl shadow-blue-500/25 hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Groq AI Đang Tạo Lịch Trình... (vui lòng chờ 5-10s)
                    </>
                  ) : (
                    <>
                      <FiZap size={20} />
                      ✨ Bắt Đầu Tạo Lịch Trình Thông Minh {!isVIP && `(Dùng 1 lượt)`}
                    </>
                  )}
                </button>
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
                  <FiShield size={13} className="text-emerald-600" /> AI tự động phân tích địa điểm thực tế & lưu thông tin vào lịch trình cá nhân của bạn
                </p>
              </div>
            ) : (
              <div className="max-w-xl mx-auto space-y-5">
                <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-center">
                  <div className="text-3xl mb-2">😢</div>
                  <h4 className="text-lg font-bold text-red-600">Bạn Đã Hết Lượt AI Credits</h4>
                  <p className="text-xs text-slate-600 mt-1">
                    Nâng cấp gói VIP để tiếp tục tạo lịch trình du lịch tự động không giới hạn.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePurchase}
                  disabled={purchaseLoading}
                  className="w-full py-4 px-8 rounded-2xl font-extrabold text-base transition-all cursor-pointer border-none flex items-center justify-center gap-3 text-white shadow-xl shadow-amber-500/25 hover:scale-[1.01] active:scale-[0.99]"
                  style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}
                >
                  {purchaseLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiLock size={18} />
                      💳 Mở Khóa 5 Lượt VIP - 50.000 VNĐ qua VNPay
                    </>
                  )}
                </button>
                <div className="flex justify-center items-center gap-4 text-xs text-slate-500 font-medium">
                  <span>🔒 Cổng VNPay Sandbox</span>
                  <span>•</span>
                  <span>💳 Thẻ ATM / QR Code / Internet Banking</span>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
