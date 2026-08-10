const crypto = require('crypto');
const qs = require('qs');
const { Payment, User } = require('../models');

// ─── Cấu hình Gói VIP (Server-side) ───────────────────────────────────────────
const PACKAGES = {
  ai_5credits: {
    amount: 50000,       // VNĐ
    credits: 5,
    description: 'VIP 5 luot AI Trip Generator - TravelShare'
  }
};

// ─── VNPay Standard Helpers ───────────────────────────────────────────────────
function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

function computeHmacFromSorted(sortedObj, secretKey) {
  const secret = (secretKey || '').trim();
  const signData = qs.stringify(sortedObj, { encode: false });
  const hmac = crypto.createHmac('sha512', secret);
  return hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
}

function getVNPayDateFormat(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map(p => [p.type, p.value]));
  const hour = parts.hour === '24' ? '00' : parts.hour;
  return `${parts.year}${parts.month}${parts.day}${hour}${parts.minute}${parts.second}`;
}

// ─── Controller ───────────────────────────────────────────────────────────────
class PaymentController {

  // POST /api/payment/vnpay-create
  async createPaymentUrl(req, res) {
    try {
      const { packageId = 'ai_5credits' } = req.body;
      const pkg = PACKAGES[packageId];
      if (!pkg) {
        return res.status(400).json({ success: false, message: 'Gói không hợp lệ' });
      }

      const txn_ref = `TS${Date.now()}${req.user.id}`;
      const createDate = getVNPayDateFormat();

      // Lưu đơn hàng pending
      await Payment.create({
        user_id: req.user.id,
        txn_ref,
        amount: pkg.amount,
        credits_purchased: pkg.credits,
        order_info: pkg.description,
        status: 'pending'
      });

      let ipAddr = req.headers['x-forwarded-for'] ||
        req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.ip || '127.0.0.1';

      if (typeof ipAddr === 'string') {
        ipAddr = ipAddr.split(',')[0].trim();
        if (ipAddr.includes('::ffff:')) {
          ipAddr = ipAddr.replace('::ffff:', '');
        }
      }
      if (!ipAddr || ipAddr === '::1' || typeof ipAddr !== 'string' || !/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ipAddr)) {
        ipAddr = '127.0.0.1';
      }

      const tmnCode = (process.env.VNPAY_TMN_CODE || '').trim();
      const secretKey = (process.env.VNPAY_HASH_SECRET || '').trim();

      let vnp_Params = {
        vnp_Version: '2.1.0',
        vnp_Command: 'pay',
        vnp_TmnCode: tmnCode,
        vnp_Locale: 'vn',
        vnp_CurrCode: 'VND',
        vnp_TxnRef: txn_ref,
        vnp_OrderInfo: pkg.description,
        vnp_OrderType: 'other',
        vnp_Amount: pkg.amount * 100,
        vnp_ReturnUrl: process.env.VNPAY_RETURN_URL,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate
      };

      // 1. Sort tham số duy nhất 1 lần
      let sortedParams = sortObject(vnp_Params);

      // 2. Tính chữ ký HMAC SHA512 từ sortedParams
      const signed = computeHmacFromSorted(sortedParams, secretKey);

      // 3. Gắn chữ ký vào sortedParams
      sortedParams['vnp_SecureHash'] = signed;

      // 4. Tạo URL thanh toán
      const paymentUrl = `${process.env.VNPAY_URL}?${qs.stringify(sortedParams, { encode: false })}`;

      console.log(`[VNPay] Generated payment URL for order ${txn_ref}:`, paymentUrl);

      res.json({ success: true, data: { paymentUrl, txn_ref } });
    } catch (error) {
      console.error('createPaymentUrl error:', error);
      res.status(500).json({ success: false, message: 'Lỗi tạo URL thanh toán' });
    }
  }

  // GET /api/payment/vnpay-return  — Redirect trình duyệt về sau khi thanh toán
  async vnpayReturn(req, res) {
    try {
      let vnp_Params = { ...req.query };
      const secureHash = vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHashType'];

      let sortedParams = sortObject(vnp_Params);
      const signed = computeHmacFromSorted(sortedParams, process.env.VNPAY_HASH_SECRET);

      const clientHost = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
      const clientProto = req.headers['x-forwarded-proto'] || 'http';
      let clientBase = `${clientProto}://${clientHost}`;
      if (clientBase.includes(':5173')) {
        clientBase = clientBase.replace(':5173', '');
      }

      if (secureHash !== signed) {
        console.warn('[VNPAY RETURN] Hash mismatch');
        return res.redirect(`${clientBase}/payment/return?error=invalid_signature`);
      }

      const txn_ref = vnp_Params['vnp_TxnRef'];
      const vnp_ResponseCode = vnp_Params['vnp_ResponseCode'];
      const vnp_TransactionStatus = vnp_Params['vnp_TransactionStatus'];

      // ✅ Cập nhật ngay trạng thái giao dịch nếu chưa được IPN cập nhật
      const payment = await Payment.findOne({ txn_ref });
      if (payment && payment.status === 'pending') {
        if (vnp_ResponseCode === '00' && (vnp_TransactionStatus === '00' || !vnp_TransactionStatus)) {
          payment.status = 'success';
          payment.vnp_response_code = vnp_ResponseCode;
          await payment.save();

          await User.findByIdAndUpdate(payment.user_id, {
            $inc: { ai_credits: payment.credits_purchased }
          });
          console.log(`[RETURN] ✅ Success: ${txn_ref} | +${payment.credits_purchased} credits → user ${payment.user_id}`);
        } else {
          payment.status = 'failed';
          payment.vnp_response_code = vnp_ResponseCode;
          await payment.save();
          console.warn(`[RETURN] ❌ Failed: ${txn_ref} | ResponseCode: ${vnp_ResponseCode}`);
        }
      }

      res.redirect(`${clientBase}/payment/return?txn_ref=${txn_ref}`);
    } catch (error) {
      console.error('vnpayReturn error:', error);
      res.redirect(`/payment/return?error=server_error`);
    }
  }

  // GET /api/payment/vnpay-ipn  — Server-to-Server callback (nguồn tin cậy duy nhất)
  async vnpayIpn(req, res) {
    try {
      let vnp_Params = { ...req.query };
      const secureHash = vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHash'];
      delete vnp_Params['vnp_SecureHashType'];

      let sortedParams = sortObject(vnp_Params);
      const signed = computeHmacFromSorted(sortedParams, process.env.VNPAY_HASH_SECRET);
      if (secureHash !== signed) {
        console.warn('[IPN] Invalid signature:', req.query.vnp_TxnRef);
        return res.json({ RspCode: '97', Message: 'Invalid Signature' });
      }

      const txn_ref = vnp_Params['vnp_TxnRef'];
      const vnp_ResponseCode = vnp_Params['vnp_ResponseCode'];
      const vnp_TransactionStatus = vnp_Params['vnp_TransactionStatus'];
      const vnp_Amount = parseInt(vnp_Params['vnp_Amount']);

      console.log('[IPN] Received:', { txn_ref, vnp_ResponseCode, vnp_TransactionStatus, vnp_Amount });

      // Bước 2: Kiểm tra Payment tồn tại
      const payment = await Payment.findOne({ txn_ref });
      if (!payment) {
        return res.json({ RspCode: '01', Message: 'Order Not Found' });
      }

      // Bước 3: Idempotency Guard — bảo vệ TẤT CẢ trạng thái cuối (success, expired, failed)
      if (['success', 'expired', 'failed'].includes(payment.status)) {
        return res.json({ RspCode: '02', Message: 'Order Already Confirmed' });
      }

      // Bước 4: Kiểm tra hết hạn 15 phút (chỉ áp dụng cho status = 'pending')
      const TIMEOUT_MS = 15 * 60 * 1000;
      if (Date.now() - payment.createdAt.getTime() > TIMEOUT_MS) {
        payment.status = 'expired';
        await payment.save();
        console.warn('[IPN] Order expired:', txn_ref);
        return res.json({ RspCode: '01', Message: 'Order Not Found' });
      }

      // Bước 5: Kiểm tra ResponseCode và TransactionStatus
      if (vnp_ResponseCode !== '00' || vnp_TransactionStatus !== '00') {
        payment.status = 'failed';
        payment.vnp_response_code = vnp_ResponseCode;
        await payment.save();
        console.warn('[IPN] Transaction failed:', { txn_ref, vnp_ResponseCode });
        return res.json({ RspCode: '00', Message: 'Confirm Success' });
      }

      // Bước 6: Kiểm tra số tiền khớp (VNPay gửi amount * 100)
      if (vnp_Amount / 100 !== payment.amount) {
        console.error('[IPN] Amount mismatch:', { expected: payment.amount, received: vnp_Amount / 100 });
        return res.json({ RspCode: '04', Message: 'Invalid Amount' });
      }

      // Bước 7: ✅ Cộng credit và set success (Atomic)
      await payment.updateOne({ status: 'success', vnp_response_code: '00' });
      await User.findByIdAndUpdate(payment.user_id, {
        $inc: { ai_credits: payment.credits_purchased }
      });

      console.log(`[IPN] ✅ Success: ${txn_ref} | +${payment.credits_purchased} credits → user ${payment.user_id}`);
      return res.json({ RspCode: '00', Message: 'Confirm Success' });

    } catch (error) {
      console.error('[IPN] Server error:', error);
      return res.json({ RspCode: '99', Message: 'Unknown Error' });
    }
  }

  // GET /api/payment/status/:txn_ref — Polling endpoint
  async getPaymentStatus(req, res) {
    try {
      const payment = await Payment.findOne({ txn_ref: req.params.txn_ref });
      if (!payment) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });
      }

      res.json({
        success: true,
        data: {
          txn_ref: payment.txn_ref,
          status: payment.status,
          amount: payment.amount,
          credits_purchased: payment.credits_purchased,
          createdAt: payment.createdAt
        }
      });
    } catch (error) {
      console.error('getPaymentStatus error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }

  // GET /api/payment/admin/transactions — Admin: Lịch sử giao dịch
  async adminGetTransactions(req, res) {
    try {
      const { page = 1, limit = 12, status, search } = req.query;
      const limitNum = parseInt(limit);
      const skipNum = (parseInt(page) - 1) * limitNum;

      const where = {};
      if (status) where.status = status;

      if (search) {
        const { User: UserModel } = require('../models');
        const matchUsers = await UserModel.find({
          $or: [
            { email: new RegExp(search, 'i') },
            { full_name: new RegExp(search, 'i') }
          ]
        }).select('_id');
        where.user_id = { $in: matchUsers.map(u => u._id) };
      }

      const total = await Payment.countDocuments(where);
      const payments = await Payment.find(where)
        .sort({ createdAt: -1 })
        .limit(limitNum)
        .skip(skipNum)
        .lean();

      const { User: UserModel } = require('../models');
      const userIds = [...new Set(payments.map(p => p.user_id))];
      const users = await UserModel.find({ _id: { $in: userIds } }).select('_id full_name email').lean();
      const userMap = {};
      users.forEach(u => { userMap[u._id] = u; });

      const result = payments.map(p => ({
        ...p,
        user: userMap[p.user_id] || null
      }));

      const stats = await Payment.aggregate([
        { $match: { status: 'success' } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
            totalCredits: { $sum: '$credits_purchased' },
            totalOrders: { $sum: 1 }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          payments: result,
          pagination: { total, page: parseInt(page), limit: limitNum, totalPages: Math.ceil(total / limitNum) },
          stats: stats[0] || { totalRevenue: 0, totalCredits: 0, totalOrders: 0 }
        }
      });
    } catch (error) {
      console.error('adminGetTransactions error:', error);
      res.status(500).json({ success: false, message: 'Lỗi server' });
    }
  }
}

module.exports = new PaymentController();
