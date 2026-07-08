const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./counter');

const reportSchema = new mongoose.Schema({
  _id: Number,
  reporter_id: { type: Number, ref: 'User', required: true },
  target_type: { type: String, enum: ['post', 'comment', 'user'], required: true },
  target_id: { type: Number, required: true },
  reason: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'resolved', 'rejected'], default: 'pending' },
  admin_note: { type: String, default: '' },
  resolved_by: { type: Number, ref: 'User', default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

reportSchema.virtual('id').get(function() { return this._id; });
reportSchema.virtual('reporter', { ref: 'User', localField: 'reporter_id', foreignField: '_id', justOne: true });

reportSchema.pre('save', async function() {
  if (this.isNew && !this._id) {
    this._id = await getNextSequenceValue('reports');
  }
});

module.exports = mongoose.model('Report', reportSchema);
