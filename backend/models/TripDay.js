const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./counter');

const tripDaySchema = new mongoose.Schema({
  _id: Number,
  trip_id: { type: Number, ref: 'Trip', required: true },
  day_number: { type: Number, required: true },
  date: { type: Date, default: null },
  note: { type: String, default: null }
}, {
  timestamps: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

tripDaySchema.virtual('id').get(function() {
  return this._id;
});

// Virtual Relations
tripDaySchema.virtual('trip', {
  ref: 'Trip',
  localField: 'trip_id',
  foreignField: '_id',
  justOne: true
});

tripDaySchema.virtual('places', {
  ref: 'TripPlace',
  localField: '_id',
  foreignField: 'trip_day_id'
});

tripDaySchema.pre('save', async function(next) {
  if (this.isNew && !this._id) {
    this._id = await getNextSequenceValue('trip_days');
  }
  next();
});

module.exports = mongoose.model('TripDay', tripDaySchema);
