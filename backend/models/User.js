const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./counter');

const userSchema = new mongoose.Schema({
  _id: Number,
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  full_name: { type: String, required: true },
  avatar_url: { type: String, default: null },
  bio: { type: String, default: null },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  is_active: { type: Boolean, default: true },
  otp_code: { type: String, default: null },
  otp_expires_at: { type: Date, default: null }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.virtual('id').get(function() {
  return this._id;
});

userSchema.pre('save', async function() {
  if (this.isNew && !this._id) {
    this._id = await getNextSequenceValue('users');
  }
});

module.exports = mongoose.model('User', userSchema);
