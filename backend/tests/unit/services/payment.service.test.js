import { describe, it } from 'node:test';
import assert from 'node:assert';
import paymentService from '../../../src/services/payment.service.js';
import paymentRepository from '../../../src/repositories/payment.repository.js';
import vnpayConfig from '../../../src/config/vnpay.config.js';
import { sortObject, computeHmacFromSorted } from '../../../src/utils/vnpay.util.js';

describe('Services: PaymentService Unit Test Suite', () => {
  it('Chặn tạo payment URL nếu gói không tồn tại (Bad Request 400)', async () => {
    await assert.rejects(
      async () => {
        await paymentService.createPaymentUrl(1, 'invalid_package_id');
      },
      (err) => {
        assert.strictEqual(err.statusCode, 400);
        assert.match(err.message, /Gói nâng cấp không hợp lệ/i);
        return true;
      }
    );
  });

  it('Tạo payment URL thành công với gói hợp lệ và chữ ký HMAC SHA512', async () => {
    const originalCreate = paymentRepository.create;
    paymentRepository.create = async (data) => data;

    try {
      const result = await paymentService.createPaymentUrl(1, 'ai_5credits', '192.168.1.1');
      assert.ok(result.paymentUrl);
      assert.ok(result.txn_ref);
      assert.match(result.paymentUrl, /vnp_SecureHash=/);
      assert.match(result.paymentUrl, /vnp_TmnCode=/);
      assert.match(result.paymentUrl, /vnp_Amount=5000000/); // 50,000 * 100
    } finally {
      paymentRepository.create = originalCreate;
    }
  });

  it('Phát hiện và từ chối callback giả mạo chữ ký (Invalid Signature)', async () => {
    const originalFindByTxnRef = paymentRepository.findByTxnRef;
    paymentRepository.findByTxnRef = async () => null;

    try {
      const fakeParams = {
        vnp_Amount: '5000000',
        vnp_TxnRef: 'TS123456789',
        vnp_ResponseCode: '00',
        vnp_SecureHash: 'fake_tampered_hash_value'
      };

      const result = await paymentService.verifyVnpayCallback(fakeParams);
      assert.strictEqual(result.isValid, false);
      assert.strictEqual(result.isSuccess, false);
    } finally {
      paymentRepository.findByTxnRef = originalFindByTxnRef;
    }
  });
});
