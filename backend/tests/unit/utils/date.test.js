import { describe, it } from 'node:test';
import assert from 'node:assert';
import { calculateDaysBetween, formatDate } from '../../../src/utils/date.util.js';

describe('Utils: Date Helper Test Suite', () => {
  it('Tính chính xác số ngày giữa 2 mốc thời gian', () => {
    const start = '2026-06-01';
    const end = '2026-06-05';
    // 1, 2, 3, 4, 5 => 5 ngày
    const days = calculateDaysBetween(start, end);
    assert.strictEqual(days, 5);
  });

  it('Cùng ngày bắt đầu và kết thúc trả về 1 ngày', () => {
    const start = '2026-06-01';
    const end = '2026-06-01';
    const days = calculateDaysBetween(start, end);
    assert.strictEqual(days, 1);
  });

  it('Format ngày chuẩn YYYY-MM-DD', () => {
    const date = new Date('2026-11-20T10:00:00Z');
    const formatted = formatDate(date);
    assert.strictEqual(formatted, '2026-11-20');
  });
});
