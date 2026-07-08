const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./counter');

const notificationSchema = new mongoose.Schema({
  _id: Number,
  user_id: { type: Number, ref: 'User', required: true },
  from_user_id: { type: Number, ref: 'User', default: null },
  type: { type: String, enum: ['like', 'comment', 'reply'], required: true },
  post_id: { type: Number, ref: 'Post', default: null },
  message: { type: String, default: null },
  is_read: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

notificationSchema.virtual('id').get(function() {
  return this._id;
});

// Virtual Relations
notificationSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

notificationSchema.virtual('fromUser', {
  ref: 'User',
  localField: 'from_user_id',
  foreignField: '_id',
  justOne: true
});

notificationSchema.virtual('post', {
  ref: 'Post',
  localField: 'post_id',
  foreignField: '_id',
  justOne: true
});

notificationSchema.pre('save', async function() {
  if (this.isNew && !this._id) {
    this._id = await getNextSequenceValue('notifications');
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
