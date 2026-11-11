import reportRepository from '../repositories/report.repository.js';
import ApiError from '../utils/apiError.js';

class ReportService {
  async createReport(reporterId, { target_type, target_id, reason, description }) {
    const existing = await reportRepository.findPendingUserReport(reporterId, target_type, target_id);
    if (existing) {
      throw ApiError.badRequest('Bạn đã báo cáo nội dung này rồi và đang chờ xử lý');
    }

    return await reportRepository.create({
      reporter_id: reporterId,
      target_type,
      target_id,
      reason,
      description: description || ''
    });
  }

  async getReportsList(queryParams) {
    return await reportRepository.getReportsList(queryParams);
  }

  async updateReportStatus(reportId, { status, admin_note }) {
    const report = await reportRepository.findById(reportId);
    if (!report) throw ApiError.notFound('Không tìm thấy báo cáo');

    if (status) report.status = status;
    if (admin_note !== undefined) report.admin_note = admin_note;

    await report.save();
    return report;
  }
}

const serviceInstance = new ReportService();
export { serviceInstance as ReportService };
export default serviceInstance;
