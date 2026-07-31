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
    <div className="pt-20 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8 pb-4 border-b border-indigo-100 animate-in">
          <h1 className="text-3xl font-extrabold gradient-text">🔍 Tìm kiếm &amp; Lọc</h1>
          <p className="text-slate-500 mt-1">Tìm kiếm bài viết theo từ khóa, danh mục, địa điểm và đánh giá</p>
        </div>

        {/* Search bar */}
        <form className="flex gap-3 mb-6 flex-wrap animate-in delay-1" onSubmit={handleSearch}>
          <input
            type="text"
            className="flex-1 min-w-[200px] px-4 py-3 bg-white border border-indigo-100 rounded-xl text-slate-900 text-sm transition-all focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
            placeholder="Tìm kiếm bài viết..."
            value={filters.search}
            onChange={e => setFilters({...filters, search: e.target.value})}
          />
          <select
            className="w-auto min-w-[150px] px-4 py-3 bg-white border border-indigo-100 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 cursor-pointer"
            value={filters.province}
            onChange={e => setFilters({...filters, province: e.target.value, page: 1})}
          >
            <option value="">Tất cả tỉnh</option>
            {provinces.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <select
            className="w-auto min-w-[130px] px-4 py-3 bg-white border border-indigo-100 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 cursor-pointer"
            value={filters.rating}
            onChange={e => setFilters({...filters, rating: e.target.value, page: 1})}
          >
            <option value="">Tất cả rating</option>
            <option value="5">⭐ 5 sao</option>
            <option value="4">⭐ 4+ sao</option>
            <option value="3">⭐ 3+ sao</option>
          </select>
          <select
            className="w-auto min-w-[130px] px-4 py-3 bg-white border border-indigo-100 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10 cursor-pointer"
            value={filters.sort}
            onChange={e => setFilters({...filters, sort: e.target.value, page: 1})}
          >
            <option value="newest">Mới nhất</option>
            <option value="popular">Phổ biến</option>
            <option value="rating">Rating cao</option>
          </select>
          <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm cursor-pointer transition-all bg-gradient-to-br from-blue-500 to-blue-700 text-white border-none hover:-translate-y-px">
            <FiSearch /> Tìm
          </button>
        </form>

        {/* Category chips */}
        <div className="flex gap-2 flex-wrap mb-6 animate-in delay-2">
          <button
            className={`px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all ${!filters.category ? 'bg-blue-100 text-blue-600 border-blue-600' : 'bg-gray-100 border-indigo-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300'}`}
            onClick={() => setFilters({...filters, category: '', page: 1})}
          >Tất cả</button>
          {categories.map(c => (
            <button
              key={c.id}
              className={`px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all ${filters.category === String(c.id) ? 'bg-blue-100 text-blue-600 border-blue-600' : 'bg-gray-100 border-indigo-100 text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300'}`}
              onClick={() => setFilters({...filters, category: filters.category === String(c.id) ? '' : String(c.id), page: 1})}
            >
              {c.icon} {c.name}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12 text-slate-400">
            <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            <p className="text-slate-400 mb-4 text-sm">Tìm thấy {pagination.total || 0} bài viết</p>
            <div className="grid grid-cols-3 gap-6">
              {posts.map(post => <PostCard key={post.id} post={post} />)}
            </div>
            {posts.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">
                <div className="text-5xl mb-4">🔍</div>
                Không tìm thấy bài viết nào phù hợp
              </div>
            )}
            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: pagination.totalPages }, (_, i) => (
                  <button
                    key={i}
                    className={`inline-flex items-center gap-2 py-1.5 px-3 text-xs rounded-xl font-semibold cursor-pointer transition-all border ${filters.page === i + 1 ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white border-none' : 'bg-gray-100 text-slate-900 border-indigo-100 hover:bg-blue-50'}`}
                    onClick={() => setFilters({...filters, page: i + 1})}
                  >{i + 1}</button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
