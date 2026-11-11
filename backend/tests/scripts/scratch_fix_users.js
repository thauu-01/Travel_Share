const mongoose = require('mongoose');
require('dotenv').config();
const { User } = require('./models');

async function fixAllUsers() {
  await mongoose.connect(process.env.MONGODB_URI);

  const result = await User.updateMany(
    { $or: [{ ai_credits: { $exists: false } }, { ai_credits: null }] },
    { $set: { ai_credits: 1, is_vip: false } }
  );
  console.log('Migration result:', result);

  const u2 = await User.findById(2);
  console.log('User 2 after migration:', u2 ? { _id: u2._id, email: u2.email, ai_credits: u2.ai_credits, is_vip: u2.is_vip } : 'NULL');

  const uUpdate = await User.findOneAndUpdate(
    { _id: 2, $or: [{ ai_credits: { $gt: 0 } }, { is_vip: true }] },
    { $inc: { ai_credits: 0 } },
    { returnDocument: 'after' }
  );
  console.log('findOneAndUpdate test on User 2:', uUpdate ? 'SUCCESS' : 'FAILED');

  await mongoose.disconnect();
}
fixAllUsers();
