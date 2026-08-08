import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { postAPI, categoryAPI, placeAPI } from '../services/api';
import PostCard from '../components/PostCard';
import {
  FiSearch, FiMapPin, FiX, FiFilter, FiStar,
  FiTrendingUp, FiClock, FiChevronDown
} from 'react-icons/fi';

// Debounce hook
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 0 });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const searchRef = useRef(null);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    province: searchParams.get('province') || '',
    rating: searchParams.get('rating') || '',
    sort: searchParams.get('sort') || 'newest',
    page: 1
  });

  const debouncedSearch = useDebounce(filters.search, 350);

  useEffect(() => {
    categoryAPI.getAll().then(r => setCategories(r.data.data || []));
    placeAPI.getProvinces().then(r => setProvinces(r.data.data || []));
  }, []);

  // Auto-search on any filter change
  useEffect(() => { fetchPosts(); }, [filters]);

  // Suggestions when typing
  useEffect(() => {
    if (debouncedSearch.length < 2) { setSuggestions([]); return; }
    placeAPI.getAll({ limit: 6, search: debouncedSearch })
      .then(r => {
        const places = r.data.data?.places || [];
        setSuggestions(places);
        setShowSuggestions(places.length > 0);
      })
      .catch(() => setSuggestions([]));
  }, [debouncedSearch]);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = { sort: filters.sort, page: filters.page, limit: 12 };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.province) params.province = filters.province;
      if (filters.rating) params.rating = filters.rating;

      const res = await postAPI.getAll(params);
      setPosts(res.data.data.posts || []);
      setPagination(res.data.data.pagination || {});
    } catch (err) {
      setPosts([]);
      setPagination({ total: 0, page: 1, totalPages: 0 });
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    setShowSuggestions(false);
    setFilters(f => ({ ...f, page: 1 }));
  };

  const clearSearch = () => {
    setFilters(f => ({ ...f, search: '', page: 1 }));
    setSuggestions([]);
  };

  const selectSuggestion = (place) => {
    setFilters(f => ({ ...f, search: place.name, province: place.province, page: 1 }));
    setShowSuggestions(false);
  };

  const setFilter = (key, value) => {
    if (key === 'page') {
      setFilters(f => ({ ...f, page: value }));
    } else {
      setFilters(f => ({ ...f, [key]: value, page: 1 }));
    }
  };

  const hasActiveFilters = filters.category || filters.province || filters.rating;

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/10">
      {/* Hero search section with nature image background */}
      <div className="relative pt-14 pb-20 px-6 overflow-hidden bg-slate-900">
        {/* Nature background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-1000"
          style={{ backgroundImage: "url('/images/hero-nature-bg.jpg')" }}
        />
        {/* Gradient dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-900/60 to-slate-950/80 backdrop-blur-[2px]" />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white mb-3 tracking-tight animate-in drop-shadow-md">
            🔍 Tìm kiếm bài viết
          </h1>
          <p className="text-slate-200 text-sm md:text-base mb-8 animate-in delay-1 drop-shadow">
            Khám phá vẻ đẹp Việt Nam qua <strong className="text-blue-300 font-semibold">địa điểm</strong>, <strong className="text-blue-300 font-semibold">tỉnh thành</strong> hoặc trải nghiệm chia sẻ
          </p>

          {/* Main search bar */}
          <div ref={searchRef} className="relative animate-in delay-1">
            <form onSubmit={handleSearch} className="flex bg-white rounded-2xl shadow-2xl shadow-black/30 overflow-hidden">
              <div className="flex items-center pl-4 text-slate-400">
                <FiSearch size={20} />
              </div>
              <input
                type="text"
                className="flex-1 px-4 py-4 text-slate-900 text-base outline-none bg-transparent placeholder-slate-400"
                placeholder='Nhập địa điểm, tỉnh thành, tên bài viết...'
                value={filters.search}
                onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                autoComplete="off"
              />
              {filters.search && (
                <button type="button" onClick={clearSearch}
                  className="px-3 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer">
                  <FiX size={18} />
                </button>
              )}
              <button type="submit"
                className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-sm hover:from-blue-700 hover:to-indigo-700 transition-all border-none cursor-pointer flex items-center gap-2 shrink-0">
                <FiSearch size={16} /> Tìm kiếm
              </button>
            </form>

            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 animate-in">
                <div className="px-4 py-2.5 border-b border-slate-50 flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  <FiMapPin size={11} /> Địa điểm gợi ý
                </div>
                {suggestions.map(place => (
                  <button
                    key={place.id}
                    onMouseDown={() => selectSuggestion(place)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left border-none bg-transparent cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 text-sm">
                      <FiMapPin size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-800 truncate group-hover:text-blue-700">
                        {place.name}
                      </div>
                      <div className="text-xs text-slate-400 truncate">{place.province}</div>
                    </div>
                    <div className="text-xs text-blue-400 opacity-0 group-hover:opacity-100 shrink-0">
                      Chọn →
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick search pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-5 animate-in delay-2">
            {['Hà Nội', 'Đà Nẵng', 'Hội An', 'Phú Quốc', 'Sapa', 'Hạ Long'].map(kw => (
              <button
                key={kw}
                onClick={() => setFilters(f => ({ ...f, search: kw, page: 1 }))}
                className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-medium rounded-full border border-white/15 hover:border-white/30 transition-all cursor-pointer"
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex flex-wrap gap-3 items-center">
          {/* Category chips */}
          <div className="flex gap-1.5 flex-wrap flex-1">
            <button
              onClick={() => setFilter('category', '')}
              className={`px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all ${!filters.category ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'}`}
            >
              Tất cả
            </button>
            {categories.map(c => (
              <button
                key={c.id}
                onClick={() => setFilter('category', filters.category === String(c.id) ? '' : String(c.id))}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all ${filters.category === String(c.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'}`}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>

          {/* Right side filters */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Province */}
            <div className="relative">
              <select
                value={filters.province}
                onChange={e => setFilter('province', e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700 cursor-pointer focus:outline-none focus:border-blue-400 transition-all"
              >
                <option value="">📍 Tất cả tỉnh</option>
                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <FiChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Rating */}
            <div className="relative">
              <select
                value={filters.rating}
                onChange={e => setFilter('rating', e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700 cursor-pointer focus:outline-none focus:border-blue-400 transition-all"
              >
                <option value="">⭐ Mọi rating</option>
                <option value="5">⭐ 5 sao</option>
                <option value="4">⭐ 4+ sao</option>
                <option value="3">⭐ 3+ sao</option>
              </select>
              <FiChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={filters.sort}
                onChange={e => setFilter('sort', e.target.value)}
                className="appearance-none pl-3 pr-7 py-2 text-xs font-semibold border border-slate-200 rounded-xl bg-white text-slate-700 cursor-pointer focus:outline-none focus:border-blue-400 transition-all"
              >
                <option value="newest">🕒 Mới nhất</option>
                <option value="popular">🔥 Phổ biến</option>
                <option value="rating">⭐ Đánh giá cao</option>
              </select>
              <FiChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Clear filters */}
            {hasActiveFilters && (
              <button
                onClick={() => setFilters(f => ({ ...f, category: '', province: '', rating: '', page: 1 }))}
                className="px-3 py-2 text-xs font-semibold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-all cursor-pointer flex items-center gap-1 bg-white"
              >
                <FiX size={12} /> Xoá lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-6 py-8 animate-in">
        {/* Result summary */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <p className="text-sm text-slate-500">
              {loading ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin inline-block" /> Đang tìm...</span>
              ) : (
                <span>
                  Tìm thấy <strong className="text-slate-900">{pagination.total || 0}</strong> bài viết
                  {filters.search && <> cho "<strong className="text-blue-600">{filters.search}</strong>"</>}
                </span>
              )}
            </p>
            {/* Active filter tags */}
            {filters.province && (
              <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                <FiMapPin size={10} /> {filters.province}
                <button onClick={() => setFilter('province', '')} className="ml-1 hover:text-blue-900 border-none bg-transparent cursor-pointer p-0"><FiX size={10} /></button>
              </span>
            )}
            {filters.rating && (
              <span className="flex items-center gap-1 bg-yellow-50 text-yellow-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                <FiStar size={10} /> {filters.rating}+ sao
                <button onClick={() => setFilter('rating', '')} className="ml-1 hover:text-yellow-900 border-none bg-transparent cursor-pointer p-0"><FiX size={10} /></button>
              </span>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
                <div className="h-52 bg-slate-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-slate-100 rounded-lg w-3/4" />
                  <div className="h-3 bg-slate-100 rounded-lg w-1/2" />
                  <div className="h-3 bg-slate-100 rounded-lg w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">Không tìm thấy kết quả</h3>
            <p className="text-slate-400 text-sm mb-6">
              Thử tìm kiếm với từ khóa khác hoặc xoá bộ lọc
            </p>
            {(filters.search || hasActiveFilters) && (
              <button
                onClick={() => setFilters({ search: '', category: '', province: '', rating: '', sort: 'newest', page: 1 })}
                className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-all border-none cursor-pointer"
              >
                Xoá tất cả bộ lọc
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map(post => <PostCard key={post.id} post={post} />)}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-10">
                <button
                  onClick={() => setFilter('page', Math.max(1, filters.page - 1))}
                  disabled={filters.page <= 1}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer bg-white"
                >
                  ← Trước
                </button>
                {Array.from({ length: pagination.totalPages }, (_, i) => {
                  const p = i + 1;
                  const current = filters.page;
                  if (p === 1 || p === pagination.totalPages || Math.abs(p - current) <= 1) {
                    return (
                      <button
                        key={p}
                        onClick={() => setFilter('page', p)}
                        className={`w-9 h-9 text-sm font-bold rounded-xl transition-all cursor-pointer border ${p === current ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:text-blue-600'}`}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (Math.abs(p - current) === 2) return <span key={p} className="text-slate-300 font-bold">…</span>;
                  return null;
                })}
                <button
                  onClick={() => setFilter('page', Math.min(pagination.totalPages, filters.page + 1))}
                  disabled={filters.page >= pagination.totalPages}
                  className="px-4 py-2 text-sm font-semibold rounded-xl border border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer bg-white"
                >
                  Sau →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
