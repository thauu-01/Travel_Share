import { Link } from 'react-router-dom';
import { FiHeart, FiEye, FiMapPin } from 'react-icons/fi';

export default function PostCard({ post }) {
  const coverImage = post.images?.find(i => i.is_cover)?.image_url || post.images?.[0]?.image_url;
  const likesCount = post.likes?.length || 0;

  return (
    <Link
      to={`/posts/${post.id}`}
      className="block h-full bg-white border border-indigo-100 rounded-2xl overflow-hidden transition-all hover:-translate-y-1 hover:shadow-xl hover:border-blue-300/50 animate-in"
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      {/* Cover Image */}
      <div className="relative overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={post.title}
            className="w-full h-[200px] object-cover bg-gray-100"
          />
        ) : (
          <div className="w-full h-[200px] object-cover bg-gray-100 flex items-center justify-center text-5xl">
            📸
          </div>
        )}
        {post.rating && (
          <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-600">
            ⭐ {post.rating}/5
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5">
        <h3 className="text-[1.05rem] font-bold mb-2 leading-snug line-clamp-2">{post.title}</h3>

        {post.place && (
          <div className="flex items-center gap-[0.35rem] mb-2">
            <FiMapPin size={13} className="text-blue-600" />
            <span className="text-[0.8rem] text-blue-600">
              {post.place.name}{post.place.province ? `, ${post.place.province}` : ''}
            </span>
          </div>
        )}

        <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">
          {post.content}
        </p>

        {/* Card Meta */}
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
          <span className="flex items-center gap-[0.35rem]">
            {/* Mini Avatar */}
            <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-[0.6rem] overflow-hidden shrink-0">
              {post.author?.avatar_url
                ? <img src={post.author.avatar_url} alt="" />
                : post.author?.full_name?.[0]}
            </div>
            {post.author?.full_name}
          </span>
          <span className="flex items-center gap-1"><FiHeart size={13} /> {likesCount}</span>
          <span className="flex items-center gap-1"><FiEye size={13} /> {post.view_count}</span>
        </div>
      </div>
    </Link>
  );
}
