/**
 * Comment Routes — Quản lý bình luận
 *
 * USER routes (dùng mergeParams để truy cập postId từ parent router):
 *   GET    /api/posts/:postId/comments         — Lấy danh sách comment của bài viết
 *   POST   /api/posts/:postId/comments         — Đăng bình luận mới
 *   DELETE /api/posts/:postId/comments/:commentId — Xóa bình luận (của mình hoặc admin)
 *
 * ADMIN routes (flat, dùng prefix /api/comments trực tiếp):
 *   GET    /api/comments                       — Lấy toàn bộ comment (admin)
 *   DELETE /api/comments/:id                   — Xóa comment bất kỳ (admin)
 */

const router = require('express').Router({ mergeParams: true });
const comment = require('../controllers/CommentController');
const admin = require('../controllers/AdminController');
const { authenticate, requireAdmin } = require('../middlewares/auth');

// ── USER ROUTES ──────────────────────────────────────────────
router.get('/', comment.getByPost);
router.post('/', authenticate, comment.create);
router.delete('/:commentId', authenticate, comment.delete);

// ── ADMIN ROUTES (mounted at /api/comments) ──────────────────
// NOTE: These only activate when mounted at /api/comments (not nested under /posts/:postId/comments)
// because mergeParams won't have postId in that context.
router.get('/admin/all', authenticate, requireAdmin, admin.getComments);
router.delete('/admin/:id', authenticate, requireAdmin, admin.deleteComment);

module.exports = router;
