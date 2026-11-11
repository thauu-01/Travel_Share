import reportService from '../services/report.service.js';
import ApiResponse from '../utils/apiResponse.js';

class ReportController {
  async create(req, res, next) {
    try {
      const report = await reportService.createReport(req.user.id, req.body);
      return ApiResponse.created(res, report, 'Báo cáo vi phạm đã được gửi lên hệ thống');
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await reportService.getReportsList(req.query);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const report = await reportService.updateReportStatus(req.params.id, req.body);
      return ApiResponse.success(res, report, 'Đã cập nhật trạng thái báo cáo');
    } catch (err) {
      next(err);
    }
  }
}

const controllerInstance = new ReportController();
export { controllerInstance as ReportController };
export default controllerInstance;
