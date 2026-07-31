import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postAPI, recommendationAPI, categoryAPI } from '../services/api';
import PostCard from '../components/PostCard';
import { useSelector } from 'react-redux';
import { FiTrendingUp, FiStar, FiArrowRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const heroSlides = [
  {
    id: 1,
    image: '/images/sapa.jpg',
    title: 'Khám phá Việt Nam',
    highlight: 'cùng TravelShare',
    desc: 'Chia sẻ trải nghiệm du lịch, khám phá địa điểm mới và lập kế hoạch hành trình từ cộng đồng du lịch lớn nhất Việt Nam'
  },
  {
    id: 2,
    image: '/images/halong.jpg',
    title: 'Kỳ quan thiên nhiên',
    highlight: 'Vịnh Hạ Long',
    desc: 'Chiêm ngưỡng vẻ đẹp hùng vĩ của một trong bảy kỳ quan thiên nhiên thế giới mới ngay tại Việt Nam.'
  },
  {
    id: 3,
    image: '/images/hoian.jpg',
    title: 'Phố cổ mộng mơ',
    highlight: 'Hội An',
    desc: 'Đắm mình trong không gian văn hóa hoài cổ, lung linh sắc đèn lồng bên dòng sông Hoài thơ mộng.'
  }
];

export default function HomePage() {
  const { isAuthenticated } = useSelector(s => s.auth);
  const [trending, setTrending] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    Promise.all([
      postAPI.getTrending().then(r => setTrending(r.data.data || [])),
      recommendationAPI.get().then(r => setRecommended(r.data.data || [])),
      categoryAPI.getAll().then(r => setCategories(r.data.data || []))
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));

  return (
    <div className="pt-16 min-h-screen">
      {/* HERO CAROUSEL */}
      <section className="relative w-full h-[75vh] min-h-[500px] overflow-hidden bg-slate-900 group">
        <div 
          className="flex h-full transition-transform duration-700 ease-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {heroSlides.map((slide) => (
            <div key={slide.id} className="w-full h-full shrink-0 relative">
              <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <h1 className="text-4xl md:text-6xl font-extrabold leading-tight mb-4 text-white drop-shadow-lg">
                  {slide.title}<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">{slide.highlight}</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-200 leading-relaxed mb-8 max-w-2xl drop-shadow">
                  {slide.desc}
                </p>
                <div className="flex gap-4 justify-center flex-wrap">
                  <Link to="/explore" className="inline-flex items-center gap-2 py-3 px-8 rounded-xl font-bold text-base cursor-pointer transition-all border border-transparent bg-blue-600 text-white hover:bg-blue-500 shadow-lg hover:shadow-blue-500/30 hover:-translate-y-1">
                    🗺️ Khám phá bản đồ
                  </Link>
                  {!isAuthenticated && (
                    <Link to="/register" className="inline-flex items-center gap-2 py-3 px-8 rounded-xl font-bold text-base cursor-pointer transition-all border-2 border-white/80 bg-black/30 backdrop-blur-md text-white hover:bg-white hover:text-slate-900 shadow-lg hover:-translate-y-1">
                      Tham gia ngay
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel Controls */}
        <button 
          onClick={prevSlide}
          className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer border-none"
        >
          <FiChevronLeft size={24} />
        </button>
        <button 
          onClick={nextSlide}
          className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/20 hover:bg-black/50 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer border-none"
        >
          <FiChevronRight size={24} />
        </button>

        {/* Pagination Dots */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all border-none cursor-pointer p-0 ${currentSlide === idx ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/70'}`}
            />
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6">
        {/* CATEGORIES */}
        <section className="py-12">
          <div className="flex gap-3 flex-wrap mb-6 justify-center">
            {categories.map(c => (
              <Link key={c.id} to={`/search?category=${c.id}`} className="flex items-center gap-2 py-2.5 px-5 rounded-full bg-white border border-indigo-100 text-slate-600 font-medium text-sm cursor-pointer transition-all hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 shadow-sm hover:shadow-md">
                <span>{c.icon}</span> {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* TRENDING */}
        <section className="py-8">
          <div className="text-2xl font-bold mb-8 flex items-center gap-2"><FiTrendingUp className="text-red-500" /> Trending hiện tại</div>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <div className="w-10 h-10 border-4 border-indigo-100 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : trending.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-2xl border-2 border-dashed border-indigo-100 text-slate-500">
              Hiện tại chưa có bài viết nào lọt top thịnh hành. Hãy là người đầu tiên <Link to="/create-post" className="text-blue-600 font-bold hover:underline">đăng bài</Link>!
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {trending.slice(0, 8).map((post) => <PostCard key={post.id} post={post} />)}
            </div>
          )}
        </section>

        {/* RECOMMENDATIONS */}
        <section className="py-12">
          <div className="text-2xl font-bold mb-8 flex items-center gap-2"><FiStar className="text-amber-500" /> Gợi ý cho bạn</div>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <div className="w-10 h-10 border-4 border-indigo-100 border-t-blue-600 rounded-full animate-spin"></div>
            </div>
          ) : recommended.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-2xl border-2 border-dashed border-indigo-100 text-slate-500">
              Hệ thống đang thu thập thêm dữ liệu sở thích để đưa ra gợi ý phù hợp nhất cho bạn. Hãy tương tác thêm nhé!
            </div>
          ) : (
            <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {recommended.slice(0, 8).map(post => <PostCard key={post.id} post={post} />)}
            </div>
          )}
        </section>

        {/* CTA */}
        <section className="py-20 text-center my-12 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-indigo-100">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">
            Bạn có trải nghiệm du lịch thú vị?
          </h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto text-lg">
            Hãy chia sẻ với cộng đồng TravelShare để giúp đỡ hàng ngàn du khách khác có một chuyến đi tuyệt vời!
          </p>
          <Link to={isAuthenticated ? '/create-post' : '/register'} className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base cursor-pointer transition-all border border-transparent bg-gradient-to-br from-blue-600 to-blue-800 text-white hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1">
            ✍️ Viết bài chia sẻ <FiArrowRight />
          </Link>
        </section>
      </div>
    </div>
  );
}
