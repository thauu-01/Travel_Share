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
    req.headers = reqOptions.headers || { host: 'localhost' };
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

describe('Integration: API Health & Router Test Suite', () => {
  it('Endpoint /api/health trả về status 200 running', async () => {
    const res = await invokeExpress({ method: 'GET', url: '/api/health' });
    assert.strictEqual(res.statusCode, 200);

    const json = res.json();
    assert.ok(json);
    assert.strictEqual(json.status, 'running');
    assert.strictEqual(json.message, 'TravelShare API');
  });

  it('Endpoint không tồn tại trả về status 404', async () => {
    const res = await invokeExpress({ method: 'GET', url: '/api/invalid-endpoint-xyz' });
    assert.strictEqual(res.statusCode, 404);

    const json = res.json();
    assert.ok(json);
    assert.strictEqual(json.success, false);
    assert.strictEqual(json.message, 'Endpoint không tồn tại');
  });

  it('Root endpoint / trả về status 200', async () => {
    const res = await invokeExpress({ method: 'GET', url: '/' });
    assert.strictEqual(res.statusCode, 200);

    const json = res.json();
    assert.ok(json);
    assert.strictEqual(json.status, 'running');
  });

  it('Admin endpoint /api/comments/admin/all tồn tại (trả về 401 khi chưa đăng nhập thay vì 404)', async () => {
    const res = await invokeExpress({ method: 'GET', url: '/api/comments/admin/all' });
    assert.strictEqual(res.statusCode, 401);
  });

  it('Admin endpoint /api/places/admin/list tồn tại (trả về 401 khi chưa đăng nhập thay vì 404)', async () => {
    const res = await invokeExpress({ method: 'GET', url: '/api/places/admin/list' });
    assert.strictEqual(res.statusCode, 401);
  });

  it('Admin endpoint /api/chat/admin/threads tồn tại (trả về 401 khi chưa đăng nhập thay vì 404)', async () => {
    const res = await invokeExpress({ method: 'GET', url: '/api/chat/admin/threads' });
    assert.strictEqual(res.statusCode, 401);
  });

  it('Admin endpoint /api/payment/admin/transactions tồn tại (trả về 401 khi chưa đăng nhập thay vì 404)', async () => {
    const res = await invokeExpress({ method: 'GET', url: '/api/payment/admin/transactions' });
    assert.strictEqual(res.statusCode, 401);
  });

  it('Admin endpoint /api/notifications/broadcast tồn tại (trả về 401 khi chưa đăng nhập thay vì 404)', async () => {
    const res = await invokeExpress({ method: 'POST', url: '/api/notifications/broadcast' });
    assert.strictEqual(res.statusCode, 401);
  });

  it('Admin endpoint /api/chat/admin/:userId tồn tại (trả về 401 khi chưa đăng nhập thay vì 404)', async () => {
    const res = await invokeExpress({ method: 'GET', url: '/api/chat/admin/3' });
    assert.strictEqual(res.statusCode, 401);
  });

  it('Admin endpoint /api/chat/admin/:userId/send tồn tại (trả về 401 khi chưa đăng nhập thay vì 404)', async () => {
    const res = await invokeExpress({ method: 'POST', url: '/api/chat/admin/3/send' });
    assert.strictEqual(res.statusCode, 401);
  });
});
