import { Link } from 'react-router-dom';
import { FiFacebook, FiInstagram, FiTwitter, FiMapPin, FiMail, FiPhone } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-indigo-100 pt-10 pb-6 mt-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-8">
          {/* Brand */}
          <div>
            <Link to="/" className="text-xl font-extrabold text-blue-600 mb-3 inline-block">
              TravelShare
            </Link>
            <p className="text-slate-500 text-sm leading-snug mb-5">
              Mạng xã hội chia sẻ trải nghiệm du lịch lớn nhất Việt Nam. Cùng khám phá những vùng đất mới, con người mới và văn hóa mới.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
                <FiFacebook size={16} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
                <FiInstagram size={16} />
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors">
                <FiTwitter size={16} />
              </a>
            </div>
          </div>

          {/* Khám phá */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 text-base">Khám phá</h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li><Link to="/explore" className="text-slate-500 hover:text-blue-600 transition-colors">Bản đồ du lịch</Link></li>
              <li><Link to="/search" className="text-slate-500 hover:text-blue-600 transition-colors">Tìm kiếm địa điểm</Link></li>
              <li><Link to="/trips" className="text-slate-500 hover:text-blue-600 transition-colors">Lập kế hoạch</Link></li>
              <li><Link to="/" className="text-slate-500 hover:text-blue-600 transition-colors">Bài viết nổi bật</Link></li>
            </ul>
          </div>

          {/* Hỗ trợ */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 text-base">Hỗ trợ</h3>
            <ul className="flex flex-col gap-2 text-sm">
              <li><a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">Trung tâm trợ giúp</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">Quy định chung</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="text-slate-500 hover:text-blue-600 transition-colors">Điều khoản sử dụng</a></li>
            </ul>
          </div>

          {/* Liên hệ */}
          <div>
            <h3 className="font-bold text-slate-900 mb-4 text-base">Liên hệ</h3>
            <ul className="flex flex-col gap-2.5 text-sm">
              <li className="flex items-start gap-2 text-slate-500">
                <FiMapPin className="text-blue-600 mt-0.5 shrink-0" size={14} />
                <span>123 Đường Du Lịch, Quận Trung Tâm, TP. Hà Nội</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <FiMail className="text-blue-600 shrink-0" size={14} />
                <span>contact@travelshare.vn</span>
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <FiPhone className="text-blue-600 shrink-0" size={14} />
                <span>1900 1234</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-indigo-50 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-xs">
            &copy; {new Date().getFullYear()} TravelShare. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs">
            <a href="#" className="text-slate-400 hover:text-blue-600">Privacy</a>
            <a href="#" className="text-slate-400 hover:text-blue-600">Terms</a>
            <a href="#" className="text-slate-400 hover:text-blue-600">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
