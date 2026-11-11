const mongoose = require('mongoose');
require('dotenv').config();
const { User } = require('./models');

async function debugUser2() {
  await mongoose.connect(process.env.MONGODB_URI);
  const uRaw = await User.collection.findOne({ _id: 2 });
  console.log('1. Raw MongoDB Document:', uRaw);

  const uMongoose = await User.findById(2);
  console.log('2. Mongoose findById(2):', uMongoose ? uMongoose.toObject() : 'NULL');

  const uCond1 = await User.findOne({ _id: 2, ai_credits: { $gt: 0 } });
  console.log('3. findOne with ai_credits > 0:', uCond1 ? uCond1.toObject() : 'NULL');

  const uCond2 = await User.findOne({ _id: 2, $or: [{ ai_credits: { $gt: 0 } }, { is_vip: true }] });
  console.log('4. findOne with $or:', uCond2 ? uCond2.toObject() : 'NULL');

  const uUpdate = await User.findOneAndUpdate(
    { _id: 2, $or: [{ ai_credits: { $gt: 0 } }, { is_vip: true }] },
    { $inc: { ai_credits: -1 } },
    { returnDocument: 'after' }
  );
  console.log('5. findOneAndUpdate result:', uUpdate ? uUpdate.toObject() : 'NULL');

  await mongoose.disconnect();
}
debugUser2();
