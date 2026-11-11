import dotenv from 'dotenv';
dotenv.config();
import { PACKAGES } from './constants.js';

export const vnpayConfig = {
  tmnCode: (process.env.VNPAY_TMN_CODE || '').trim(),
  hashSecret: (process.env.VNPAY_HASH_SECRET || '').trim(),
  url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:5173/payment/vnpay-return',
  packages: PACKAGES
};

export default vnpayConfig;
