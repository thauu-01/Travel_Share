const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./counter');

const tripPlaceSchema = new mongoose.Schema({
  _id: Number,
  trip_day_id: { type: Number, ref: 'TripDay', required: true },
  place_id: { type: Number, ref: 'Place', default: null },           // null nếu là địa điểm AI tự gợi ý
  custom_place_name: { type: String, default: null },                 // Tên địa điểm AI khi không khớp DB
  order_index: { type: Number, default: 0 },
  note: { type: String, default: null }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

tripPlaceSchema.virtual('id').get(function() {
  return this._id;
});

// Virtual Relations
tripPlaceSchema.virtual('day', {
  ref: 'TripDay',
  localField: 'trip_day_id',
  foreignField: '_id',
  justOne: true
});

tripPlaceSchema.virtual('place', {
  ref: 'Place',
  localField: 'place_id',
  foreignField: '_id',
  justOne: true
});

tripPlaceSchema.pre('save', async function() {
  if (this.isNew && !this._id) {
    this._id = await getNextSequenceValue('trip_places');
  }
});

module.exports = mongoose.model('TripPlace', tripPlaceSchema);
