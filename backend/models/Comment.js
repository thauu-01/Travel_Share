const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./counter');

const commentSchema = new mongoose.Schema({
  _id: Number,
  content: { type: String, required: true },
  user_id: { type: Number, ref: 'User', required: true },
  post_id: { type: Number, ref: 'Post', required: true },
  parent_id: { type: Number, ref: 'Comment', default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

commentSchema.virtual('id').get(function() {
  return this._id;
});

// Virtual Relations
commentSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

commentSchema.virtual('post', {
  ref: 'Post',
  localField: 'post_id',
  foreignField: '_id',
  justOne: true
});

commentSchema.virtual('parent', {
  ref: 'Comment',
  localField: 'parent_id',
  foreignField: '_id',
  justOne: true
});

commentSchema.virtual('replies', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parent_id'
});

commentSchema.pre('save', async function() {
  if (this.isNew && !this._id) {
    this._id = await getNextSequenceValue('comments');
  }
});

module.exports = mongoose.model('Comment', commentSchema);
