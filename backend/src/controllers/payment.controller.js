import paymentService from '../services/payment.service.js';
import { getClientIp } from '../utils/vnpay.util.js';
import ApiResponse from '../utils/apiResponse.js';

class PaymentController {
  async createPaymentUrl(req, res, next) {
    try {
      const clientIp = getClientIp(req);
      const { packageId } = req.body;
      const result = await paymentService.createPaymentUrl(req.user.id, packageId, clientIp);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async vnpayReturn(req, res, next) {
    try {
      const result = await paymentService.verifyVnpayCallback(req.query);
      return ApiResponse.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async vnpayIpn(req, res, next) {
    try {
      const result = await paymentService.verifyVnpayCallback(req.query);
      if (result.isValid) {
        return res.status(200).json({ RspCode: '00', Message: 'Confirm Success' });
      }
      return res.status(200).json({ RspCode: '97', Message: 'Invalid Checksum' });
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req, res, next) {
    try {
      const history = await paymentService.getUserPayments(req.user.id);
      return ApiResponse.success(res, history);
    } catch (err) {
      next(err);
    }
  }
}

const controllerInstance = new PaymentController();
export { controllerInstance as PaymentController };
export default controllerInstance;
