import { validate } from './validate.js';

const createPaymentRules = [
  (req) => {
    const { packageId } = req.body || {};
    if (packageId && typeof packageId !== 'string') {
      return 'Mã gói dịch vụ không hợp lệ';
    }
    return null;
  }
];

export const validateCreatePayment = validate(createPaymentRules);

export default {
  validateCreatePayment
};
