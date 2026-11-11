import { validate } from './validate.js';

const createReportRules = [
  (req) => {
    const { target_type, target_id, reason } = req.body || {};
    if (!target_type || !target_id || !reason) {
      return 'Vui lòng cung cấp đầy đủ thông tin báo cáo (target_type, target_id, reason)';
    }
    return null;
  }
];

export const validateCreateReport = validate(createReportRules);

export default {
  validateCreateReport
};
