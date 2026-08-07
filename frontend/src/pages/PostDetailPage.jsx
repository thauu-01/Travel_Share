import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { postAPI, commentAPI, reportAPI } from '../services/api';
import toast from 'react-hot-toast';
import { FiHeart, FiMessageCircle, FiEye, FiShare2, FiMapPin, FiSend, FiFlag, FiX, FiChevronLeft, FiChevronRight, FiZoomIn, FiCalendar } from 'react-icons/fi';

// ─── Image Carousel ───────────────────────────────────────────────────────────
function ImageCarousel({ images }) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef(null);
  const total = images.length;

  const prev = useCallback(() => setCurrent(c => (c - 1 + total) % total), [total]);
  const next = useCallback(() => setCurrent(c => (c + 1) % total), [total]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (lightbox) {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
        if (e.key === 'Escape') setLightbox(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightbox, prev, next]);

  // Touch / drag swipe
  const onDragStart = (e) => {
    dragStart.current = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
    setIsDragging(false);
  };
  const onDragEnd = (e) => {
    if (dragStart.current === null) return;
    const endX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
    const diff = dragStart.current - endX;
    if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); setIsDragging(true); }
    dragStart.current = null;
  };

  if (total === 1) {
    return (
      <div className="relative rounded-2xl overflow-hidden mb-8 group cursor-zoom-in" onClick={() => setLightbox(true)}>
        <img src={images[0].image_url} alt="" className="w-full max-h-[520px] object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center">
          <FiZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
        </div>
        {lightbox && <Lightbox images={images} current={0} onClose={() => setLightbox(false)} onPrev={prev} onNext={next} total={total} />}
      </div>
    );
  }

  return (
    <div className="relative mb-8 select-none">
      {/* Main slide — height cố định, mỗi slide absolute positioned */}
      <div
        className="relative rounded-2xl overflow-hidden bg-slate-900 cursor-grab active:cursor-grabbing"
        style={{ height: '480px' }}
        onMouseDown={onDragStart} onMouseUp={onDragEnd}
        onTouchStart={onDragStart} onTouchEnd={onDragEnd}
      >
        {images.map((img, idx) => (
          <div
            key={img.id ?? idx}
            className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]"
            style={{
              // Mỗi slide dịch chuyển theo vị trí tương đối với slide hiện tại
              // 100% = chiều rộng của chính slide đó (= chiều rộng container)
              transform: `translateX(${(idx - current) * 100}%)`,
            }}
          >
            <img
              src={img.image_url}
              alt={`Ảnh ${idx + 1}`}
              className="max-w-full max-h-full object-contain"
              draggable={false}
              onMouseDown={e => e.stopPropagation()}
              onClick={() => { if (!isDragging) setLightbox(true); }}
              style={{ cursor: 'zoom-in' }}
            />
          </div>
        ))}

        {/* Gradient overlays */}
        <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-black/25 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-black/25 to-transparent pointer-events-none z-10" />

        {/* Arrow buttons */}
        <button
          onMouseDown={e => { e.stopPropagation(); prev(); }}
          className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm text-slate-800 flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all border-none cursor-pointer z-20"
        >
          <FiChevronLeft size={20} />
        </button>
        <button
          onMouseDown={e => { e.stopPropagation(); next(); }}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm text-slate-800 flex items-center justify-center shadow-lg hover:bg-white hover:scale-110 transition-all border-none cursor-pointer z-20"
        >
          <FiChevronRight size={20} />
        </button>

        {/* Counter badge */}
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full z-20">
          {current + 1} / {total}
        </div>

        {/* Zoom hint */}
        <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs px-2.5 py-1.5 rounded-full z-20 flex items-center gap-1.5 opacity-70 pointer-events-none">
          <FiZoomIn size={11} /> Nhấn để phóng to
        </div>
      </div>


      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-3">
        {images.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`transition-all duration-300 rounded-full border-none cursor-pointer ${
              idx === current
                ? 'w-6 h-2 bg-blue-600'
                : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'
            }`}
          />
        ))}
      </div>

      {/* Thumbnail strip */}
      {total > 2 && (
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={img.id ?? idx}
              onClick={() => setCurrent(idx)}
              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                idx === current ? 'border-blue-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-90'
              }`}
            >
              <img src={img.image_url} alt="" className="w-full h-full object-cover" draggable={false} />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <Lightbox
          images={images}
          current={current}
          onClose={() => setLightbox(false)}
          onPrev={prev}
          onNext={next}
          total={total}
          setCurrent={setCurrent}
        />
      )}
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ images, current, onClose, onPrev, onNext, total, setCurrent }) {
  // Portal renders ra document.body, thoát khỏi mọi CSS transform/containment
  // QUAN TRỌNG: stopPropagation trên tất cả children để tránh carousel's
  // onMouseDown/onMouseUp bắt event qua React portal event bubbling
  return createPortal(
    <div
      className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center"
      style={{ zIndex: 99999 }}
      // Dùng onMouseDown thay onClick để đóng khi click backdrop
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Close button — stopPropagation để không bị carousel intercept */}
      <button
        onMouseDown={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all border-none cursor-pointer"
        style={{ zIndex: 100000 }}
        aria-label="Đóng"
      >
        <FiX size={22} />
      </button>

      {/* Counter */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/10 text-white text-sm font-bold px-4 py-1.5 rounded-full select-none"
        onMouseDown={e => e.stopPropagation()}
      >
        {current + 1} / {total}
      </div>

      {/* Image */}
      <img
        src={images[current].image_url}
        alt=""
        className="max-w-[92vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
        onMouseDown={e => e.stopPropagation()}
        draggable={false}
      />

      {/* Prev / Next */}
      {total > 1 && (
        <>
          <button
            onMouseDown={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all border-none cursor-pointer"
          >
            <FiChevronLeft size={24} />
          </button>
          <button
            onMouseDown={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all border-none cursor-pointer"
          >
            <FiChevronRight size={24} />
          </button>
        </>
      )}

      {/* Dot strip */}
      {total > 1 && setCurrent && (
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2"
          onMouseDown={e => e.stopPropagation()}
        >
          {images.map((_, idx) => (
            <button
              key={idx}
              onMouseDown={(e) => { e.stopPropagation(); setCurrent(idx); }}
              className={`rounded-full border-none cursor-pointer transition-all duration-300 ${
                idx === current ? 'w-6 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
              }`}
            />
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}


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
  const [showTripTimeline, setShowTripTimeline] = useState(false);

  // Report violation state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTarget, setReportTarget] = useState({ type: '', id: null });
  const [reportReason, setReportReason] = useState('');

  const isAuthor = user && post ? String(post.user_id) === String(user.id || user._id) : false;

  useEffect(() => { fetchPost(); }, [id]);

  const fetchPost = async () => {
    try {
      const res = await postAPI.getById(id);
      const p = res.data.data;
      setPost(p);
      if (p?.title) document.title = `${p.title} | TravelShare`;
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
          
          {/* Images - Carousel */}
          {post.images?.length > 0 && (
            <ImageCarousel images={post.images} />
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

          {/* Attached Trip Card — Light Sky Blue */}
          {post.trip ? (
            <div className="mb-10 bg-gradient-to-r from-sky-100 via-blue-50 to-sky-200/80 text-slate-900 border border-sky-200/80 rounded-2xl p-6 shadow-sm animate-in">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold bg-sky-200/80 text-sky-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      🗺️ Lịch trình du lịch đính kèm
                    </span>
                    <span className="text-xs bg-sky-200/80 text-sky-800 font-bold px-2.5 py-1 rounded-full">
                      {post.trip.total_days || post.trip.days?.length || 1} ngày
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900 truncate">{post.trip.title}</h3>
                  {post.trip.description && (
                    <p className="text-slate-600 text-xs mt-1 line-clamp-2">{post.trip.description}</p>
                  )}
                  {post.trip.days?.length > 0 && !showTripTimeline && (
                    <div className="flex flex-wrap gap-2 mt-3 text-xs text-sky-900">
                      {post.trip.days.map((d, i) => (
                        <span key={d.id || i} className="bg-white/80 border border-sky-200/60 px-2.5 py-1 rounded-lg">
                          Ngày {d.day_number}: {d.places?.length || 0} điểm đến
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setShowTripTimeline(!showTripTimeline)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs bg-white text-sky-800 border border-sky-300 hover:bg-sky-50 transition-all cursor-pointer shadow-sm"
                  >
                    {showTripTimeline ? 'Thu gọn ▲' : 'Xem chi tiết tại đây ▼'}
                  </button>
                  <Link
                    to={`/trips?id=${post.trip.id || post.trip._id}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-sky-500 text-white hover:bg-sky-600 transition-all shadow-md shadow-sky-500/20 shrink-0 border-none no-underline hover:scale-105"
                  >
                    <FiCalendar size={14} /> Mở trang Lịch trình <FiChevronRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Inline Full Days & Places Expansion */}
              {showTripTimeline && (
                <div className="mt-6 pt-5 border-t border-sky-200/80 bg-white/90 backdrop-blur-sm rounded-xl p-5 space-y-4 animate-in">
                  <h4 className="font-extrabold text-sm text-slate-800 uppercase tracking-wide flex items-center gap-2">
                    <span>📍 Lịch trình chi tiết theo từng ngày</span>
                    <span className="text-xs text-slate-400 font-normal">({post.trip.days?.length || 0} ngày)</span>
                  </h4>
                  {(!post.trip.days || post.trip.days.length === 0) ? (
                    <p className="text-xs text-slate-500 italic">Chưa có ngày nào trong lịch trình này.</p>
                  ) : (
                    <div className="space-y-4">
                      {post.trip.days.map(day => (
                        <div key={day.id || day._id} className="bg-sky-50/60 rounded-xl p-4 border border-sky-100">
                          <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
                              {day.day_number}
                            </span>
                            <span>Ngày {day.day_number}</span>
                            {day.note && <span className="text-slate-500 font-normal italic text-xs">— {day.note}</span>}
                          </div>
                          {day.places?.length > 0 ? (
                            <div className="mt-3 ml-9 space-y-2">
                              {day.places.map((tp, pIdx) => (
                                <div key={tp.id || pIdx} className="flex items-start gap-3 text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                                  <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                                    {pIdx + 1}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-slate-800 text-sm">{tp.place?.name || 'Địa điểm'}</div>
                                    <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                                      <FiMapPin size={11} className="text-blue-500" /> {tp.place?.province || 'Việt Nam'}
                                    </div>
                                    {tp.note && <div className="text-xs text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg">{tp.note}</div>}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic mt-2 ml-9">Chưa có địa điểm trong ngày này</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (post.trip_id && isAuthor) ? (
            <div className="mb-10 p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-amber-800 text-sm flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span>🔒 Lịch trình đính kèm của bạn đang ở chế độ <strong>Riêng tư</strong> (Đang ẩn khỏi bài viết đối với độc giả khác).</span>
              </div>
              <Link
                to={`/trips?id=${post.trip_id}`}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold no-underline transition-colors shrink-0"
              >
                Đổi sang Công khai 🌐
              </Link>
            </div>
          ) : null}

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
