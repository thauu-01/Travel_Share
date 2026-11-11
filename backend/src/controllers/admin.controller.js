import adminService from '../services/admin.service.js';
import categoryService from '../services/category.service.js';
import placeService from '../services/place.service.js';
import reportService from '../services/report.service.js';
import ApiResponse from '../utils/apiResponse.js';

class AdminController {
  async getDashboard(req, res, next) {
    try {
      const data = await adminService.getDashboardData();
      return ApiResponse.success(res, data);
    } catch (err) {
      next(err);
    }
  }

  // Users
  async getUsers(req, res, next) {
    try {
      const result = await adminService.getUsers(req.query);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async banUser(req, res, next) {
    try {
      const result = await adminService.banUser(req.params.id, req.user.id);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  async unbanUser(req, res, next) {
    try {
      const result = await adminService.unbanUser(req.params.id);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  async changeRole(req, res, next) {
    try {
      const result = await adminService.changeUserRole(req.params.id, req.body.role, req.user.id);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const result = await adminService.deleteUser(req.params.id, req.user.id);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  // Posts
  async getPosts(req, res, next) {
    try {
      const result = await adminService.getAdminPosts(req.query);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async togglePostVisibility(req, res, next) {
    try {
      const result = await adminService.togglePostVisibility(req.params.id);
      return ApiResponse.success(res, result.post, result.message);
    } catch (err) {
      next(err);
    }
  }

  async deletePost(req, res, next) {
    try {
      const result = await adminService.deletePost(req.params.id);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  // Places
  async createPlace(req, res, next) {
    try {
      const place = await placeService.createPlace(req.user.id, req.body, req.file);
      return ApiResponse.created(res, place, 'Tạo địa điểm thành công');
    } catch (err) {
      next(err);
    }
  }

  // Categories
  async createCategory(req, res, next) {
    try {
      const category = await categoryService.createCategory(req.body);
      return ApiResponse.created(res, category, 'Tạo danh mục thành công');
    } catch (err) {
      next(err);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const category = await categoryService.updateCategory(req.params.id, req.body);
      return ApiResponse.success(res, category, 'Cập nhật danh mục thành công');
    } catch (err) {
      next(err);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const result = await categoryService.deleteCategory(req.params.id);
      return ApiResponse.success(res, null, result.message);
    } catch (err) {
      next(err);
    }
  }

  // Reports
  async getReports(req, res, next) {
    try {
      const result = await reportService.getReportsList(req.query);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async updateReport(req, res, next) {
    try {
      const report = await reportService.updateReportStatus(req.params.id, req.body);
      return ApiResponse.success(res, report, 'Cập nhật báo cáo thành công');
    } catch (err) {
      next(err);
    }
  }

  // Transactions
  async getTransactions(req, res, next) {
    try {
      const result = await adminService.getTransactions(req.query);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  // Support Chat
  async getSupportConversations(req, res, next) {
    try {
      const convs = await adminService.getSupportConversations();
      return ApiResponse.success(res, convs);
    } catch (err) {
      next(err);
    }
  }

  async getSupportMessages(req, res, next) {
    try {
      const msgs = await adminService.getSupportMessages(req.params.userId);
      return ApiResponse.success(res, msgs);
    } catch (err) {
      next(err);
    }
  }

  async sendSupportReply(req, res, next) {
    try {
      const io = req.app.get('io');
      const msg = await adminService.sendSupportReply(
        req.params.userId,
        req.user.id,
        req.body.message,
        io
      );
      return ApiResponse.created(res, msg, 'Đã gửi phản hồi hỗ trợ');
    } catch (err) {
      next(err);
    }
  }
}

const controllerInstance = new AdminController();
export { controllerInstance as AdminController };
export default controllerInstance;
