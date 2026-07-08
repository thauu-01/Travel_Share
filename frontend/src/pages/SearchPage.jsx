import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { postAPI, categoryAPI, placeAPI } from '../services/api';
import PostCard from '../components/PostCard';
import { FiSearch } from 'react-icons/fi';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 0 });

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    province: searchParams.get('province') || '',
    rating: searchParams.get('rating') || '',
    sort: searchParams.get('sort') || 'newest',
    page: 1
  });

  useEffect(() => {
    categoryAPI.getAll().then(r => setCategories(r.data.data || []));
    placeAPI.getProvinces().then(r => setProvinces(r.data.data || []));
  }, []);

  useEffect(() => { fetchPosts(); }, [filters]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.province) params.province = filters.province;
      if (filters.rating) params.rating = filters.rating;
      params.sort = filters.sort;
      params.page = filters.page;
      params.limit = 12;

      const res = await postAPI.getAll(params);
      setPosts(res.data.data.posts || []);
      setPagination(res.data.data.pagination || {});
    } catch (err) {
      console.error('Error fetching posts:', err);
      setPosts([]);
      setPagination({ total: 0, page: 1, totalPages: 0 });
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
  };

  return (
    <div className="page">
      <div className="container">
        <div className="page-header animate-in">
          <h1 className="page-title">🔍 Tìm kiếm & Lọc</h1>
          <p className="page-subtitle">Tìm kiếm bài viết theo từ khóa, danh mục, địa điểm và đánh giá</p>
        </div>

        {/* Search bar */}
        <form className="search-bar animate-in delay-1" onSubmit={handleSearch}>
          <input type="text" className="form-input" placeholder="Tìm kiếm bài viết..."
            value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
          <select className="form-select" style={{ width: 'auto', minWidth: 150 }}
            value={filters.province} onChange={e => setFilters({...filters, province: e.target.value, page: 1})}>
            <option value="">Tất cả tỉnh</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select className="form-select" style={{ width: 'auto', minWidth: 130 }}
            value={filters.rating} onChange={e => setFilters({...filters, rating: e.target.value, page: 1})}>
            <option value="">Tất cả rating</option>
            <option value="5">⭐ 5 sao</option>
            <option value="4">⭐ 4+ sao</option>
            <option value="3">⭐ 3+ sao</option>
          </select>
          <select className="form-select" style={{ width: 'auto', minWidth: 130 }}
            value={filters.sort} onChange={e => setFilters({...filters, sort: e.target.value, page: 1})}>
            <option value="newest">Mới nhất</option>
            <option value="popular">Phổ biến</option>
            <option value="rating">Rating cao</option>
          </select>
          <button type="submit" className="btn btn-primary"><FiSearch /> Tìm</button>
        </form>

        {/* Category chips */}
        <div className="filter-chips animate-in delay-2">
          <button className={`chip ${!filters.category ? 'active' : ''}`}
            onClick={() => setFilters({...filters, category: '', page: 1})}>Tất cả</button>
          {categories.map(c => (
            <button key={c.id} className={`chip ${filters.category === String(c.id) ? 'active' : ''}`}
              onClick={() => setFilters({...filters, category: filters.category === String(c.id) ? '' : String(c.id), page: 1})}>
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? <div className="loading"><div className="spinner"></div></div> : (
          <>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Tìm thấy {pagination.total || 0} bài viết
            </p>
            <div className="grid grid-3">
              {posts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
            {posts.length === 0 && (
              <div className="empty-state"><div className="icon">🔍</div>Không tìm thấy bài viết nào phù hợp</div>
            )}
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '2rem' }}>
                {Array.from({ length: pagination.totalPages }, (_, i) => (
                  <button key={i} className={`btn btn-sm ${filters.page === i + 1 ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFilters({...filters, page: i + 1})}>{i + 1}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
