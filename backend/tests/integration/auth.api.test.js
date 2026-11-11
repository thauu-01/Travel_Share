import { describe, it } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { PassThrough } from 'node:stream';
import app from '../../src/app.js';

function invokeExpress(reqOptions) {
  return new Promise((resolve) => {
    const socket = new PassThrough();
    const req = new http.IncomingMessage(socket);
    req.method = reqOptions.method || 'GET';
    req.url = reqOptions.url || '/';
    req.headers = {
      'content-type': 'application/json',
      host: 'localhost',
      ...(reqOptions.headers || {})
    };
    if (reqOptions.body) {
      req.body = reqOptions.body;
    }

    const res = new http.ServerResponse(req);
    res.assignSocket(socket);

    let resBody = '';
    socket.on('data', (chunk) => {
      resBody += chunk.toString();
    });

    res.on('finish', () => {
      const parts = resBody.split('\r\n\r\n');
      const payload = parts.slice(1).join('\r\n\r\n');
      resolve({
        statusCode: res.statusCode,
        headers: res.getHeaders(),
        body: payload,
        json() {
          try { return JSON.parse(payload); } catch { return null; }
        }
      });
    });

    app.handle(req, res);
  });
}

describe('Integration: Auth API Validation Test Suite', () => {
  it('POST /api/auth/register chặn khi thiếu email hoặc password', async () => {
    const res = await invokeExpress({
      method: 'POST',
      url: '/api/auth/register',
      body: { email: '', password: '', full_name: '' }
    });
    assert.strictEqual(res.statusCode, 400);

    const json = res.json();
    assert.ok(json);
    assert.strictEqual(json.success, false);
    assert.match(json.message, /điền đầy đủ thông tin/i);
  });

  it('POST /api/auth/register chặn khi mật khẩu dưới 6 ký tự', async () => {
    const res = await invokeExpress({
      method: 'POST',
      url: '/api/auth/register',
      body: { email: 'user@travelshare.vn', password: '123', full_name: 'Nguyễn Văn A' }
    });
    assert.strictEqual(res.statusCode, 400);

    const json = res.json();
    assert.ok(json);
    assert.strictEqual(json.success, false);
    assert.match(json.message, /6 ký tự/i);
  });

  it('POST /api/auth/login chặn khi không truyền thông tin đăng nhập', async () => {
    const res = await invokeExpress({
      method: 'POST',
      url: '/api/auth/login',
      body: {}
    });
    assert.strictEqual(res.statusCode, 400);

    const json = res.json();
    assert.ok(json);
    assert.strictEqual(json.success, false);
    assert.match(json.message, /nhập email và mật khẩu/i);
  });

  it('POST /api/auth/forgot-password chặn khi email sai định dạng', async () => {
    const res = await invokeExpress({
      method: 'POST',
      url: '/api/auth/forgot-password',
      body: { email: 'sai-dinh-dang-email' }
    });
    assert.strictEqual(res.statusCode, 400);

    const json = res.json();
    assert.ok(json);
    assert.strictEqual(json.success, false);
    assert.match(json.message, /email không hợp lệ/i);
  });
});
