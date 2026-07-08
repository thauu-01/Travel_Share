const mongoose = require('mongoose');
const { getNextSequenceValue } = require('./counter');

const chatMessageSchema = new mongoose.Schema({
  _id: Number,
  user_id: { type: Number, ref: 'User', required: true },
  sender_type: { type: String, enum: ['user', 'admin', 'ai'], default: 'user' },
  message: { type: String, required: true },
  is_read_by_admin: { type: Boolean, default: false }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

chatMessageSchema.virtual('id').get(function() { return this._id; });
chatMessageSchema.virtual('user', { ref: 'User', localField: 'user_id', foreignField: '_id', justOne: true });

chatMessageSchema.pre('save', async function() {
  if (this.isNew && !this._id) {
    this._id = await getNextSequenceValue('chat_messages');
  }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
