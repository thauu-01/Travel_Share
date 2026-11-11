import mongoose from 'mongoose';
import { getNextSequenceValue } from './counter.js';

const categorySchema = new mongoose.Schema({
  _id: Number,
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  icon: { type: String, default: '📍' }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

categorySchema.virtual('id').get(function() {
  return this._id;
});

categorySchema.pre('save', async function() {
  if (this.isNew && !this._id) {
    this._id = await getNextSequenceValue('categories');
  }
});

const Category = mongoose.model('Category', categorySchema);
export { Category };
export default Category;
