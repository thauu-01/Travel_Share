const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./counter');

const viewHistorySchema = new mongoose.Schema({
  _id: Number,
  user_id: { type: Number, ref: 'User', required: true },
  post_id: { type: Number, ref: 'Post', required: true },
  viewed_at: { type: Date, default: Date.now }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

viewHistorySchema.virtual('id').get(function() {
  return this._id;
});

// Virtual Relations
viewHistorySchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

viewHistorySchema.virtual('post', {
  ref: 'Post',
  localField: 'post_id',
  foreignField: '_id',
  justOne: true
});

viewHistorySchema.pre('save', async function() {
  if (this.isNew && !this._id) {
    this._id = await getNextSequenceValue('view_history');
  }
});

module.exports = mongoose.model('ViewHistory', viewHistorySchema);
