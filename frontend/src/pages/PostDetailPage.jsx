import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { postAPI, commentAPI, reportAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiHeart, FiMessageCircle, FiEye, FiShare2, FiMapPin, FiSend, FiFlag, FiX } from 'react-icons/fi';

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

  if (loading) return (
    <div className="pt-24 min-h-screen bg-[#f0f7ff] flex justify-center">
      <div className="w-10 h-10 border-4 border-indigo-100 border-t-blue-600 rounded-full animate-spin mt-20"></div>
    </div>
  );
  if (!post) return (
    <div className="pt-24 min-h-screen bg-[#f0f7ff]">
      <div className="max-w-4xl mx-auto px-6 pb-12 flex flex-col items-center justify-center p-12 text-slate-400 bg-white rounded-2xl border-2 border-indigo-100 border-dashed mt-12">
        <div className="text-4xl mb-3">😕</div>
        <p>Không tìm thấy bài viết</p>
      </div>
    </div>
  );

  return (
    <div className="pt-24 min-h-screen bg-[#f0f7ff]">
      <div className="max-w-4xl mx-auto px-6 pb-12">
        <div className="bg-white rounded-3xl p-6 md:p-10 shadow-sm border border-indigo-100 animate-in">
          
          {/* Images */}
          {post.images?.length > 0 && (
            <div className={`grid gap-3 rounded-2xl overflow-hidden mb-8 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {post.images.map(img => (
                <img key={img.id} src={img.image_url} alt="" className="w-full h-[300px] object-cover hover:scale-105 transition-transform duration-500" />
              ))}
            </div>
          )}

          {/* Header */}
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6 leading-tight">{post.title}</h1>
          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500 mb-8 pb-6 border-b border-indigo-50">
            <Link to={`/profile/${post.author?.id}`} className="flex items-center gap-3 text-slate-900 hover:text-blue-600 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold overflow-hidden shadow-sm">
                {post.author?.avatar_url ? <img src={post.author.avatar_url} alt="" className="w-full h-full object-cover" /> : post.author?.full_name?.[0]}
              </div>
              <strong className="font-bold">{post.author?.full_name}</strong>
            </Link>
            <span className="flex items-center gap-1.5 opacity-80 bg-gray-50 px-3 py-1.5 rounded-lg">{timeAgo(post.created_at)}</span>
            {post.place && (
              <span className="flex items-center gap-1.5 text-blue-600 font-medium bg-blue-50 px-3 py-1.5 rounded-lg">
                <FiMapPin size={14} /> {post.place.name}
              </span>
            )}
            {post.rating && <span className="flex items-center gap-1.5 text-amber-500 font-bold bg-amber-50 px-3 py-1.5 rounded-lg">⭐ {post.rating}/5</span>}
          </div>

          {/* Content */}
          <div className="text-slate-700 leading-relaxed text-lg mb-10 whitespace-pre-wrap">{post.content}</div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 py-4 border-t border-b border-indigo-50 mb-10">
            <button 
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border-none cursor-pointer ${liked ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600'}`} 
              onClick={handleLike}
            >
              <FiHeart fill={liked ? 'currentColor' : 'none'} size={18} /> {likeCount}
            </button>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-gray-50 text-slate-600 border-none cursor-default">
              <FiMessageCircle size={18} /> {comments.length}
            </button>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-gray-50 text-slate-600 border-none cursor-default">
              <FiEye size={18} /> {post.view_count}
            </button>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-gray-50 text-slate-600 hover:bg-blue-50 hover:text-blue-600 border-none cursor-pointer" onClick={handleShare}>
              <FiShare2 size={18} /> Chia sẻ
            </button>
            {isAuthenticated && post.user_id !== user?.id && (
              <button 
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all bg-gray-50 text-red-500 hover:bg-red-100 border-none cursor-pointer ml-auto" 
                onClick={() => { setReportTarget({ type: 'post', id: post.id }); setShowReportModal(true); }}
              >
                <FiFlag size={16} /> Báo cáo
              </button>
            )}
          </div>

          {/* Comments */}
          <div className="mt-8">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Bình luận ({comments.length})</h3>
            
            {isAuthenticated ? (
              <form className="flex gap-4 mb-10 bg-gray-50 p-5 rounded-2xl border border-gray-100" onSubmit={handleComment}>
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-sm overflow-hidden">
                  {user?.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" /> : user?.full_name?.[0]}
                </div>
                <div className="flex-1">
                  {replyTo && (
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-3 bg-blue-50 px-3 py-1.5 rounded-lg w-fit">
                      Đang trả lời bình luận 
                      <button type="button" onClick={() => setReplyTo(null)} className="bg-transparent border-none text-red-500 hover:text-red-700 cursor-pointer p-0 ml-1">
                        <FiX size={14} />
                      </button>
                    </div>
                  )}
                  <textarea 
                    className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none shadow-sm" 
                    placeholder="Viết bình luận của bạn..." 
                    rows={2}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)} 
                  />
                  <div className="flex justify-end mt-3">
                    <button type="submit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all border-none cursor-pointer shadow-sm">
                      <FiSend size={14} /> Gửi bình luận
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="text-center p-6 bg-gray-50 rounded-2xl border border-gray-100 mb-10 text-slate-500">
                Vui lòng <Link to="/login" className="text-blue-600 font-bold hover:underline">đăng nhập</Link> để bình luận
              </div>
            )}

            <div className="space-y-8">
              {comments.map(c => (
                <div key={c.id} className="group">
                  <div className="flex gap-4">
                    <Link to={`/profile/${c.user?.id}`} className="shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-sm overflow-hidden">
                        {c.user?.avatar_url ? <img src={c.user.avatar_url} alt="" className="w-full h-full object-cover" /> : c.user?.full_name?.[0]}
                      </div>
                    </Link>
                    <div className="flex-1">
                      <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-none border border-gray-100">
                        <div className="font-bold text-slate-900 text-sm mb-1">{c.user?.full_name}</div>
                        <div className="text-slate-700 text-sm leading-relaxed">{c.content}</div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-2 px-2">
                        <span>{timeAgo(c.created_at)}</span>
                        {isAuthenticated && (
                          <button className="bg-transparent border-none text-slate-500 hover:text-blue-600 cursor-pointer p-0 transition-colors" onClick={() => { setReplyTo(c.id); }}>
                            Trả lời
                          </button>
                        )}
                        {isAuthenticated && c.user_id !== user?.id && (
                          <button className="bg-transparent border-none text-slate-400 hover:text-red-500 cursor-pointer p-0 transition-colors ml-auto opacity-0 group-hover:opacity-100" onClick={() => { setReportTarget({ type: 'comment', id: c.id }); setShowReportModal(true); }}>
                            <FiFlag size={12} className="inline mr-1" /> Báo cáo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {c.replies?.length > 0 && (
                    <div className="pl-14 mt-4 space-y-4">
                      {c.replies.map(r => (
                        <div key={r.id} className="flex gap-3 group/reply">
                          <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-bold shadow-sm overflow-hidden shrink-0">
                            {r.user?.avatar_url ? <img src={r.user.avatar_url} alt="" className="w-full h-full object-cover" /> : r.user?.full_name?.[0]}
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 p-3 rounded-2xl rounded-tl-none border border-gray-100">
                              <div className="font-bold text-slate-900 text-sm mb-1">{r.user?.full_name}</div>
                              <div className="text-slate-700 text-sm leading-relaxed">{r.content}</div>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 mt-1.5 px-2">
                              <span>{timeAgo(r.created_at)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Report Modal Popup */}
        {showReportModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[1000] p-4">
            <div className="bg-white rounded-2xl p-6 w-[400px] max-w-full shadow-2xl animate-in">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FiFlag className="text-red-500" /> Báo cáo vi phạm
              </h3>
              <p className="text-sm text-slate-500 mb-4">Vui lòng chọn lý do báo cáo để admin có thể xử lý.</p>
              
              <select 
                className="w-full mb-6 px-4 py-3 rounded-xl border border-indigo-100 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm cursor-pointer" 
                value={reportReason} 
                onChange={e => setReportReason(e.target.value)}
              >
                <option value="">-- Chọn lý do --</option>
                <option value="spam">Spam / Quảng cáo</option>
                <option value="inappropriate">Nội dung thô tục / Nhạy cảm</option>
                <option value="hate_speech">Ngôn từ kích động thù ghét</option>
                <option value="misinformation">Thông tin sai sự thật</option>
                <option value="other">Lý do khác</option>
              </select>
              
              <div className="flex gap-3 justify-end">
                <button 
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-slate-700 hover:bg-gray-200 transition-colors border-none cursor-pointer" 
                  onClick={() => setShowReportModal(false)}
                >
                  Hủy
                </button>
                <button 
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors border-none cursor-pointer shadow-sm" 
                  onClick={handleReport}
                >
                  Gửi báo cáo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
