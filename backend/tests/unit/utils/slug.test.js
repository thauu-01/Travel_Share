import { describe, it } from 'node:test';
import assert from 'node:assert';
import { slugify } from '../../../src/utils/slug.util.js';

describe('Utils: Slug Test Suite', () => {
  it('Chuyển đổi chuỗi tiếng Việt có dấu thành slug không dấu', () => {
    const input = 'Bãi biển Mỹ Khê - Đà Nẵng';
    const expected = 'bai-bien-my-khe-da-nang';
    assert.strictEqual(slugify(input), expected);
  });

  it('Xử lý ký tự đặc biệt và chữ Đ/đ đúng chuẩn', () => {
    const input = 'Đảo Phú Quốc & Đầm Cù Mông!!!';
    const expected = 'dao-phu-quoc-dam-cu-mong';
    assert.strictEqual(slugify(input), expected);
  });

  it('Trả về chuỗi rỗng khi tham số rỗng hoặc không hợp lệ', () => {
    assert.strictEqual(slugify(''), '');
    assert.strictEqual(slugify(null), '');
    assert.strictEqual(slugify(undefined), '');
  });
});
