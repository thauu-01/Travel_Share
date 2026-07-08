import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { postAPI, commentAPI, reportAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiHeart, FiMessageCircle, FiEye, FiShare2, FiMapPin, FiSend, FiFlag } from 'react-icons/fi';

export default function PostDetailPage() {
  const { id } = useParams();
  const { isAuthenticated, user } = useSelector(s => s.auth);
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Report violation state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState({ type: '', id: null });
  const [reportReason, setReportReason] = useState('');

  useEffect(() => { fetchPost(); }, [id]);

  const fetchPost = async () => {
    try {
      const res = await postAPI.getById(id);
      const p = res.data.data;
      setPost(p);
      setComments(p.comments || []);
      setLikeCount(p.likes?.length || 0);
      setLiked(user ? p.likes?.some(l => l.user_id === user.id) : false);
    } catch (err) {
      toast.error('Không tìm thấy bài viết');
    } finally { setLoading(false); }
  };

  const handleLike = async () => {
    if (!isAuthenticated) return toast.error('Vui lòng đăng nhập');
    try {
      const res = await postAPI.toggleLike(id);
      setLiked(res.data.data.liked);
      setLikeCount(prev => res.data.data.liked ? prev + 1 : prev - 1);
    } catch (err) { toast.error('Lỗi'); }
  };

  const handleReport = async () => {
    if (!reportReason) return toast.error('Vui lòng chọn lý do báo cáo');
    try {
      await reportAPI.create({
        target_type: reportTarget.type,
        target_id: reportTarget.id,
        reason: reportReason
      });
      toast.success('Báo cáo vi phạm đã được gửi lên hệ thống!');
      setShowReportModal(false);
      setReportReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gặp lỗi khi gửi báo cáo');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await commentAPI.create(id, { content: newComment, parent_id: replyTo });
      if (replyTo) {
        setComments(prev => prev.map(c => c.id === replyTo ? { ...c, replies: [...(c.replies || []), res.data.data] } : c));
      } else {
        setComments(prev => [{ ...res.data.data, replies: [] }, ...prev]);
      }
      setNewComment(''); setReplyTo(null);
      toast.success('Bình luận thành công!');
    } catch (err) { toast.error('Lỗi gửi bình luận'); }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Đã copy link bài viết!');
  };

  const timeAgo = (d) => {
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return 'Vừa xong';
    if (s < 3600) return `${Math.floor(s/60)} phút trước`;
    if (s < 86400) return `${Math.floor(s/3600)} giờ trước`;
    return `${Math.floor(s/86400)} ngày trước`;
  };

  if (loading) return <div className="page"><div className="loading"><div className="spinner"></div></div></div>;
  if (!post) return <div className="page"><div className="container"><div className="empty-state"><div className="icon">😕</div>Không tìm thấy bài viết</div></div></div>;

  return (
    <div className="page">
      <div className="container">
        <div className="post-detail animate-in">
          {/* Images */}
          {post.images?.length > 0 && (
            <div className="post-images" style={{ gridTemplateColumns: post.images.length > 1 ? '1fr 1fr' : '1fr' }}>
              {post.images.map(img => <img key={img.id} src={img.image_url} alt="" />)}
            </div>
          )}

          <h1 className="post-title">{post.title}</h1>
          <div className="post-meta">
            <Link to={`/profile/${post.author?.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'inherit' }}>
              <div className="avatar" style={{width:32,height:32}}>
                {post.author?.avatar_url ? <img src={post.author.avatar_url} alt="" /> : post.author?.full_name?.[0]}
              </div>
              <strong>{post.author?.full_name}</strong>
            </Link>
            <span>{timeAgo(post.created_at)}</span>
            {post.place && (
              <span style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <FiMapPin size={14} /> {post.place.name}
              </span>
            )}
            {post.rating && <span>⭐ {post.rating}/5</span>}
          </div>

          <div className="post-content">{post.content}</div>

          {/* Actions */}
          <div className="post-actions-bar">
            <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
              <FiHeart fill={liked ? 'currentColor' : 'none'} /> {likeCount}
            </button>
            <button className="action-btn"><FiMessageCircle /> {comments.length}</button>
            <button className="action-btn"><FiEye /> {post.view_count}</button>
            <button className="action-btn" onClick={handleShare}><FiShare2 /> Chia sẻ</button>
            {isAuthenticated && post.user_id !== user?.id && (
              <button className="action-btn" style={{ marginLeft: 'auto', color: '#dc2626' }} onClick={() => { setReportTarget({ type: 'post', id: post.id }); setShowReportModal(true); }}>
                <FiFlag /> Báo cáo
              </button>
            )}
          </div>

          {/* Comments */}
          <div className="comment-section">
            <h3 style={{ marginBottom: '1rem' }}>Bình luận ({comments.length})</h3>
            {isAuthenticated && (
              <form className="comment-form" onSubmit={handleComment}>
                <div className="avatar">{user?.full_name?.[0]}</div>
                <div style={{ flex: 1 }}>
                  {replyTo && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '0.5rem' }}>
                      Đang trả lời bình luận <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>✕</button>
                    </div>
                  )}
                  <textarea placeholder="Viết bình luận..." value={newComment}
                    onChange={e => setNewComment(e.target.value)} />
                </div>
                <button type="submit" className="btn btn-primary btn-sm"><FiSend /></button>
              </form>
            )}
            {comments.map(c => (
              <div key={c.id}>
                <div className="comment-item">
                  <Link to={`/profile/${c.user?.id}`}>
                    <div className="avatar" style={{width:32,height:32}}>
                      {c.user?.avatar_url ? <img src={c.user.avatar_url} alt="" /> : c.user?.full_name?.[0]}
                    </div>
                  </Link>
                  <div className="comment-body">
                    <div className="comment-author">{c.user?.full_name}</div>
                    <div className="comment-text">{c.content}</div>
                    <div className="comment-actions">
                      <span>{timeAgo(c.created_at)}</span>
                      {isAuthenticated && <button onClick={() => { setReplyTo(c.id); }}>Trả lời</button>}
                      {isAuthenticated && c.user_id !== user?.id && (
                        <button style={{ color: '#dc2626' }} onClick={() => { setReportTarget({ type: 'comment', id: c.id }); setShowReportModal(true); }}>
                          🚩 Báo cáo
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                {c.replies?.length > 0 && (
                  <div className="replies">
                    {c.replies.map(r => (
                      <div key={r.id} className="comment-item">
                        <div className="avatar" style={{width:28,height:28,fontSize:'0.65rem'}}>
                          {r.user?.avatar_url ? <img src={r.user.avatar_url} alt="" /> : r.user?.full_name?.[0]}
                        </div>
                        <div className="comment-body">
                          <div className="comment-author">{r.user?.full_name}</div>
                          <div className="comment-text">{r.content}</div>
                          <div className="comment-actions"><span>{timeAgo(r.created_at)}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Report Modal Popup */}
        {showReportModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
            <div style={{ background: 'white', borderRadius: 12, padding: 24, width: 380, maxWidth: '90vw', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
              <h3 style={{ marginBottom: 16, fontSize: '1.1rem', fontWeight: 700 }}>🚩 Báo cáo vi phạm</h3>
              <select className="form-select" style={{ marginBottom: 16 }} value={reportReason} onChange={e => setReportReason(e.target.value)}>
                <option value="">-- Chọn lý do báo cáo --</option>
                <option value="spam">Spam / Quảng cáo</option>
                <option value="inappropriate">Nội dung thô tục / Nhạy cảm</option>
                <option value="hate_speech">Ngôn từ kích động thù ghét</option>
                <option value="misinformation">Thông tin sai sự thật</option>
                <option value="other">Lý do khác</option>
              </select>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowReportModal(false)}>Hủy</button>
                <button className="btn btn-primary" onClick={handleReport}>Gửi báo cáo</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
