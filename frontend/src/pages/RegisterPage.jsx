import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../store/authSlice';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Mật khẩu không khớp');
    if (form.password.length < 6) return toast.error('Mật khẩu tối thiểu 6 ký tự');
    setLoading(true);
    try {
      const res = await authAPI.register({ full_name: form.full_name, email: form.email, password: form.password });
      dispatch(loginSuccess(res.data.data));
      toast.success('Đăng ký thành công!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f0f7ff] via-[#e0e7ff] to-[#f0f7ff]">
      <div className="w-full max-w-md p-10 bg-white border border-indigo-100 rounded-3xl animate-in">
        <div className="text-center mb-2 text-[2.5rem]">✈️</div>
        <h1 className="text-3xl font-extrabold text-center mb-1 gradient-text">Đăng ký</h1>
        <p className="text-slate-500 text-center mt-1 mb-6">Tạo tài khoản TravelShare miễn phí</p>
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-sm text-slate-500">Họ và tên</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl text-slate-900 text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
              placeholder="Nguyễn Văn A"
              value={form.full_name}
              onChange={e => setForm({...form, full_name: e.target.value})}
              required
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-sm text-slate-500">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl text-slate-900 text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              required
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-sm text-slate-500">Mật khẩu</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl text-slate-900 text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
              placeholder="Tối thiểu 6 ký tự"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              required
            />
          </div>
          <div className="mb-5">
            <label className="block mb-2 font-semibold text-sm text-slate-500">Xác nhận mật khẩu</label>
            <input
              type="password"
              className="w-full px-4 py-3 bg-white border border-indigo-100 rounded-xl text-slate-900 text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
              placeholder="Nhập lại mật khẩu"
              value={form.confirm}
              onChange={e => setForm({...form, confirm: e.target.value})}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition-all border border-transparent bg-gradient-to-br from-blue-500 to-blue-700 text-white hover:-translate-y-px hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
          </button>
        </form>
        <p className="text-center mt-6 text-slate-400 text-sm">
          Đã có tài khoản? <Link to="/login" className="text-blue-600 font-semibold hover:underline">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
