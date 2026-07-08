const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./counter');

const postSchema = new mongoose.Schema({
  _id: Number,
  title: { type: String, required: true },
  content: { type: String, required: true },
  user_id: { type: Number, ref: 'User', required: true },
  place_id: { type: Number, ref: 'Place', default: null },
  rating: { type: Number, default: null, min: 1, max: 5 },
  status: { type: String, enum: ['draft', 'published', 'hidden', 'archived'], default: 'published' },
  is_hidden: { type: Boolean, default: false },
  view_count: { type: Number, default: 0 }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

postSchema.virtual('id').get(function() {
  return this._id;
});

// Virtual Relations
postSchema.virtual('author', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

postSchema.virtual('place', {
  ref: 'Place',
  localField: 'place_id',
  foreignField: '_id',
  justOne: true
});

postSchema.virtual('images', {
  ref: 'PostImage',
  localField: '_id',
  foreignField: 'post_id'
});

postSchema.virtual('likes', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'post_id'
});

postSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post_id'
});

postSchema.virtual('views', {
  ref: 'ViewHistory',
  localField: '_id',
  foreignField: 'post_id'
});

postSchema.pre('save', async function() {
  if (this.isNew && !this._id) {
    this._id = await getNextSequenceValue('posts');
  }
});

module.exports = mongoose.model('Post', postSchema);
