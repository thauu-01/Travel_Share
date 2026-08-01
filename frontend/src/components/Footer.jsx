import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiTwitter, FiMapPin, FiMail, FiPhone, FiArrowRight } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="relative bg-slate-900 text-white mt-12 overflow-hidden">
      {/* Top gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-60" />

      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-indigo-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2 text-xl font-extrabold text-white mb-4">
              <span className="text-2xl">✈️</span>
              <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">TravelShare</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Mạng xã hội chia sẻ trải nghiệm du lịch lớn nhất Việt Nam. Cùng khám phá những vùng đất mới, con người mới và văn hóa mới.
            </p>
            <div className="flex gap-2.5">
              {[
                { Icon: FiFacebook, label: 'Facebook' },
                { Icon: FiInstagram, label: 'Instagram' },
                { Icon: FiTwitter, label: 'Twitter' }
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-white/5 hover:bg-blue-600 border border-white/10 hover:border-blue-600 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-200"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Khám phá */}
          <div>
            <h3 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">Khám phá</h3>
            <ul className="space-y-3 text-sm">
              {[
                { to: '/explore', label: 'Bản đồ du lịch' },
                { to: '/search', label: 'Tìm kiếm địa điểm' },
                { to: '/trips', label: 'Lập kế hoạch' },
                { to: '/', label: 'Bài viết nổi bật' },
              ].map(({ to, label }) => (
                <li key={label}>
                  <Link to={to} className="text-slate-400 hover:text-white flex items-center gap-2 group transition-colors">
                    <FiArrowRight size={12} className="opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Hỗ trợ */}
          <div>
            <h3 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">Hỗ trợ</h3>
            <ul className="space-y-3 text-sm">
              {['Trung tâm trợ giúp', 'Quy định chung', 'Chính sách bảo mật', 'Điều khoản sử dụng'].map(label => (
                <li key={label}>
                  <a href="#" className="text-slate-400 hover:text-white flex items-center gap-2 group transition-colors">
                    <FiArrowRight size={12} className="opacity-0 group-hover:opacity-100 -ml-4 group-hover:ml-0 transition-all" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Liên hệ */}
          <div>
            <h3 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">Liên hệ</h3>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start gap-3 text-slate-400">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0 mt-0.5">
                  <FiMapPin size={13} className="text-blue-400" />
                </div>
                <span>123 Đường Du Lịch, Quận Trung Tâm, TP. Hà Nội</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
                  <FiMail size={13} className="text-blue-400" />
                </div>
                <span>contact@travelshare.vn</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <div className="w-7 h-7 rounded-lg bg-blue-600/20 flex items-center justify-center shrink-0">
                  <FiPhone size={13} className="text-blue-400" />
                </div>
                <span>1900 1234</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-7 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} TravelShare. All rights reserved. Made with ❤️ in Vietnam.
          </p>
          <div className="flex gap-6 text-xs">
            {['Privacy', 'Terms', 'Cookies'].map(label => (
              <a key={label} href="#" className="text-slate-500 hover:text-slate-300 transition-colors">{label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
