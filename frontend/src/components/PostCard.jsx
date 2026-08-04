import { Link } from 'react-router-dom';
import { FiHeart, FiEye, FiEyeOff, FiMapPin, FiStar } from 'react-icons/fi';

export default function PostCard({ post }) {
  const coverImage = post.images?.find(i => i.is_cover)?.image_url || post.images?.[0]?.image_url;
  const likesCount = post.likes?.length || 0;

  return (
    <Link
      to={`/posts/${post.id}`}
      className="group block h-full bg-white rounded-2xl overflow-hidden border border-slate-100 card-hover"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {/* Cover Image */}
      <div className="relative overflow-hidden bg-slate-100">
        {/* Hidden Status Badge */}
        {(post.status === 'hidden' || post.is_hidden) && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-600/90 backdrop-blur-sm text-white shadow-sm z-10">
            <FiEyeOff size={11} /> Đã ẩn
          </div>
        )}

        {coverImage ? (
          <img
            src={coverImage}
            alt={post.title}
            className="w-full h-[200px] object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-[200px] bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center text-4xl">
            📸
          </div>
        )}

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Rating Badge */}
        {post.rating && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/90 backdrop-blur-sm text-amber-500 shadow-sm">
            <FiStar size={11} fill="currentColor" /> {post.rating}
          </div>
        )}

        {/* Place badge on hover */}
        {post.place && (
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-600/90 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
            <FiMapPin size={11} /> {post.place.name}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4">
        <h3 className="font-bold text-[0.95rem] text-slate-900 mb-2 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
          {post.title}
        </h3>

        {post.place && !post.images?.length && (
          <div className="flex items-center gap-1.5 mb-2">
            <FiMapPin size={12} className="text-blue-500 shrink-0" />
            <span className="text-[0.78rem] text-blue-600 font-medium truncate">
              {post.place.name}{post.place.province ? `, ${post.place.province}` : ''}
            </span>
          </div>
        )}

        <p className="text-slate-500 text-[0.82rem] leading-relaxed line-clamp-2 mb-3">
          {post.content}
        </p>

        {/* Card Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-50">
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-700 flex items-center justify-center text-white font-bold text-[0.58rem] overflow-hidden shrink-0 ring-1 ring-white">
              {post.author?.avatar_url
                ? <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" />
                : post.author?.full_name?.[0]}
            </div>
            <span className="text-[0.75rem] text-slate-500 font-medium truncate max-w-[80px]">
              {post.author?.full_name}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[0.75rem] text-slate-400">
            <span className="flex items-center gap-1">
              <FiHeart size={12} className="text-rose-400" /> {likesCount}
            </span>
            <span className="flex items-center gap-1">
              <FiEye size={12} /> {post.view_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
