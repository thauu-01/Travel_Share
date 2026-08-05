const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./counter');

const postSchema = new mongoose.Schema({
  _id: Number,
  title: { type: String, required: true },
  content: { type: String, required: true },
  user_id: { type: Number, ref: 'User', required: true },
  place_id: { type: Number, ref: 'Place', default: null },
  trip_id: { type: Number, ref: 'Trip', default: null },
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

postSchema.virtual('trip', {
  ref: 'Trip',
  localField: 'trip_id',
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

// Helper to recalculate place's average rating
async function updatePlaceAvgRating(placeId) {
  if (!placeId) return;
  const Post = mongoose.model('Post');
  const Place = mongoose.model('Place');
  
  try {
    const result = await Post.aggregate([
      { $match: { place_id: placeId, rating: { $ne: null } } },
      { $group: { _id: '$place_id', avgRating: { $avg: '$rating' } } }
    ]);
    
    let avg = 0;
    if (result.length > 0) {
      avg = Math.round(result[0].avgRating * 10) / 10; // Round to 1 decimal place
    }
    
    await Place.findByIdAndUpdate(placeId, { avg_rating: avg });
  } catch (error) {
    console.error('Error recalculating avg_rating:', error);
  }
}

postSchema.post('save', async function(doc) {
  await updatePlaceAvgRating(doc.place_id);
});

postSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    await updatePlaceAvgRating(doc.place_id);
  }
});

postSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await updatePlaceAvgRating(doc.place_id);
  }
});

postSchema.post('deleteOne', { document: true, query: false }, async function(doc) {
  await updatePlaceAvgRating(doc.place_id);
});

module.exports = mongoose.model('Post', postSchema);
