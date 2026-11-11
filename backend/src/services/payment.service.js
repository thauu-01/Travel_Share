import qs from 'qs';
import vnpayConfig from '../config/vnpay.config.js';
import { sortObject, computeHmacFromSorted, getVNPayDateFormat } from '../utils/vnpay.util.js';
import paymentRepository from '../repositories/payment.repository.js';
import userRepository from '../repositories/user.repository.js';
import appEventEmitter from '../events/eventEmitter.js';
import eventTypes from '../events/eventTypes.js';
import ApiError from '../utils/apiError.js';

class PaymentService {
  async createPaymentUrl(userId, packageId = 'ai_5credits', clientIp = '127.0.0.1') {
    const pkg = vnpayConfig.packages[packageId];
    if (!pkg) {
      throw ApiError.badRequest('Gói nâng cấp không hợp lệ');
    }

    const txn_ref = `TS${Date.now()}${userId}`;
    const createDate = getVNPayDateFormat();

    // Lưu đơn hàng trạng thái pending
    await paymentRepository.create({
      user_id: userId,
      txn_ref,
      amount: pkg.amount,
      credits_purchased: pkg.credits,
      order_info: pkg.description,
      status: 'pending'
    });

    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: vnpayConfig.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txn_ref,
      vnp_OrderInfo: pkg.description,
      vnp_OrderType: 'other',
      vnp_Amount: pkg.amount * 100, // VNPay quy định nhân 100
      vnp_ReturnUrl: vnpayConfig.returnUrl,
      vnp_IpAddr: clientIp,
      vnp_CreateDate: createDate
    };

    vnp_Params = sortObject(vnp_Params);
    const signed = computeHmacFromSorted(vnp_Params, vnpayConfig.hashSecret);
    vnp_Params['vnp_SecureHash'] = signed;

    const paymentUrl = `${vnpayConfig.url}?${qs.stringify(vnp_Params, { encode: false })}`;
    return { paymentUrl, txn_ref };
  }

  async verifyVnpayCallback(vnp_Params) {
    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const sortedParams = sortObject(vnp_Params);
    const signed = computeHmacFromSorted(sortedParams, vnpayConfig.hashSecret);

    const isSignatureValid = secureHash === signed;
    const isSuccess = isSignatureValid && vnp_Params['vnp_ResponseCode'] === '00';
    const txn_ref = vnp_Params['vnp_TxnRef'];

    const payment = await paymentRepository.findByTxnRef(txn_ref);

    if (payment && payment.status === 'pending' && isSuccess) {
      payment.status = 'success';
      payment.bank_code = vnp_Params['vnp_BankCode'] || null;
      payment.vnp_transaction_no = vnp_Params['vnp_TransactionNo'] || null;
      await payment.save();

      // Cộng lượt dùng AI VIP cho user
      await userRepository.addAiCredits(payment.user_id, payment.credits_purchased);

      // Kích hoạt sự kiện thanh toán thành công
      appEventEmitter.emit(eventTypes.PAYMENT_SUCCESS, {
        userId: payment.user_id,
        credits: payment.credits_purchased,
        orderInfo: payment.order_info
      });
    }

    return {
      isValid: isSignatureValid,
      isSuccess,
      payment
    };
  }

  async getUserPayments(userId) {
    return await paymentRepository.getUserPayments(userId);
  }
}

const serviceInstance = new PaymentService();
export { serviceInstance as PaymentService };
export default serviceInstance;
