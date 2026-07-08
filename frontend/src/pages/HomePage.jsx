import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { postAPI, recommendationAPI, categoryAPI } from '../services/api';
import PostCard from '../components/PostCard';
import { useSelector } from 'react-redux';
import { FiTrendingUp, FiStar, FiArrowRight } from 'react-icons/fi';

export default function HomePage() {
  const { isAuthenticated } = useSelector(s => s.auth);
  const [trending, setTrending] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      postAPI.getTrending().then(r => setTrending(r.data.data || [])),
      recommendationAPI.get().then(r => setRecommended(r.data.data || [])),
      categoryAPI.getAll().then(r => setCategories(r.data.data || []))
    ]).finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="hero-title animate-in">
            Khám phá Việt Nam<br />cùng <span className="gradient">TravelShare</span>
          </h1>
          <p className="hero-subtitle animate-in delay-1">
            Chia sẻ trải nghiệm du lịch, khám phá địa điểm mới và lập kế hoạch hành trình
            từ cộng đồng du lịch lớn nhất Việt Nam
          </p>
          <div className="hero-actions animate-in delay-2">
            <Link to="/explore" className="btn btn-primary btn-lg">🗺️ Khám phá bản đồ</Link>
            {!isAuthenticated && <Link to="/register" className="btn btn-secondary btn-lg">Tham gia ngay</Link>}
          </div>
        </div>
      </section>

      <div className="container">
        {/* CATEGORIES */}
        <section className="section">
          <div className="filter-chips" style={{ justifyContent: 'center' }}>
            {categories.map(c => (
              <Link key={c.id} to={`/search?category=${c.id}`} className="chip" style={{ fontSize: '0.9rem', padding: '0.5rem 1rem' }}>
                {c.icon} {c.name}
              </Link>
            ))}
          </div>
        </section>

        {/* TRENDING */}
        <section className="section">
          <div className="section-title"><FiTrendingUp style={{ color: 'var(--danger)' }} /> Trending tuần này</div>
          {loading ? <div className="loading"><div className="spinner"></div></div> : (
            <div className="grid grid-4">
              {trending.slice(0, 8).map((post, i) => <PostCard key={post.id} post={post} />)}
            </div>
          )}
        </section>

        {/* RECOMMENDATIONS */}
        {recommended.length > 0 && (
          <section className="section">
            <div className="section-title"><FiStar style={{ color: 'var(--warning)' }} /> Gợi ý cho bạn</div>
            <div className="grid grid-4">
              {recommended.slice(0, 8).map(post => <PostCard key={post.id} post={post} />)}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="section" style={{ textAlign: 'center', padding: '4rem 0' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '1rem' }}>
            Bạn có trải nghiệm du lịch thú vị?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            Chia sẻ với cộng đồng TravelShare và giúp đỡ những du khách khác!
          </p>
          <Link to={isAuthenticated ? '/create-post' : '/register'} className="btn btn-primary btn-lg">
            ✍️ Viết bài chia sẻ <FiArrowRight />
          </Link>
        </section>
      </div>
    </div>
  );
}
