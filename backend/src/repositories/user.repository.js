import BaseRepository from './base.repository.js';
import { User } from '../models/index.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email) {
    if (!email) return null;
    return await this.model.findOne({ email: email.trim().toLowerCase() });
  }

  async findByIdWithoutPassword(id) {
    return await this.model.findById(id).select('-password');
  }

  async updateOtp(userId, otpCode, otpExpires) {
    return await this.model.findByIdAndUpdate(userId, {
      otp_code: otpCode,
      otp_expires_at: otpExpires
    }, { new: true });
  }

  async resetPassword(userId, hashedPassword) {
    return await this.model.findByIdAndUpdate(userId, {
      password: hashedPassword,
      otp_code: null,
      otp_expires_at: null
    }, { new: true });
  }

  async addAiCredits(userId, credits) {
    return await this.model.findByIdAndUpdate(
      userId,
      {
        $inc: { ai_credits: credits },
        $set: { is_vip: true }
      },
      { new: true }
    );
  }

  async deductAiCredit(userId) {
    return await this.model.findByIdAndUpdate(
      userId,
      { $inc: { ai_credits: -1 } },
      { new: true }
    );
  }

  async getUsersList({ search, status, role, page = 1, limit = 20 }) {
    const limitNum = parseInt(limit);
    const skipNum = (parseInt(page) - 1) * limitNum;

    const where = {};
    if (status === 'active') where.is_active = true;
    if (status === 'banned') where.is_active = false;
    if (role) where.role = role;

    if (search) {
      where.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const count = await this.model.countDocuments(where);
    const users = await this.model.find(where)
      .sort({ created_at: -1 })
      .limit(limitNum)
      .skip(skipNum);

    return {
      users,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum)
      }
    };
  }
}

const repoInstance = new UserRepository();
export { repoInstance as UserRepository };
export default repoInstance;
