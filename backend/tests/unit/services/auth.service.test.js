import { describe, it } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import authService from '../../../src/services/auth.service.js';
import userRepository from '../../../src/repositories/user.repository.js';
import tokenUtil from '../../../src/utils/token.util.js';

describe('Services: AuthService Unit Test Suite', () => {
  it('Chặn đăng ký nếu email đã được sử dụng (Conflict 409)', async () => {
    // Mock user đã tồn tại
    const originalFindByEmail = userRepository.findByEmail;
    userRepository.findByEmail = async () => ({ id: 1, email: 'exists@travelshare.vn' });

    try {
      await assert.rejects(
        async () => {
          await authService.register({
            email: 'exists@travelshare.vn',
            password: 'Password123!',
            full_name: 'Existing User'
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 409);
          assert.match(err.message, /Email đã được sử dụng/i);
          return true;
        }
      );
    } finally {
      userRepository.findByEmail = originalFindByEmail;
    }
  });

  it('Đăng nhập thành công trả về User info, Access Token và Refresh Token', async () => {
    const rawPassword = 'Password123!';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const mockUser = {
      id: 101,
      email: 'john@travelshare.vn',
      password: hashedPassword,
      full_name: 'John Doe',
      role: 'user',
      is_active: true
    };

    const originalFindByEmail = userRepository.findByEmail;
    userRepository.findByEmail = async () => mockUser;

    try {
      const result = await authService.login({
        email: 'john@travelshare.vn',
        password: rawPassword
      });

      assert.ok(result);
      assert.strictEqual(result.user.email, mockUser.email);
      assert.strictEqual(result.user.full_name, mockUser.full_name);
      assert.ok(result.accessToken);
      assert.ok(result.refreshToken);

      // Verify token payload
      const decoded = tokenUtil.verifyAccessToken(result.accessToken);
      assert.strictEqual(decoded.id, mockUser.id);
    } finally {
      userRepository.findByEmail = originalFindByEmail;
    }
  });

  it('Chặn đăng nhập nếu mật khẩu không đúng (Unauthorized 401)', async () => {
    const hashedPassword = await bcrypt.hash('CorrectPassword', 10);
    const mockUser = {
      id: 102,
      email: 'user@travelshare.vn',
      password: hashedPassword,
      is_active: true
    };

    const originalFindByEmail = userRepository.findByEmail;
    userRepository.findByEmail = async () => mockUser;

    try {
      await assert.rejects(
        async () => {
          await authService.login({
            email: 'user@travelshare.vn',
            password: 'WrongPassword'
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 401);
          assert.match(err.message, /Email hoặc mật khẩu không đúng/i);
          return true;
        }
      );
    } finally {
      userRepository.findByEmail = originalFindByEmail;
    }
  });

  it('Chặn đăng nhập nếu tài khoản bị khóa (Forbidden 403)', async () => {
    const rawPassword = 'Password123!';
    const hashedPassword = await bcrypt.hash(rawPassword, 10);
    const mockBannedUser = {
      id: 103,
      email: 'banned@travelshare.vn',
      password: hashedPassword,
      is_active: false // Đã bị khóa
    };

    const originalFindByEmail = userRepository.findByEmail;
    userRepository.findByEmail = async () => mockBannedUser;

    try {
      await assert.rejects(
        async () => {
          await authService.login({
            email: 'banned@travelshare.vn',
            password: rawPassword
          });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.match(err.message, /Tài khoản đã bị khóa/i);
          return true;
        }
      );
    } finally {
      userRepository.findByEmail = originalFindByEmail;
    }
  });
});
