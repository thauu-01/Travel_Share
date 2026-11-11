import BaseRepository from './base.repository.js';
import { Report } from '../models/index.js';

class ReportRepository extends BaseRepository {
  constructor() {
    super(Report);
  }

  async getReportsList({ status, target_type, page = 1, limit = 20 }) {
    const limitNum = parseInt(limit);
    const skipNum = (parseInt(page) - 1) * limitNum;

    const where = {};
    if (status) where.status = status;
    if (target_type) where.target_type = target_type;

    const count = await this.model.countDocuments(where);
    const reports = await this.model.find(where)
      .populate('reporter', 'id full_name email avatar_url')
      .sort({ created_at: -1 })
      .limit(limitNum)
      .skip(skipNum);

    return {
      reports,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum)
      }
    };
  }

  async findPendingUserReport(reporterId, targetType, targetId) {
    return await this.model.findOne({
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      status: 'pending'
    });
  }
}

const repoInstance = new ReportRepository();
export { repoInstance as ReportRepository };
export default repoInstance;
