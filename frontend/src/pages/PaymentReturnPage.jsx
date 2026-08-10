import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { paymentAPI, authAPI } from '../services/api';
import { updateUser } from '../store/authSlice';
import { FiCheckCircle, FiXCircle, FiClock, FiZap, FiArrowRight, FiRefreshCw, FiHome } from 'react-icons/fi';

const POLL_INTERVAL_MS = 1500;
const POLL_MAX_TRIES = 12;

export default function PaymentReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector(s => s.auth);

  const txn_ref = searchParams.get('txn_ref') || searchParams.get('vnp_TxnRef');
  const vnp_ResponseCode = searchParams.get('vnp_ResponseCode');
  const error = searchParams.get('error');

  const [status, setStatus] = useState('polling'); // 'polling' | 'success' | 'failed' | 'expired' | 'error'
  const [payment, setPayment] = useState(null);
  const [tries, setTries] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (vnp_ResponseCode && vnp_ResponseCode !== '00') {
      setStatus('failed');
      return;
    }
    if (error || !txn_ref) {
      setStatus('error');
      return;
    }
    pollStatus();
    return () => clearTimeout(timerRef.current);
  }, []);

  const pollStatus = async (attempt = 0) => {
    if (attempt >= POLL_MAX_TRIES) {
      setStatus('polling_timeout');
      return;
    }
    try {
      const res = await paymentAPI.getStatus(txn_ref);
      const data = res.data.data;
      setPayment(data);
      setTries(attempt + 1);

      if (data.status === 'pending') {
        // IPN chưa về — đợi thêm
        timerRef.current = setTimeout(() => pollStatus(attempt + 1), POLL_INTERVAL_MS);
      } else {
        setStatus(data.status); // success | failed | expired
        if (data.status === 'success') {
          authAPI.getMe().then(meRes => {
            if (meRes.data?.data) dispatch(updateUser(meRes.data.data));
          }).catch(() => {});
        }
      }
    } catch (err) {
      if (attempt < POLL_MAX_TRIES - 1) {
        timerRef.current = setTimeout(() => pollStatus(attempt + 1), POLL_INTERVAL_MS);
      } else {
        setStatus('error');
      }
    }
  };

  const config = {
    success: {
      icon: <FiCheckCircle size={58} className="text-emerald-500" />,
      title: '🎉 Thanh Toán Thành Công!',
      subtitle: `Bạn đã mở khóa ${payment?.credits_purchased || 5} lượt AI Trip Generator VIP`,
      boxBg: 'bg-emerald-50/80 border-emerald-200/80'
    },
    failed: {
      icon: <FiXCircle size={58} className="text-red-500" />,
      title: '❌ Thanh Toán Thất Bại',
      subtitle: 'Giao dịch không thành công hoặc bị hủy. Bạn không bị trừ tiền.',
      boxBg: 'bg-red-50/80 border-red-200/80'
    },
    expired: {
      icon: <FiClock size={58} className="text-amber-500" />,
      title: '⏱️ Giao Dịch Hết Hạn',
      subtitle: 'Phiên thanh toán đã quá 15 phút. Vui lòng thực hiện lại giao dịch mới.',
      boxBg: 'bg-amber-50/80 border-amber-200/80'
    },
    polling_timeout: {
      icon: <FiRefreshCw size={58} className="text-blue-500 animate-spin" />,
      title: '⌛ Đang Xử Lý Giao Dịch...',
      subtitle: 'Hệ thống đang xác nhận dữ liệu từ VNPay. Vui lòng tải lại trang sau vài phút.',
      boxBg: 'bg-blue-50/80 border-blue-200/80'
    },
    error: {
      icon: <FiXCircle size={58} className="text-red-500" />,
      title: 'Có Lỗi Xảy Ra',
      subtitle: error === 'invalid_signature' ? 'Chữ ký chữ ký VNPay không hợp lệ.' : 'Không tìm thấy thông tin giao dịch.',
      boxBg: 'bg-red-50/80 border-red-200/80'
    },
  };

  const currentConfig = config[status];

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-50 via-sky-50/50 to-blue-50/40 text-slate-800">
      <div className="w-full max-w-lg">
        {status === 'polling' ? (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xl shadow-slate-200/60 text-center space-y-4">
            <div className="w-16 h-16 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            <h2 className="text-xl font-bold text-slate-900">Đang xác nhận giao dịch...</h2>
            <p className="text-slate-500 text-sm">Vui lòng chờ trong giây lát...</p>
          </div>
        ) : currentConfig ? (
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 shadow-xl shadow-slate-200/60 text-center space-y-6">
            
            {/* Header Icon & Status Box */}
            <div className={`p-6 rounded-2xl border ${currentConfig.boxBg} space-y-3`}>
              <div className="flex justify-center">{currentConfig.icon}</div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{currentConfig.title}</h1>
              <p className="text-slate-600 text-sm leading-relaxed">{currentConfig.subtitle}</p>
            </div>

            {/* Payment Details Box */}
            {payment && (
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3 text-sm">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Mã giao dịch:</span>
                  <span className="font-mono font-bold text-slate-800 bg-slate-200/70 px-2.5 py-1 rounded-lg text-xs">{payment.txn_ref}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Số tiền thanh toán:</span>
                  <span className="font-extrabold text-slate-900 text-base">{payment.amount?.toLocaleString('vi-VN')} VNĐ</span>
                </div>
                {status === 'success' && (
                  <div className="flex justify-between items-center text-slate-600 border-t border-slate-200/70 pt-2.5">
                    <span>Lượt AI nhận được:</span>
                    <span className="font-extrabold text-emerald-600 flex items-center gap-1 text-base">
                      <FiZap size={15} /> +{payment.credits_purchased} lượt VIP
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              {status === 'success' ? (
                <Link
                  to="/trips/ai"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-white transition-all no-underline shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
                >
                  <FiZap size={16} />
                  Tạo lịch trình AI ngay <FiArrowRight size={15} />
                </Link>
              ) : (
                <Link
                  to="/trips/ai"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold text-white transition-all no-underline shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)' }}
                >
                  Thử lại giao dịch
                </Link>
              )}

              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-all border border-slate-200 no-underline"
              >
                <FiHome size={15} /> Về trang chủ
              </Link>
            </div>

          </div>
        ) : null}
      </div>
    </div>
  );
}
