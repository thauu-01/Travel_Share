const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./counter');

const paymentSchema = new mongoose.Schema({
  _id: Number,
  user_id: { type: Number, ref: 'User', required: true },
  txn_ref: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },              // Đơn vị: VNĐ (server tự tính)
  credits_purchased: { type: Number, required: true },   // Số credit mua — lưu cứng tại thời điểm giao dịch
  order_info: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'expired'],
    default: 'pending'
  },
  vnp_response_code: { type: String, default: null }
  // Không TTL index — giữ record vĩnh viễn cho đối soát/báo cáo Admin
}, { timestamps: true }); // → tự sinh createdAt & updatedAt (camelCase nhất quán)

paymentSchema.index({ txn_ref: 1 }, { unique: true });
paymentSchema.index({ user_id: 1 });

paymentSchema.pre('save', async function () {
  if (this.isNew && !this._id) {
    this._id = await getNextSequenceValue('payments');
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
