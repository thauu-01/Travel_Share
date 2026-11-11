import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  userPublicInfo
} from '../../../src/utils/token.util.js';

describe('Utils: Token & JWT Test Suite', () => {
  const mockUser = {
    id: 999,
    email: 'test@travelshare.vn',
    full_name: 'Nguyễn Văn Test',
    role: 'user',
    is_vip: true,
    ai_credits: 5
  };

  it('Sinh và giải mã access token thành công', () => {
    const token = generateAccessToken(mockUser);
    assert.ok(typeof token === 'string' && token.length > 20);

    const decoded = verifyAccessToken(token);
    assert.strictEqual(decoded.id, mockUser.id);
    assert.strictEqual(decoded.email, mockUser.email);
    assert.strictEqual(decoded.role, mockUser.role);
  });

  it('Sinh và giải mã refresh token thành công', () => {
    const refreshToken = generateRefreshToken(mockUser);
    assert.ok(typeof refreshToken === 'string' && refreshToken.length > 20);

    const decoded = verifyRefreshToken(refreshToken);
    assert.strictEqual(decoded.id, mockUser.id);
  });

  it('userPublicInfo loại bỏ mật khẩu và định dạng đúng', () => {
    const publicInfo = userPublicInfo({
      ...mockUser,
      password: 'secret_hashed_password'
    });

    assert.strictEqual(publicInfo.id, mockUser.id);
    assert.strictEqual(publicInfo.email, mockUser.email);
    assert.strictEqual(publicInfo.password, undefined);
    assert.strictEqual(publicInfo.is_vip, true);
    assert.strictEqual(publicInfo.ai_credits, 5);
  });
});
