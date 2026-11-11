import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  validateRegister,
  validateLogin,
  validateForgotPassword
} from '../../../src/validators/auth.validator.js';

describe('Validators: Auth Validator Test Suite', () => {
  it('Chặn đăng ký nếu thiếu thông tin bắt buộc', () => {
    const req = { body: { email: '', password: '', full_name: '' } };
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status(s) { statusSent = s; return this; },
      json(j) { jsonSent = j; return this; }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    validateRegister(req, res, next);

    assert.strictEqual(statusSent, 400);
    assert.strictEqual(jsonSent.success, false);
    assert.strictEqual(nextCalled, false);
  });

  it('Chặn đăng ký nếu email sai định dạng', () => {
    const req = { body: { email: 'invalid-email', password: 'password123', full_name: 'Test' } };
    let statusSent = null;
    let jsonSent = null;
    const res = {
      status(s) { statusSent = s; return this; },
      json(j) { jsonSent = j; return this; }
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    validateRegister(req, res, next);

    assert.strictEqual(statusSent, 400);
    assert.match(jsonSent.message, /email/i);
    assert.strictEqual(nextCalled, false);
  });

  it('Cho phép đi tiếp vào controller nếu dữ liệu hợp lệ', () => {
    const req = { body: { email: 'valid@travelshare.vn', password: 'password123', full_name: 'Test' } };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    validateRegister(req, {}, next);

    assert.strictEqual(nextCalled, true);
  });
});
