import { describe, it } from 'node:test';
import assert from 'node:assert';
import tripService from '../../../src/services/trip.service.js';
import tripRepository from '../../../src/repositories/trip.repository.js';

describe('Services: TripService Unit Test Suite', () => {
  it('Ném lỗi 404 nếu không tìm thấy lịch trình theo ID', async () => {
    const originalGetTripByIdWithDetails = tripRepository.getTripByIdWithDetails;
    tripRepository.getTripByIdWithDetails = async () => null;

    try {
      await assert.rejects(
        async () => {
          await tripService.getTripById('non_existent_id', { id: 1 });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 404);
          assert.match(err.message, /Không tìm thấy lịch trình/i);
          return true;
        }
      );
    } finally {
      tripRepository.getTripByIdWithDetails = originalGetTripByIdWithDetails;
    }
  });

  it('Chặn xem nếu lịch trình ở chế độ riêng tư và không phải chủ sở hữu (Forbidden 403)', async () => {
    const mockTrip = {
      id: 99,
      user_id: 1, // Chủ sở hữu là user 1
      is_public: false,
      title: 'Lịch trình bí mật'
    };

    const originalGetTripByIdWithDetails = tripRepository.getTripByIdWithDetails;
    const originalIsAttachedToPublicPost = tripRepository.isAttachedToPublicPost;

    tripRepository.getTripByIdWithDetails = async () => mockTrip;
    tripRepository.isAttachedToPublicPost = async () => false;

    try {
      await assert.rejects(
        async () => {
          // User 2 (không phải chủ) cố xem
          await tripService.getTripById(99, { id: 2 });
        },
        (err) => {
          assert.strictEqual(err.statusCode, 403);
          assert.match(err.message, /chế độ riêng tư/i);
          return true;
        }
      );
    } finally {
      tripRepository.getTripByIdWithDetails = originalGetTripByIdWithDetails;
      tripRepository.isAttachedToPublicPost = originalIsAttachedToPublicPost;
    }
  });

  it('Cho phép chủ sở hữu xem lịch trình của chính mình', async () => {
    const mockTrip = {
      id: 100,
      user_id: 1,
      is_public: false,
      title: 'Lịch trình của tôi'
    };

    const originalGetTripByIdWithDetails = tripRepository.getTripByIdWithDetails;
    const originalIsAttachedToPublicPost = tripRepository.isAttachedToPublicPost;

    tripRepository.getTripByIdWithDetails = async () => mockTrip;
    tripRepository.isAttachedToPublicPost = async () => false;

    try {
      const result = await tripService.getTripById(100, { id: 1 });
      assert.strictEqual(result.id, 100);
      assert.strictEqual(result.title, 'Lịch trình của tôi');
    } finally {
      tripRepository.getTripByIdWithDetails = originalGetTripByIdWithDetails;
      tripRepository.isAttachedToPublicPost = originalIsAttachedToPublicPost;
    }
  });
});
