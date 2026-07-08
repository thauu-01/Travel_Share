const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./counter');

const likeSchema = new mongoose.Schema({
  _id: Number,
  user_id: { type: Number, ref: 'User', required: true },
  post_id: { type: Number, ref: 'Post', required: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

likeSchema.index({ user_id: 1, post_id: 1 }, { unique: true });

likeSchema.virtual('id').get(function() {
  return this._id;
});

likeSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

likeSchema.virtual('post', {
  ref: 'Post',
  localField: 'post_id',
  foreignField: '_id',
  justOne: true
});

likeSchema.pre('save', async function() {
  if (this.isNew && !this._id) {
    this._id = await getNextSequenceValue('likes');
  }
});

module.exports = mongoose.model('Like', likeSchema);
