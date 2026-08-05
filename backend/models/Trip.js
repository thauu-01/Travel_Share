const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./counter');

const tripSchema = new mongoose.Schema({
  _id: Number,
  title: { type: String, required: true },
  description: { type: String, default: null },
  user_id: { type: Number, ref: 'User', required: true },
  start_date: { type: Date, default: null },
  end_date: { type: Date, default: null },
  total_days: { type: Number, default: 1 },
  is_public: { type: Boolean, default: true }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

tripSchema.virtual('id').get(function() {
  return this._id;
});

// Virtual Relations
tripSchema.virtual('user', {
  ref: 'User',
  localField: 'user_id',
  foreignField: '_id',
  justOne: true
});

tripSchema.virtual('days', {
  ref: 'TripDay',
  localField: '_id',
  foreignField: 'trip_id'
});

tripSchema.pre('save', async function() {
  if (this.isNew && !this._id) {
    this._id = await getNextSequenceValue('trips');
  }
  if (this.start_date && this.end_date) {
    const start = new Date(this.start_date).setUTCHours(0, 0, 0, 0);
    const end = new Date(this.end_date).setUTCHours(0, 0, 0, 0);
    const diffDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    this.total_days = Math.max(1, diffDays);
  }
});

module.exports = mongoose.model('Trip', tripSchema);
