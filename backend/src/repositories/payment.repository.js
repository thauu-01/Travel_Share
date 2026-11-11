import BaseRepository from './base.repository.js';
import { Payment } from '../models/index.js';

class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment);
  }

  async findByTxnRef(txn_ref) {
    return await this.model.findOne({ txn_ref });
  }

  async getUserPayments(userId) {
    return await this.model.find({ user_id: userId }).sort({ created_at: -1 });
  }

  async getAllPaymentsWithUsers({ page = 1, limit = 20 }) {
    const limitNum = parseInt(limit);
    const skipNum = (parseInt(page) - 1) * limitNum;

    const count = await this.model.countDocuments();
    const payments = await this.model.find()
      .populate('user', 'id full_name email')
      .sort({ created_at: -1 })
      .limit(limitNum)
      .skip(skipNum);

    return {
      payments,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum)
      }
    };
  }
}

const repoInstance = new PaymentRepository();
export { repoInstance as PaymentRepository };
export default repoInstance;
