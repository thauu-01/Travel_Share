const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./counter');

const postImageSchema = new mongoose.Schema({
  _id: Number,
  post_id: { type: Number, ref: 'Post', required: true },
  image_url: { type: String, required: true },
  is_cover: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

postImageSchema.virtual('id').get(function() {
  return this._id;
});

// Virtual Relations
postImageSchema.virtual('post', {
  ref: 'Post',
  localField: 'post_id',
  foreignField: '_id',
  justOne: true
});

postImageSchema.pre('save', async function(next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequenceValue('post_images');
  }
  next();
});

module.exports = mongoose.model('PostImage', postImageSchema);
