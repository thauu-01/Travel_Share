const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./counter');

const placeSchema = new mongoose.Schema({
  _id: Number,
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, default: null },
  province: { type: String, required: true },
  address: { type: String, default: null },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  cover_image: { type: String, default: null },
  category_id: { type: Number, ref: 'Category', default: null },
  user_id: { type: Number, ref: 'User', required: true },
  avg_rating: { type: Number, default: 0.00 },
  view_count: { type: Number, default: 0 }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

placeSchema.virtual('id').get(function() {
  return this._id;
});

// Virtual Relations
placeSchema.virtual('category', {
  ref: 'Category',
  localField: 'category_id',
  foreignField: '_id',
  justOne: true
});

placeSchema.virtual('creator', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

placeSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'place_id'
});

placeSchema.pre('save', async function() {
  if (this.isNew && !this._id) {
    this._id = await getNextSequenceValue('places');
  }
});

module.exports = mongoose.model('Place', placeSchema);
