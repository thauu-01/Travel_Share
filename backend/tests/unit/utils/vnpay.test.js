import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  sortObject,
  computeHmacFromSorted,
  getVNPayDateFormat
} from '../../../src/utils/vnpay.util.js';

describe('Utils: VNPay Helper Test Suite', () => {
  it('Sắp xếp object theo thứ tự bảng chữ cái alphabet', () => {
    const input = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_Amount: 5000000,
      vnp_TmnCode: 'TRAVEL01'
    };
    const sorted = sortObject(input);
    const keys = Object.keys(sorted);

    assert.deepStrictEqual(keys, ['vnp_Amount', 'vnp_Command', 'vnp_TmnCode', 'vnp_Version']);
  });

  it('Tính mã băm HMAC-SHA512 đồng nhất và chính xác', () => {
    const sorted = { a: '1', b: '2' };
    const secret = 'secret_test_key';
    const hash1 = computeHmacFromSorted(sorted, secret);
    const hash2 = computeHmacFromSorted(sorted, secret);

    assert.strictEqual(hash1, hash2);
    assert.strictEqual(hash1.length, 128); // 128 ký tự hex cho SHA-512
  });

  it('Định dạng ngày VNPay theo đúng 14 ký tự YYYYMMDDHHmmss', () => {
    const formattedDate = getVNPayDateFormat(new Date());
    assert.strictEqual(formattedDate.length, 14);
    assert.match(formattedDate, /^\d{14}$/);
  });
});
