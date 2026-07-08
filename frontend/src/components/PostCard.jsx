import { Link } from 'react-router-dom';
import { FiHeart, FiEye, FiMapPin } from 'react-icons/fi';

export default function PostCard({ post }) {
  const coverImage = post.images?.find(i => i.is_cover)?.image_url || post.images?.[0]?.image_url;
  const likesCount = post.likes?.length || 0;

  return (
    <Link to={`/posts/${post.id}`} className="card animate-in" style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {coverImage ? (
          <img src={coverImage} alt={post.title} className="card-image" />
        ) : (
          <div className="card-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>📸</div>
        )}
        {post.rating && (
          <div className="badge" style={{ position: 'absolute', top: 12, right: 12 }}>
            ⭐ {post.rating}/5
          </div>
        )}
      </div>
      <div className="card-body">
        <h3 className="card-title">{post.title}</h3>
        {post.place && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
            <FiMapPin size={13} style={{ color: 'var(--accent)' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>
              {post.place.name}{post.place.province ? `, ${post.place.province}` : ''}
            </span>
          </div>
        )}
        <p className="card-text" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {post.content}
        </p>
        <div className="card-meta">
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <div className="avatar" style={{ width: 22, height: 22, fontSize: '0.6rem' }}>
              {post.author?.avatar_url ? <img src={post.author.avatar_url} alt="" /> : post.author?.full_name?.[0]}
            </div>
            {post.author?.full_name}
          </span>
          <span><FiHeart size={13} /> {likesCount}</span>
          <span><FiEye size={13} /> {post.view_count}</span>
        </div>
      </div>
    </Link>
  );
}
