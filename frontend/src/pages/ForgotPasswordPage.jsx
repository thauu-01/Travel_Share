import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiArrowLeft, FiShield, FiCheck } from 'react-icons/fi';

// Step indicator
function StepBar({ step }) {
  const steps = ['Nhập email', 'Xác minh OTP', 'Mật khẩu mới'];
  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((label, idx) => {
        const num = idx + 1;
        const done = step > num;
        const active = step === num;
        return (
          <div key={idx} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                done ? 'bg-emerald-500 text-white' :
                active ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                'bg-slate-100 text-slate-400'
              }`}>
                {done ? <FiCheck size={14} /> : num}
              </div>
              <span className={`text-[10px] font-semibold mt-1 whitespace-nowrap ${
                active ? 'text-blue-600' : done ? 'text-emerald-500' : 'text-slate-400'
              }`}>{label}</span>
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-12 h-0.5 mb-4 mx-1 transition-all duration-300 ${step > num ? 'bg-emerald-400' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const otpRefs = useRef([]);

  // Start countdown for resend OTP
  function startCountdown(sec = 60) {
    setCountdown(sec);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  // Step 1: Send OTP
  async function handleSendOtp(e) {
    e.preventDefault();
    if (!email.trim()) return toast.error('Vui lòng nhập email');
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email: email.trim() });
      toast.success('Mã OTP đã được gửi tới email của bạn!');
      setStep(2);
      startCountdown();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể gửi email');
    } finally {
      setLoading(false);
    }
  }

  // Step 1 resend OTP
  async function handleResendOtp() {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await authAPI.forgotPassword({ email: email.trim() });
      toast.success('Đã gửi lại mã OTP mới!');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      startCountdown();
    } catch (err) {
      toast.error('Không thể gửi lại OTP');
    } finally {
      setLoading(false);
    }
  }

  // OTP input handling
  function handleOtpChange(idx, val) {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  }

  function handleOtpKeyDown(idx, e) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setOtp(next);
    otpRefs.current[Math.min(pasted.length, 5)]?.focus();
  }

  // Step 2: Verify OTP
  async function handleVerifyOtp(e) {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length < 6) return toast.error('Vui lòng nhập đủ 6 chữ số OTP');
    setLoading(true);
    try {
      const res = await authAPI.verifyOtp({ email: email.trim(), otp: otpString });
      setResetToken(res.data.data.resetToken);
      toast.success('Xác minh thành công!');
      setStep(3);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Mã OTP không đúng');
    } finally {
      setLoading(false);
    }
  }

  // Step 3: Reset password
  async function handleResetPassword(e) {
    e.preventDefault();
    if (newPassword.length < 6) return toast.error('Mật khẩu phải có ít nhất 6 ký tự');
    if (newPassword !== confirmPassword) return toast.error('Mật khẩu xác nhận không khớp');
    setLoading(true);
    try {
      await authAPI.resetPassword({ resetToken, newPassword });
      toast.success('Đặt lại mật khẩu thành công!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 pt-8 pb-6 text-white">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-white/80 hover:text-white text-sm font-medium mb-5 transition-colors">
              <FiArrowLeft size={15} /> Quay lại đăng nhập
            </Link>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <FiShield size={20} />
              </div>
              <div>
                <h1 className="text-xl font-bold">Quên mật khẩu</h1>
                <p className="text-white/75 text-xs mt-0.5">
                  {step === 1 && 'Nhập email để nhận mã OTP'}
                  {step === 2 && `Kiểm tra hộp thư ${email}`}
                  {step === 3 && 'Tạo mật khẩu mới của bạn'}
                </p>
              </div>
            </div>
          </div>

          <div className="px-8 py-7">
            <StepBar step={step} />

            {/* STEP 1: Email input */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Địa chỉ Email</label>
                  <div className="relative">
                    <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="email"
                      placeholder="example@gmail.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">Chúng tôi sẽ gửi mã OTP 6 chữ số tới email này.</p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang gửi...</>
                  ) : 'Gửi mã OTP'}
                </button>
              </form>
            )}

            {/* STEP 2: OTP input */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3 text-center">Nhập mã OTP</label>

                  {/* OTP boxes */}
                  <div className="flex gap-2.5 justify-center" onPaste={handleOtpPaste}>
                    {otp.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={el => otpRefs.current[idx] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(idx, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(idx, e)}
                        className={`w-11 h-13 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all duration-150 ${
                          digit
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-400 focus:bg-white'
                        }`}
                        style={{ height: '52px' }}
                      />
                    ))}
                  </div>

                  <div className="text-center mt-4">
                    {countdown > 0 ? (
                      <p className="text-xs text-slate-400">Gửi lại mã sau <span className="font-bold text-blue-600">{countdown}s</span></p>
                    ) : (
                      <button type="button" onClick={handleResendOtp} disabled={loading}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors disabled:opacity-50">
                        Gửi lại mã OTP
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)}
                    className="flex-1 py-3 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                    Quay lại
                  </button>
                  <button type="submit" disabled={loading || otp.join('').length < 6}
                    className="flex-[2] py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md shadow-blue-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {loading ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang xác minh...</> : 'Xác minh OTP'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: New password */}
            {step === 3 && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mật khẩu mới</label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="password"
                      placeholder="Tối thiểu 6 ký tự"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="password"
                      placeholder="Nhập lại mật khẩu mới"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                        confirmPassword && confirmPassword !== newPassword
                          ? 'border-red-300 bg-red-50'
                          : 'border-slate-200'
                      }`}
                      required
                    />
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p className="text-xs text-red-500 mt-1.5">Mật khẩu không khớp</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !newPassword || newPassword !== confirmPassword}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all shadow-md shadow-emerald-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang lưu...</>
                  ) : <><FiCheck size={16} /> Xác nhận đặt lại mật khẩu</>}
                </button>
              </form>
            )}

            {/* Footer note */}
            <p className="text-center text-xs text-slate-400 mt-6">
              Nhớ mật khẩu rồi?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:underline">Đăng nhập ngay</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
