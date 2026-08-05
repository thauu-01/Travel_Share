import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiEye, FiEyeOff } from 'react-icons/fi';

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.login(form);
      const userData = res.data.data;
      dispatch(loginSuccess(userData));
      toast.success('Đăng nhập thành công!');
      navigate(userData?.user?.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f7ff] via-[#e0e7ff] to-[#f0f7ff]">
      <div className="w-full max-w-md p-10 bg-white border border-indigo-100 rounded-3xl animate-in">
        <div className="text-center mb-2 text-[2.5rem]">✈️</div>
        <h1 className="text-3xl font-extrabold text-center mb-1 gradient-text">Đăng nhập</h1>
        <p className="text-slate-500 text-center mt-1 mb-6">Chào mừng trở lại TravelShare</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-sm text-slate-500">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl text-slate-900 text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-sm text-slate-500">Mật khẩu</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-4 pr-11 py-3 bg-white border border-indigo-100 rounded-xl text-slate-900 text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors border-none bg-transparent cursor-pointer p-1"
                title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-sm cursor-pointer transition-all border border-transparent bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:-translate-y-px hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
            disabled={loading}
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="text-center mt-6 text-slate-400 text-sm">
          <Link to="/forgot-password" className="text-blue-500 hover:text-blue-600 hover:underline text-xs font-semibold">Quên mật khẩu?</Link>
          <span className="mx-2 text-slate-200">|</span>
          Chưa có tài khoản? <Link to="/register" className="text-blue-600 font-semibold hover:underline">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
